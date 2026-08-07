---
title: "ClosedLoopBench：把场景契约变成可验证的仿真评估"
description: "一个从 Scenario IR 编译场景交换物、绑定同步回放、接入算法观测并输出 open-loop 评估证据的仿真测试工程。"
year: 2026
timeframe: "2026 - present"
status: active
role: "独立开发：场景编译、运行时契约、观测绑定与评估证据"
stack:
  - Python
  - CARLA 0.9.16
  - OpenSCENARIO / OpenDRIVE
  - ROS2 boundary
  - TransFuser++
  - NuRec / SensorsimService
metrics:
  - "当前交付：CARLA / ROS open-loop evaluation 已完成"
  - "M8：39 帧 × 3 路线 / 68 个动态 actor"
  - "Closed-loop status：blocked；保留 formal route：0 fallback / 0 frame mismatch"
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

## 当前交付：CARLA / ROS open-loop 已完成

虽然仓库名叫 `ClosedLoopBench`，当前正式交付是 **CARLA / ROS open-loop evaluation**。它接收 `TriggerEngine` 输出的 `Scenario IR`，编译成 OpenSCENARIO / OpenDRIVE / CARLA run config，再用固定的 GT 轨迹驱动同步回放、ROS 观测边界、TransFuser++ 推理和评估报告。

这条 CARLA/ROS open-loop 链路已经可以重复运行并保留证据。模型输出可以被记录、对比和评分，但不会改变下一帧 Ego pose；因此它是完成的开环评估交付，不是已验收的闭环驾驶结果。

<div class="project-flow" role="img" aria-label="ClosedLoopBench open-loop evaluation pipeline">
  <div class="project-flow-step"><span>01</span><strong>Scenario IR</strong><small>场景、轨迹、actor、触发条件</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>02</span><strong>Compiler</strong><small>XOSC / XODR / run config</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>03</span><strong>GT Replay</strong><small>同步时间与固定 pose</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>04</span><strong>Evidence</strong><small>观测、推理、指标、报告</small></div>
</div>

## 评测：把场景变成可追溯证据

场景挖掘的结果不是评估结果。真正难的是让同一个场景在不同运行路径中保持身份、时间和传感器来源可追踪，并能解释“模型失败是来自 RGB、LiDAR、标定还是运行时”。因此 ClosedLoopBench 把系统拆成稳定契约：

| 层次 | 负责内容 | 当前可声称的结果 |
| --- | --- | --- |
| Scenario | IR schema、scene identity、actor manifest、时间窗口 | 上游场景意图可复用、可校验 |
| Exchange | `.xosc`、`.xodr`、CARLA run config、共享包 | 不依赖 CARLA 也能生成和检查交换物 |
| Replay | frame id、GT Ego/actor pose、同步回放 | 轨迹回放可重复，下一 pose 由 GT 所有 |
| Observation | native / NuRec / Harmonizer 路线、ROS 边界、hash | 输入来源和跨帧绑定可审计 |
| Evaluation | waypoint、bbox、latency、provenance、fail-closed report | 结果可比较，但仍是 open-loop 指标 |

## LiDAR 问题的发现与 debug

LiDAR debug 是评测过程中得到的诊断案例，不是项目的另一个主标题。M8 固定同一份 Scenario IR、同一个 39 帧窗口和 68 个动态 actor，比较三条输入路线：

| 路线 | RGB | LiDAR | 结果 |
| --- | --- | --- | --- |
| `raw_original` | CARLA native | CARLA native | 66 predictions / 39 matches，vehicle AP50 `0.547`，mAP50 `0.274` |
| `reconstructed` | NuRec RGB | NuRec LiDAR | 35 predictions / 0 matches，mAP50 `0.0` |
| `harmonized` | Harmonizer RGB | 同一份 NuRec LiDAR | 23 predictions / 1 match，mAP50 `0.0016` |

debug 的步骤是：先用 CARLA native RGB/LiDAR 建立 reference，再跑 reconstructed/harmonized 路线；随后检查 LiDAR axis matrix 和 sensor-height compensation，确认几何改善并没有让检测恢复；再只替换一个模态做 cross-input 对照，最后对 live NRE dynamic-LiDAR path 做 A/B probe。

最有价值的不是“重建路线分数低”，而是 cross-input 实验把原因拆开了：`NuRec RGB + raw LiDAR` 有 21 个匹配、mAP50 `0.130`；`raw RGB + NuRec LiDAR` 仍然 0 匹配、mAP50 `0.0`。所以 RGB 不是主要瓶颈，重建 LiDAR 才是当前质量问题。

## 同一帧对比

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

## 闭环愿景：Blocked

下一阶段的目标是把现有评估契约接成真正的 CARLA/ROS 闭环：Ego control 改变下一帧 simulator state，reactive actor 对行为做出响应，并继续使用同一套证据和指标。当前状态是 **blocked**，阻塞点是环境和传感器验收，而不是文档中缺少一张架构图：

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
