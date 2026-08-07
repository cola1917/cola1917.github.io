---
title: "NeuralSceneBridge：面向下游仿真的神经场景重建桥接"
description: "基于 NVIDIA SensorsimService 的 scene-0061 NuRec 重建产物、渲染器交接、动态目标编辑与 RGB/LiDAR 诊断。"
year: 2026
timeframe: "2026 - present"
status: active
role: "独立开发：重建产物、NuRec 运行时与下游证据链"
stack:
  - Python
  - NVIDIA NuRec / NRE
  - gRPC
  - USDZ
  - PANDAR128 LiDAR
metrics:
  - "scene-0061 / 223 tracks / 6 cameras"
  - "V01-V03 回放与编辑 / V04 LiDAR 诊断"
links:
  - label: "GitHub"
    url: "https://github.com/cola1917/NeuralSceneBridge"
  - label: "ClosedLoopBench"
    url: "https://github.com/cola1917/ClosedLoopBench"
featured: true
order: 95
draft: false
locale: zh
---

## 项目定位

`NeuralSceneBridge` 是面向下游仿真的重建桥接项目。它把场景、传感器数据和动态 actor 轨迹固化为有身份约束的 NuRec/USDZ 产物，再通过 NVIDIA `SensorsimService` 提供可复现的 RGB/LiDAR 观测和受控编辑。

当前交付是 **open-loop**：输入是固定场景和轨迹，输出是可复现的渲染结果与诊断报告。它是整个仿真系统的重建与渲染侧，不启动 CARLA，也不拥有 Ego 控制、actor 执行或闭环评估；这些由 `ClosedLoopBench` 接收交接后负责。

> **结论先说：最终 RGB/LiDAR 还没有完成物理对齐。** V04 的 `status: passed` 只表示 385 个渲染窗口和证据捕获 gate 完成，不能解释成“世界坐标和 actor ownership 已对齐”。

## 重建交接

项目对下游输出三类稳定边界：有版本和哈希的 USDZ 场景、包含逻辑时间窗口与坐标系的传感器 RPC contract，以及可复核的帧/视频证据。当前产物可以用于 RGB 回放、actor 编辑、相机 probe 和集成联调；重建 LiDAR 仍作为诊断输入，直到通过下游 actor-aware gate。

`NeuralSceneBridge` 负责重建、artifact identity 和渲染证据；`ClosedLoopBench` 负责 observation boundary、CARLA 时钟、agent runtime 和闭环评估。完整边界见仓库中的 [`docs/downstream_simulation_handoff.md`](https://github.com/cola1917/NeuralSceneBridge/blob/main/docs/downstream_simulation_handoff.md)。

<div class="project-flow" role="img" aria-label="NeuralSceneBridge pipeline">
  <div class="project-flow-step"><span>01</span><strong>Manifest gate</strong><small>USDZ、checkpoint、track inventory</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>02</span><strong>NuRec gRPC</strong><small>render_rgb / render_lidar</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>03</span><strong>Case matrix</strong><small>replay、actor edit、pose sweep、V04</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>04</span><strong>Evidence</strong><small>视频、JSON、质量报告、诊断</small></div>
</div>

## 先把能证明的事情做实

| Case | 操作 | 固化结果 | 能声称什么 |
| --- | --- | --- | --- |
| V01 | 原始轨迹回放，六路相机 3x2 | 20/30 FPS 成片、385 帧、无丢帧 | 场景和传感器请求可复现 |
| V02 | track `c1958768...` 在 world frame 平移 `+0.5m` | A/A/B request digest、RGB repeatability、target-only change | 动态目标编辑会进入 RGB 响应，非目标 digest 不变 |
| V03 | 相机 `x=0.12m`、`y=0.06m`、`yaw=1.0°` 的 bounded sweep | probe summary、底部 pose readout、轨迹极值 | 相机位姿控制边界可测量、可回放 |
| V04 | 原始/编辑 RGB 与 LiDAR 投影四分屏 | 同一逻辑窗口的 renderer evidence | 最终 v2b 视图是诊断，不含 A/A control，也不证明物理对齐 |

## Viewer 结果

以下图片均从最终 playback video 抽帧，四张图统一使用同一段 20 FPS 序列的 `360/385` 帧，因此 V01、V02、V03、V04 可以直接横向对比。图片保留了 viewer 的 camera label、case 标识和 V03 的参数读数，方便面试时说明“请求 -> 画面 -> 证据”的对应关系。

<div class="project-evidence-grid">
  <figure>
    <img src="/projects/neural-scene-bridge/v01-original.jpg" alt="V01 six-camera original NuRec replay in a 3x2 layout" width="1600" height="600" loading="lazy" />
    <figcaption>V01 original replay，frame 360/385：六路相机按固定顺序拼成 3x2 视图，作为后续 edit 和 pose probe 的回放基线。</figcaption>
  </figure>
  <figure>
    <img src="/projects/neural-scene-bridge/v02-edit.jpg" alt="V02 lead vehicle edit in the six-camera NuRec viewer" width="1600" height="600" loading="lazy" />
    <figcaption>V02 lead-vehicle edit，frame 360/385：同一目标的 world-frame `+0.5m` edit 进入 `render_rgb`，图中保留 front camera 和 case 标识。</figcaption>
  </figure>
  <figure>
    <img src="/projects/neural-scene-bridge/v03-camera-sweep.jpg" alt="V03 six-camera bounded camera pose sweep with translation and yaw readout" width="1600" height="600" loading="lazy" />
    <figcaption>V03 camera pose sweep，frame 360/385：底部读数展示了当前 `dx / dy / yaw / progress`，证明相机 pose 不是只写进配置而是进入了 RPC 请求。</figcaption>
  </figure>
</div>

## V04：把“未对齐”变成可诊断的结果

<div class="project-evidence-grid">
  <figure>
    <img src="/projects/neural-scene-bridge/v04-alignment-diagnostic.jpg" alt="V04 four-panel RGB and LiDAR multimodal alignment diagnostic with added and removed points" width="1600" height="900" loading="lazy" />
    <figcaption>V04 multimodal diagnostic，frame 360/385：上排是 original RGB/LiDAR，下排是 lead-vehicle edit RGB 与 LiDAR overlay；蓝/黄点只表示响应差异，不能直接当作目标 actor 的点云标签。</figcaption>
  </figure>
</div>

`ClosedLoopBench` 的 M8 open-loop 记录把这个问题拆成了几步，避免把失败归因到一个未经验证的“坐标不对”上：

| 排查层 | 验证 | 结论 |
| --- | --- | --- |
| 请求层 | 同一组 `dynamic_objects` 传给 RGB；目标 edit 会在真实目标像素处改变 RGB | client 的 `track_id + pose_pair` 调用路径成立 |
| 坐标层 | 修正旧的 NuRec LiDAR axis matrix；再补偿实测约 `-1m` sensor-height offset | 坐标修正是真实改进，但不能解释剩余检测崩溃 |
| 模态隔离 | `NRE RGB + raw LiDAR` 可恢复检测；`raw RGB + NRE LiDAR` 仍然 0 match、mAP50 为 0 | RGB 不是主要瓶颈，重建 LiDAR 才是 |
| 服务端 A/B | target-only / empty / all-minus-target 在真实 ROI 近旁几乎同回波；34.7m 与 100m pose 产生相同的 136 个额外 cells | NuRec 26.04 的 dynamic LiDAR path 没有正确应用 per-track cuboid pose |

更具体地说，live probe 观察到：RGB 会跟随目标 pose；LiDAR 中多数车辆在真实位置没有回波，孤立 vehicle render 反而落在固定散点，约偏前 12m。ClosedLoopBench 的诊断将其归因于 NRE 26.04 server-side dynamic LiDAR renderer，或 checkpoint/runtime convention mismatch：动态高斯看起来被放在 `canonical_position + lidar_extra_signal`，而不是应用每条 track 的 cuboid transform 后再 raycast。这个结论足以阻止错误的多模态质量宣称，但在 NVIDIA 外部确认前，页面把它称为“服务端路径诊断/上游限制”，不冒充已修复的产品 bug。

完整证据保留在 [`ClosedLoopBench/docs/open_loop_m8_debug_log.md`](https://github.com/cola1917/ClosedLoopBench/blob/main/docs/open_loop_m8_debug_log.md) 与论坛版报告 [`nurec_lidar_dynamic_bug_report.md`](https://github.com/cola1917/ClosedLoopBench/blob/main/docs/nurec_lidar_dynamic_bug_report.md)。

对下游仿真而言，当前重建场景可以作为 renderer 使用，但还不能作为 perception-ready 的一致 RGB/LiDAR 传感器流。`NRE RGB + raw LiDAR` 只用于因果归因实验，不能被包装成生产路线。

## 工程边界

- **已完成**：重建 artifact identity gate、223-track inventory 校验、V01/V02/V03 渲染、V02 A/A/B repeatability、V03 bounded camera probe、V04 renderer evidence。
- **未完成**：source-timestamp-faithful full-dynamic replay、真实 RGB/LiDAR actor ownership、可用于感知模型的重建 LiDAR 质量、CARLA closed-loop score。
- **明确不声称**：NeuralSceneBridge 不拥有 CARLA `world.tick()`，也不声称 Ego 会根据渲染结果刹车、避让或改变下一帧轨迹。

下一步是让两个项目共享同一份 timestamp、coordinate frame、sensor pose 和 actor binding contract；然后由 `ClosedLoopBench` 持有 CARLA 同步时钟，重新跑 same-frame actor-aware bbox gate。若上游 LiDAR dynamic path 仍未修复，则先用新 checkpoint/更密的 `lidar-sweeps` 重建验证，而不是在下游继续叠加未经证实的坐标补丁。

## Code map

- `demo/scene0061/manifest.json`：canonical USDZ/checkpoint、scene interval、target track 和 runtime identity。
- `demo/scene0061/cases/`：V01 original replay、V02 lead vehicle edit、V03 camera pose sweep。
- `scripts/render_counterfactual_video.py`：按 case 发送 `render_rgb` 请求并生成带证据的六视角成片。
- <code>scripts/<wbr />render_multimodal_alignment_video.py</code>：V04 RGB/LiDAR capture 与差异 overlay。
- `docs/downstream_simulation_handoff.md`：重建到仿真的职责划分与验收边界。
- `scripts/generate_nurec_quality_report.py`：把 artifact、case、frame、video 和 quality metrics 绑定成正式报告。
- `nurec_scene0061_final/`：本地 playback delivery；视频、USDZ、checkpoint 和原始数据不进入 Git。
