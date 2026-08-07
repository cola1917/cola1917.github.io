---
title: "从检测崩溃到根因：动态 LiDAR 可编辑性的完整 debug"
description: "记录 ClosedLoopBench M8 如何通过控制变量、坐标校正、跨模态 A/B、39 帧三路线评测和 live server probe，定位动态 LiDAR 没有应用 track pose 的过程。"
publishedAt: 2026-08-07
updatedAt: 2026-08-07
tags:
  - carla
  - ros2
  - lidar
  - multimodal
  - debugging
featured: true
draft: false
locale: zh
---

这篇文章记录 ClosedLoopBench M8 中一次完整的传感器问题定位。它不是“跑一个 A/B test，然后说 LiDAR 有问题”，而是从开环测试链路、控制变量、局部修正、跨模态替换，到 live server probe，逐步排除执行、坐标、图像质量和模型分布等其他解释，最后把问题收敛到 **动态 LiDAR 不可编辑**。

## 结论先说

当前已经完成的是 CARLA / ROS2 open-loop test：固定 Scenario IR 的 GT trajectory 负责下一帧 Ego pose，真实 TransFuser++ 通过 ROS2 observation boundary 接收输入并完成推理，模型输出被记录和评测，但不反过来驱动下一帧状态。

M8 的最终结论是：

- reconstructed RGB 不是主要瓶颈；
- reconstructed LiDAR 会让融合检测几乎完全崩溃；
- 通过同帧 cross-input A/B 和更大规模的三路线测试，可以排除偶发单帧、RGB 分布和下游坐标补丁解释；
- live probe 显示，RGB 会跟随 actor pose 编辑，LiDAR dynamic path 却仍使用 stored offset，没有正确应用 per-track cuboid pose；
- 因此问题落在上游 NRE / SensorsimService 的动态 LiDAR rendering path，而不是 ClosedLoopBench 的评测代码。

## 1. 先把测试链路固定下来

如果输入、GT、模型和指标没有固定，低分本身没有诊断价值。M8 先冻结了以下边界：

| 固定项 | 具体内容 |
| --- | --- |
| Scenario | 同一份 Scenario IR、同一条 Ego reference trajectory |
| 时间 | 同一组 frame id、同一 39 帧 scored window |
| GT | 同一份 actor manifest，68 个动态 actor |
| 算法 | 同一份 TransFuser++ runtime、同一套预处理和 bbox scorer |
| 评测 | 同帧、同类别、唯一匹配、oriented BEV IoU、AP25/AP50 |
| 证据 | source frame binding、payload hash、latency、fallback/mismatch |

真正允许变化的变量只有输入路线、传感器模态、LiDAR frame transform、RGB materialization 和 dynamic actor pose request。这个矩阵让每一轮修改都有明确的因果解释。

<div class="project-flow" role="img" aria-label="M8 controlled debugging flow">
  <div class="project-flow-step"><span>01</span><strong>Reference</strong><small>CARLA native RGB/LiDAR</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>02</span><strong>Normalize</strong><small>schema、hash、axis、height</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>03</span><strong>Cross-input</strong><small>只替换 RGB 或 LiDAR</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>04</span><strong>Live probe</strong><small>编辑 actor pose 看响应</small></div>
</div>

## 2. 第一个现象：不是运行失败，而是重建路线检测崩溃

先用 CARLA native RGB/LiDAR 建立 reference，再把相同的 Scenario IR 和 frame contract 绑定到 reconstructed 和 Harmonizer 路线。三条路线都进入真实推理，并生成正式报告：

| Route | RGB | LiDAR | 结果 |
| --- | --- | --- | --- |
| `raw_original` | CARLA native | CARLA native | 66 predictions / 39 matches，vehicle AP50 `0.547`，mAP50 `0.274` |
| `reconstructed` | NuRec RGB | NuRec LiDAR | 35 predictions / 0 matches，mAP50 `0.0` |
| `harmonized` | Harmonizer RGB | 同一份 NuRec LiDAR | 23 predictions / 1 match，mAP50 `0.0016` |

这里有一个重要区分：reconstructed route 并不是因为 frame mismatch、fallback 或报告校验失败而被判定失败。它在 39 帧上完成了推理，失败发生在传感器内容进入融合模型之后。因此可以继续做输入归因。

## 3. 第一轮排查：先排除执行和契约错误

正式调试前，先处理了几类会伪造“模型失败”的工程问题：

- 自定义 report schema 不被共享 validator 接受，改回统一的 `open_loop_multimodal_report.v1`；
- raw payload 缺少 run-specific capture prefix，修复容器路径映射；
- 重用 run id 会污染已有 intermediate directory，正式路线改用唯一 run identity；
- TF++ 首帧 CUDA / model warm-up 触发 timeout，加入同进程 warm-up，并将 warm-up 排除出正式 scored window；
- reconstructed / Harmonizer 的 derived binding 曾引用旧 trace，重新绑定 payload hash、source-frame hash 和 dynamic-object digest；
- formal bbox 从旧的 center-point proxy 升级为 shared actor manifest、GT dimensions/yaw、同帧 oriented IoU 和 unique matching。

这一轮的目标不是提高分数，而是让“分数低”具备可信的执行前提。最终三路线都达到 39/39 frame、0 fallback、0 frame mismatch，说明后续低分不是由运行时丢帧造成的。

## 4. 第二轮排查：LiDAR axis matrix

第一版 reconstructed LiDAR 的 `response_to_sensor` 矩阵把 render vertical axis 映射到了 Ego forward axis。用 CARLA native point cloud 做 NN registration 后，旧矩阵的 `<1 m` overlap 只有 1.67%，而候选修正矩阵可以达到 24.5% 以上。

但候选的简单 axis swap determinant 为 `-1`，违反 NuRec rotation contract。最终采用 determinant 为 `+1` 的纯 `+90° z` rotation：

```text
[ 0 -1  0  0 ]
[ 1  0  0  0 ]
[ 0  0  1  0 ]
[ 0  0  0  1 ]
```

矩阵修复是真修复：reconstructed prediction count 从 4 上升到 19，出现了一个 IoU 0.52 的有效匹配。但 r3 仍然只有 1 个 match，point-cloud overlap 在不同帧只有 8% 到 37%，且没有任何 rigid rotation 或 mirror scan 能恢复到 native LiDAR 的几何。结论是：坐标矩阵有问题，但它不是最终根因。

## 5. 第三轮排查：sensor-height compensation

成对扫描发现 NuRec cloud 相对 CARLA cloud 整体高约 1.02 m，标准差约 0.11 m。于是加入 `-1.0 m` z compensation。

这个修正也是真实的：`<1 m` 3D overlap 从约 25-47% 提升到 62-75%。但检测仍然没有恢复：

- reconstructed r4：35 predictions / 0 matches；
- harmonized r4：23 predictions / 1 match，mAP50 `0.0016`。

进一步检查发现，NuRec 的车辆高度带更密集地包含护栏和静态结构，目标车辆点数反而不足；TF++ boxes 多数跟随静态结构漂移 5-20 m。几何补偿改善了传感器坐标，却没有修复动态物体支持。

## 6. 第四轮排查：RGB resize 是否是混淆变量

r4 的 NuRec RGB 曾被从 800x450 双线性放大到正式 1600x900，再交给 adapter resize。于是重新生成 r5：

- 使用 NuRec 原生 800x450；
- 让 camera-adaptation contract 只做一次 800x450 -> 1024x512；
- 恢复车辆 patch 的 Laplacian sharpness，从约 14 提升到约 192；
- Harmonizer 使用中心裁剪和高质量缩放。

但检测仍没有恢复。r4/r5 的 LiDAR payload byte-identical，BEV vehicle pixels 近似不变，prediction count 也基本持平。这个结果很关键：RGB 清晰度问题存在，但不是 TF++ 融合检测崩溃的主因。

## 7. 第五轮排查：cross-input A/B

前面的修正仍可能被解释成“NuRec RGB 对 TF++ out-of-distribution”。因此做同一帧、同一模型、只替换一个模态的 A/B：

| A/B route | RGB | LiDAR | 结果 |
| --- | --- | --- | --- |
| `mix-a` | NuRec RGB | raw CARLA LiDAR | 37 predictions / 21 matches，vehicle AP50 `0.259`，mAP50 `0.130` |
| `mix-b` | raw CARLA RGB | NuRec LiDAR | 54 predictions / 0 matches，vehicle AP50 `0.0`，mAP50 `0.0` |

`mix-a` 说明真实模型可以在 NuRec RGB 上检测到目标；`mix-b` 使用的却是 raw route 中已经成功的同一套 RGB，结果仍然完全崩溃。这样 RGB 分布假设被直接排除，LiDAR 成为唯一变化且足以解释结果的变量。

## 8. 第六轮排查：纯视觉 sanity check

为了避免“TF++ 需要 LiDAR，所以 RGB 仍可能有隐性问题”的争论，又在同一批 39 帧上做了独立的 image-only check：

- COCO-pretrained YOLOv8n，不做 fine-tuning；
- reconstructed RGB 39/39 帧有车辆检测；
- mean confidence 约 0.53，与 raw CARLA 图像同量级；
- lead vehicle 在所有可见帧中被匹配，目标可见帧为 38/38。

这不是要用 YOLO 替代 TF++，而是为了隔离 RGB 可见性。结果再次支持：RGB 外观可以承载车辆信息，融合模型的崩溃来自 reconstructed LiDAR。

## 9. 放大测试：从单帧假设到 39 帧、68 actor

单个 frame 的可视化很容易误导，所以最终证据没有停在 f18：

- 39 个 scored frames；
- 3 条输入路线；
- 68 个动态 actor，其中包含车辆和行人；
- 一份 shared actor manifest；
- 39/39 intermediates；
- 0 fallback、0 frame mismatch；
- formal oriented BEV bbox evaluation；
- M7 还在相同 open-loop contract 上完成了 3-seed acceptance。

因此结论不是“某一帧 LiDAR 看起来不对”，而是整个输入路线在同一模型和同一 GT 上持续失败。

## 10. 最终 live probe：验证“可编辑性”本身

最后把问题从“重建质量”推进到“编辑操作是否生效”。在 live NRE 26.04 server 上，对同一个 dynamic actor 做以下控制变量：

1. all-controllable；
2. empty dynamic object list；
3. target-only；
4. all-minus-target；
5. 将 target pose 平移 `+5/+3/0 m`。

观测结果：

- target 在真实 track pose 附近几乎没有 LiDAR returns；
- 单独渲染车辆时，约 110-140 个散点的均值偏到前方约 12 m；
- 改变 track pose，LiDAR 只在远处固定方位的 cell 上发生少量变化；
- 同样的 pose edit 会在 RGB 中改变真实目标像素；
- LiDAR extra points 可以和 checkpoint 中 `canonical_pos + lidar_extra_signal` 对上，而不是和 per-track cuboid pose 对上；
- dynamic path 的 offset 最高可达约 45 m。

这一步把结论从“重建 LiDAR 几何差”收敛成了更具体的工程 bug：动态 LiDAR rendering path 没有正确应用每个 track 的 cuboid pose。它因此无法支持可靠的 actor edit，也无法作为下游闭环仿真的可编辑 LiDAR。

<div class="project-evidence-grid">
  <figure>
    <img src="/projects/closed-loop-bench/raw-frame-018.jpg" alt="M8 raw CARLA frame 18" width="1600" height="900" loading="lazy" />
    <figcaption>同一 replay index 的 CARLA native reference。</figcaption>
  </figure>
  <figure>
    <img src="/projects/closed-loop-bench/reconstructed-frame-018.jpg" alt="M8 reconstructed NuRec frame 18" width="1600" height="900" loading="lazy" />
    <figcaption>同一 replay index 的 NuRec observation；RGB 可见性存在，但 LiDAR 几何不满足动态编辑要求。</figcaption>
  </figure>
</div>

## 11. 我们现在能声称什么

可以声称：

- CARLA / ROS2 open-loop test path 已完成；
- 真实 TransFuser++ inference 已接入并有可追溯报告；
- M8 在同一场景上完成了三路线、39 帧、68 actor 的规模化比较；
- 通过控制变量、cross-input A/B 和 live probe，把 LiDAR 动态可编辑性问题定位到上游 rendering path。

不能声称：

- 模型 control 改变了下一帧 Ego pose；
- reactive actor 已在正式 CARLA run 中响应 Ego；
- reconstructed LiDAR 已达到 perception-ready；
- M8 route comparison 是 closed-loop score。

项目页只保留这些结论和少量数字；完整的失败轮次、控制变量和证据链由这篇博客与仓库中的 [`open_loop_m8_debug_log.md`](https://github.com/cola1917/ClosedLoopBench/blob/main/docs/open_loop_m8_debug_log.md) 承载。
