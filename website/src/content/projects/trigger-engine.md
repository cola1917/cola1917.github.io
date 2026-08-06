---
title: "Trigger Engine：把长尾驾驶行为变成可复核的 review case"
description: "面向 Waymo Open Dataset 的可配置规则引擎：从轨迹、地图和交通灯信号中挖掘高价值交互场景，并输出带帧级证据的静态 viewer。"
year: 2026
timeframe: "2026 - present"
status: active
role: "独立开发：架构、规则引擎与评测工具链"
stack:
  - Python
  - Waymo Open Dataset
  - YAML DSL
  - Static HTML viewer
metrics:
  - "5 类 review tag / 183 events（viewer 样例）"
  - "cut_in_confirmed：21 scenes（viewer 样例）"
links:
  - label: "GitHub"
    url: "https://github.com/cola1917/TriggerEngine"
featured: true
order: 100
draft: false
locale: zh
---

## 项目定位

`TriggerEngine` 是一个面向 Waymo Open Dataset interactive TFRecord 的离线规则挖掘 pipeline。它把原始轨迹、地图、交通灯和 VRU 交互信号，转成可以人工复核、可以回归验证的 review case。

这个项目当前处于 **open-loop** 阶段：输入是已采集的场景数据，输出是结构化事件和静态 viewer；它暂时不驱动策略或车辆控制。下一阶段会沿着已有的 `Scenario IR` / `evaluation feedback` contract 接入闭环仿真，形成“触发问题 -> 复现 -> 评估 -> 回灌规则”的循环。

<div class="project-flow" role="img" aria-label="TriggerEngine pipeline">
  <div class="project-flow-step"><span>01</span><strong>Waymo TFRecord</strong><small>轨迹、地图、灯态</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>02</span><strong>AlignmentContext</strong><small>对齐 current / history</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>03</span><strong>Rule + Operator</strong><small>单帧与时序触发</small></div>
  <span class="project-flow-arrow" aria-hidden="true">-&gt;</span>
  <div class="project-flow-step"><span>04</span><strong>Review Viewer</strong><small>证据、回放、规则迭代</small></div>
</div>

## 我解决的核心问题

长尾场景在大规模数据里很稀疏，逐条人工回放成本高；但只做单帧阈值又会产生大量无法解释的误报。因此我把目标定义成：**不是给每一帧贴标签，而是产出一个“为什么触发”的可复核事件。**

## 关键设计

### 1. 配置面与运行面分离

规则先由 YAML DSL 经过 `RuleParser`、`RuleCompiler` 编译为 active `ExecutionPlan`；运行时的 `TriggerEngine.evaluate(context)` 只接收 `AlignmentContext`。这样 operator 的注册、subject 类型和 temporal source tag 可以在运行前校验，避免把配置错误带进批处理。

### 2. 单帧信号组合成有证据的时序事件

单帧规则输出统一的 `TagEvent`，再写入 `TagTimeline`，由 `sustained` / `sequence` 规则组合成 review 级事件。以 cut-in 为例，当前 classic pack 要求同一个 SDC-target pair 在 0.8 秒窗口内按顺序满足：

```text
adjacent_vehicle -> cut_in_lateral_approach -> same_path_overlap
```

把它拆开看，判断过程是：

| 步骤 | 中间 tag | 判断什么 | 结果 |
| --- | --- | --- | --- |
| 01 | `adjacent_vehicle` | 同一 `sdc_pair` 是两个车辆，横向间距约 1.5 - 4.5m，纵向距离不超过 15m | 候选进入视野 |
| 02 | `cut_in_lateral_approach` | 两车都在运动，目标出现朝向 ego 的横向运动，且 heading 正在收敛 | 观察到切入过程 |
| 03 | `same_path_overlap` | ego 仍在运动，pair 进入近似同一路径，横向误差不超过 1.2m | 切入几何关系成立 |
| 04 | `cut_in_confirmed` | 同一个 pair 按上述顺序在 0.8s 内命中；中间允许有未命中帧 | 生成 review 事件 |
| 05 | `cut_in_risk` | 在同一时序窗口内再叠加 `low_ttc_pair` | 提升为更高优先级 review |

所以它不是“某一帧横向距离小就算 cut-in”，而是 `single-frame tags -> TagTimeline -> ordered sequence -> review policy`。最后一步还会按 subject 合并 episode，避免同一个 cut-in 在连续帧里刷出一串重复事件。

如果还叠加 `low_ttc_pair`，则升级为 `cut_in_risk`。事件 metadata 会保留 supporting frame、timestamp、ego/target identity 以及规则来源，reviewer 可以沿着证据回看，而不是只看到一个布尔标签。

### 3. Review policy 控制噪声

中间 tag 保留为 `supporting` / `debug` 信号，最终 review item 使用 `intent: review`，再通过 episode、cooldown 和 subject 维度做去重与压缩。当前规则族覆盖 low-TTC、confirmed cut-in、map-aware red-light、SDC hard braking、VRU close interaction、blocked/unable-to-proceed 和 lane-change conflict。

## Viewer 结果

下面是从实际 review viewer 截取的结果。左侧是 review index：按 tag 组织场景；右侧场景页把 EGO/TARGET、scenario、frame、time 和事件摘要放在同一个审查路径里。

<div class="project-evidence-grid">
  <figure>
    <img src="/projects/trigger-engine/review-index.png" alt="TriggerEngine review index showing five review tags and 183 events" width="1280" height="720" loading="lazy" />
    <figcaption>Review index：5 类 review tag / 183 events，支持按事件族快速定位场景。</figcaption>
  </figure>
  <figure>
    <img src="/projects/trigger-engine/cut-in-view.png" alt="TriggerEngine viewer showing a confirmed cut-in with EGO and TARGET" width="1280" height="720" loading="lazy" />
    <figcaption>Confirmed cut-in：viewer 选中 `cut_in_confirmed`，并展示 EGO、TARGET、frame 8、t=0.80s 等证据。</figcaption>
  </figure>
</div>

## 工程化价值

| 层次 | 关键实现 | 对面试的意义 |
| --- | --- | --- |
| 数据层 | Waymo adapter + alignment context | 把原始 proto 数据变成稳定的规则输入 |
| 规则层 | YAML DSL + OperatorRegistry + RuleRegistry | 新增场景主要扩展配置和 operator，不改主流程 |
| 引擎层 | `TagEvent`、`TagTimeline`、event policy | 同时支持解释性、时序性和事件去重 |
| 交付层 | batch summary + payload JSON + static HTML | 结果可复核、可分享、可作为下一轮规则回归输入 |

性能优化也遵循 profile 结果：例如先做 SDC-only pair candidate 和廉价几何 gate，再进入 TTC / lane matching 等更昂贵的计算；已记录的 first-five-shard benchmark 将 engine time 从 `82.07s` 降到 `9.01s`，同时保持 review output 不变。

## 下一步：从 open-loop 到 closed-loop

当前交付边界是“离线挖掘 + 证据 viewer”。下一步会把高价值 review case 编译成可执行的场景输入，接入 agent/runtime，比较闭环行为与触发条件，再将评估结果回写为 `evaluation feedback`。这样 TriggerEngine 不只是一个离线筛选器，而会成为仿真评测和规则迭代的前置入口。

## Code map

- `trigger_engine/data/`：数据读取、frame schema、Waymo / nuScenes adapter。
- `trigger_engine/rules/`：DSL parser、AST、compiler 与 rule execution。
- `trigger_engine/operators/`：运动学、交互、地图和 review predicates。
- `trigger_engine/engine/`：触发编排、subject cache、时序 timeline、event policy。
- `tools/run_review_batch.py`：批量扫描、统计、profile 与 viewer 产物生成。
