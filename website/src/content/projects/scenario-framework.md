---
title: "自动驾驶仿真场景泛化与标准化生成"
titleEn: "Scenario Generalization Framework"
description: "设计统一 JSON Schema，构建 JSON → OpenSCENARIO 转换链路，支持场景参数泛化与回归评测，实现真实 Bad Case 的结构化表达与场景资产化。"
descriptionEn: "Simulation replay and parameterized scenario generation infrastructure for robustness validation."
techStack: ["Python", "esmini", "OpenSCENARIO", "JSON Schema", "Scenario Generation", "Simulation Replay", "Rule-based Parameterization"]
order: 3
problemStatement: "自动驾驶仿真测试中，真实 Bad Case 到仿真场景的转化缺乏标准化中间层，导致场景复用性差、参数泛化困难、回归评测流程割裂。"
problemStatementEn: "In autonomous driving simulation testing, the conversion from real Bad Cases to simulation scenarios lacks a standardized intermediate layer, resulting in poor scenario reusability and fragmented regression evaluation workflows."
decisions:
  - title: "场景中间层设计"
    titleEn: "Scenario Intermediate Layer Design"
    context: "真实 Bad Case 需要转化为结构化的仿真场景，但直接转换为 OpenSCENARIO 格式缺乏灵活性。"
    choice: "设计面向自动驾驶测试场景的统一 JSON Schema，抽象 ego、目标车、道路拓扑、行为序列、触发条件、时序事件与评测指标等核心字段。"
    rationale: "JSON Schema 作为中间层，既保持了场景描述的结构化，又支持灵活的参数化扩展，为后续的场景泛化与资产化提供基础。"
    tradeoffs: "引入中间层增加了转换链路的复杂度，但显著提升了场景的可维护性与复用性。"
  - title: "参数泛化策略"
    titleEn: "Parameter Generalization Strategy"
    context: "单一 Bad Case 场景需要生成多个变体用于鲁棒性评测。"
    choice: "支持对速度、相对距离、TTC、切入角度、起始位置与目标行为等关键参数进行规则化采样与变异。"
    rationale: "规则化采样能够生成同一 Bad Case 的多版本 Scenario Family，用于鲁棒性评测与风险边界探索。"
  - title: "回归评测方案"
    titleEn: "Regression Evaluation Approach"
    context: "泛化后的场景需要批量执行并自动统计关键指标。"
    choice: "基于 esmini headless 模式批量执行仿真场景，自动统计 collision、min TTC、距离变化等关键 KPI。"
    rationale: "headless 模式支持高效批量执行，自动 KPI 统计支撑回归分析与失败场景定位。"
highlights:
  - metric: "JSON Schema"
    label: "统一场景描述中间层"
    labelEn: "Unified scenario description layer"
  - metric: "esmini"
    label: "开源仿真器集成"
    labelEn: "Open-source simulator integration"
  - metric: "参数泛化"
    label: "场景族自动生成"
    labelEn: "Automatic scenario family generation"
roadmap:
  - item: "支持更多仿真器接口（CARLAWORKS、LGSVL）"
    itemEn: "Support additional simulator interfaces (CARLAWORKS, LGSVL)"
    priority: medium
  - item: "引入基于场景复杂度的智能采样"
    itemEn: "Introduce complexity-based intelligent sampling"
    priority: high
  - item: "支持场景库的版本管理与标签系统"
    itemEn: "Support scenario library versioning and tagging"
    priority: low
---

场景生成框架采用三层架构，核心由五个模块组成：

- **JSON Schema 定义层**：定义统一的场景描述格式，抽象 ego、目标车、道路拓扑、行为序列、触发条件、时序事件与评测指标等核心字段
- **场景转换引擎**：构建 JSON → OpenSCENARIO 转换链路，支持生成 esmini 可执行场景
- **参数泛化模块**：支持对速度、相对距离、TTC、切入角度、起始位置与目标行为等关键参数进行规则化采样与变异
- **仿真执行器**：基于 esmini headless 模式批量执行仿真场景，自动统计 collision、min TTC、距离变化等关键 KPI
- **数据闭环接口**：支持接收 Trigger Engine 与感知评测工具输出的高价值 Bad Case，将真实失败场景转化为可复现、可泛化的 Simulation Scenario Asset

## 工程流程

场景生成采用标准化流程，整体流程：

1. 接收 Trigger Engine 或感知评测工具输出的 Bad Case
2. 转换为统一 JSON Schema 格式的场景描述
3. 执行参数泛化，生成 Scenario Family
4. 转换为 OpenSCENARIO 格式
5. 通过 esmini headless 模式批量执行仿真
6. 自动统计 KPI 并生成回归报告
7. 失败场景回归分析与场景库更新
