---
title: "ClosedLoopBench：面向真实算法的 CARLA / ROS2 开环测试"
description: "一个从 Scenario IR 驱动 CARLA / ROS2 同步回放、搭载真实 TransFuser++ 推理，并用 A/B 测试定位 LiDAR 动态可编辑性问题的评测工程。"
year: 2026
timeframe: "2026 - present"
status: active
role: "独立开发：CARLA/ROS2 开环测试、真实推理接入、跨模态评测与问题定位"
stack:
  - Python
  - CARLA
  - OpenSCENARIO / OpenDRIVE
  - ROS2
  - TransFuser++
  - NuRec / SensorsimService
metrics:
  - "当前交付：CARLA / ROS2 open-loop test + 真实 TransFuser++ 推理"
  - "M8：39 帧 × 3 路线 / 68 个动态 actor"
  - "0 fallback / 0 frame mismatch；Closed-loop status：blocked"
links:
  - label: "GitHub"
    url: "https://github.com/cola1917/ClosedLoopBench"
  - label: "TriggerEngine"
    url: "https://github.com/cola1917/TriggerEngine"
  - label: "NeuralSceneBridge"
    url: "https://github.com/cola1917/NeuralSceneBridge"
featured: true
order: 90
draft: false
locale: zh
---

## 1. 当前交付：CARLA / ROS2 开环测试

虽然仓库名叫 `ClosedLoopBench`，当前完成的是 **CARLA / ROS2 open-loop test**。它接收 `TriggerEngine` 输出的 `Scenario IR`，生成 CARLA 场景与交换物，用固定 GT 轨迹驱动同步回放，通过 ROS2 观测边界搭载真实 TransFuser++ 推理，并保留可追溯的评测证据。

这条开环测试链路可以重复运行。模型输出会被记录、对比和评分，但不会改变下一帧 Ego pose；因此当前交付是开环测试完成，不是闭环驾驶验收。

<div class="project-flow" role="img" aria-label="ClosedLoopBench open-loop evaluation pipeline">
  <div class="project-flow-step"><span>01</span><strong>Scenario IR</strong><small>场景、轨迹、actor</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>02</span><strong>Compiler</strong><small>XOSC / XODR / run config</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>03</span><strong>ROS2 + TF++</strong><small>真实算法推理</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>04</span><strong>Evidence</strong><small>观测、推理、指标、报告</small></div>
</div>

## 2. 真实算法推理与评测

这不是只生成配置的 compiler demo，而是把真实算法接进同一条可复现的测试链路：

| 阶段 | 实际运行内容 | 证据 |
| --- | --- | --- |
| Native CARLA | CARLA RGB/LiDAR + ROS2/TransFuser++ | 真实推理与中间输出 trace |
| NuRec multimodal | NuRec RGB/LiDAR at pinned GT poses | 39 帧完整推理，0 fallback / 0 frame mismatch |
| M7 acceptance | 同一开环契约跑 3 个 seed | 每个 seed 39/39 帧完成 |
| M8 comparison | native / reconstructed / Harmonizer 三路线 | 39 帧、68 个动态 actor、正式 bbox 评测 |

评测固定同一份 Scenario IR、actor manifest 和 frame clock，输出 waypoint ADE/FDE、延迟、同步健康度、provenance hash 和 actor-aware BEV bbox 指标。指标描述的是固定 GT 轨迹上的算法表现。

## 3. M8：发现 LiDAR 问题

M8 在同一份 Scenario IR、同一个 39 帧窗口和 68 个动态 actor 上比较三条输入路线：

| 路线 | RGB | LiDAR | 结果 |
| --- | --- | --- | --- |
| `raw_original` | CARLA native | CARLA native | 66 predictions / 39 matches，vehicle AP50 `0.547`，mAP50 `0.274` |
| `reconstructed` | NuRec RGB | NuRec LiDAR | 35 predictions / 0 matches，mAP50 `0.0` |
| `harmonized` | Harmonizer RGB | 同一份 NuRec LiDAR | 23 predictions / 1 match，mAP50 `0.0016` |

raw route 是 reference。reconstructed route 能完成 39 帧推理和报告校验，但检测结果接近归零，说明问题不是运行失败，而是传感器输入质量问题。

## 4. LiDAR 诊断摘要

M8 后续在固定 frame clock、actor manifest、模型和 scorer 的前提下，继续做了控制变量、多轮局部修正、cross-input A/B、39 帧规模化评测和 live NRE probe。`NuRec RGB + raw LiDAR` 可以恢复部分检测，而 `raw RGB + NuRec LiDAR` 仍然为 0；移动 actor 会改变 RGB，但 LiDAR 回波不跟随真实 track pose。

因此当前结论不是“LiDAR 分数低”，而是 **dynamic LiDAR path 当前不可编辑**：上游 NRE/SensorsimService 没有正确把 per-track cuboid pose 应用到 LiDAR 渲染。完整的失败轮次、控制变量和证据链见[《从检测崩溃到根因：动态 LiDAR 可编辑性的完整 debug》](/blog/closed-loop-lidar-debug/)，仓库复现记录见 [`open_loop_m8_debug_log.md`](https://github.com/cola1917/ClosedLoopBench/blob/main/docs/open_loop_m8_debug_log.md)。

## 同一帧证据

下面两张图都来自 M8 的 `frame_00000018`，分别是 raw CARLA route 和 reconstructed NuRec route。它们展示的是相同回放索引下的观测输入，不是 Ego 根据模型控制产生的闭环结果。

<div class="project-evidence-grid">
  <figure>
    <img src="/projects/closed-loop-bench/raw-frame-018.jpg" alt="M8 open-loop raw CARLA camera frame 18" width="1600" height="900" loading="lazy" />
    <figcaption>Raw route，frame 18：CARLA native RGB/LiDAR 作为 evaluation reference。</figcaption>
  </figure>
  <figure>
    <img src="/projects/closed-loop-bench/reconstructed-frame-018.jpg" alt="M8 open-loop reconstructed NuRec camera frame 18" width="1600" height="900" loading="lazy" />
    <figcaption>Reconstructed route，frame 18：NuRec RGB 外观可用，但对应 LiDAR 仍未达到 perception-ready。</figcaption>
  </figure>
</div>

## 5. 闭环愿景：Blocked

下一阶段的目标是把现有评估契约接成真正的 CARLA/ROS2 闭环：Ego control 改变下一帧 simulator state，reactive actor 对行为做出响应，并继续使用同一套证据和指标。当前状态是 **blocked**，阻塞点是环境和传感器验收，而不是文档中缺少一张架构图：

- reconstructed dynamic LiDAR 必须先在真实 track pose 上生成回波；
- CARLA `world.tick()` 必须由运行时统一拥有；
- 至少一个 physical actor 必须证明会响应 Ego 行为；
- 真实 ROS2/GPU Ego policy 必须通过 timeout、safe-stop 和 provenance gate。

在这些 gate 通过前，当前项目不声称模型控制改变了下一帧 pose，也不声称 reactive actor 已完成闭环响应。fake runtime、dry-run report 和 GUI smoke 只能验证接口和可观测性，不能替代真实 CARLA/ROS2 闭环验收。

## 下一步：从回放到闭环

未来闭环不是重写当前系统，而是沿着现有契约逐层接入：

1. 冻结 Scene Package、actor binding、timestamp clock 和 sensor calibration。
2. 通过 CARLA `world.tick()` 完成 BasicAgent 的真实同步回放。
3. 接入一个 physical scripted / TrafficManager actor，证明它会随 Ego 状态变化。
4. 通过 ROS2 / TCP plugin boundary 接入一个真实 Ego policy，并记录 timeout、safe-stop 和 control provenance。
5. 在同一时间戳上重新跑 actor-aware RGB/LiDAR gate 和三次 acceptance matrix。

只有这些环境证据通过后，项目才会从 open-loop evaluation 升级为 closed-loop benchmark。当前 M8 的 canonical classification 是 `open_loop_multimodal`。

## Code map

- `runners/build_nuscenes_exchange.py`：从场景生成可移植 exchange package。
- `runners/run_open_loop_transfuserpp_triplicate.py`：运行三路线 open-loop replay/evaluation。
- `runners/compare_open_loop_transfuserpp_triplicate.py`：绑定路线来源和对比证据。
- `metrics/transfuserpp_m8.py`：计算中间输出和 actor-aware BEV 指标。
- `runners/validate_multimodal_closed_loop.py`：未来的 fail-closed sensor gate，目前不等于真实 gate 已通过。
- `docs/open_loop_project_design.md`：当前事实、契约边界和闭环路线图。
