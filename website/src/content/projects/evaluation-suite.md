---
title: "ad-eval-suite：面向自动驾驶的感知评测与 Bad Case 分析"
titleEn: "AD Evaluation Suite"
description: "独立开发面向自动驾驶感知算法的离线评测与错误分析工具链，覆盖\"指标统计 - Bad Case 挖掘 - 场景回放 - 仿真复现\"全流程。"
descriptionEn: "Industrial-style evaluation framework for scalable KPI and regression analysis."
techStack: ["Python", "nuScenes", "目标检测/多目标跟踪评测", "HD Map 可视化", "OpenSCENARIO"]
order: 1
problemStatement: "自动驾驶感知算法的离线评测面临多维度指标分析、长尾场景挖掘、问题复盘与仿真复现等环节割裂的问题。传统评测流程依赖人工导出与手动分析，难以支撑大规模 Bad Case 的自动化筛选与回归验证。"
problemStatementEn: "Offline evaluation of autonomous driving perception algorithms faces fragmented workflows across multi-dimensional metric analysis, long-tail scenario mining, issue review, and simulation reproduction."
decisions:
  - title: "评测指标体系设计"
    titleEn: "Evaluation Metric System Design"
    context: "感知算法评测需要覆盖检测与跟踪两大任务，且需支持按目标类别、距离区间、速度区间等多维度切片分析。"
    choice: "采用基于 YAML 配置的自动化评测模块，将指标计算与切片分析解耦。"
    rationale: "YAML 配置驱动的方式使得评测维度可灵活扩展，无需修改代码即可新增切片维度，同时支持评测配置的版本管理。"
    tradeoffs: "配置化方案增加了前期设计复杂度，但长期维护成本显著降低。"
  - title: "Bad Case 挖掘策略"
    titleEn: "Bad Case Mining Strategy"
    context: "传统阈值筛选方式难以捕捉复杂退化模式，需要综合多指标进行风险评估。"
    choice: "设计基于多指标加权的 Bad Case 挖掘策略，自动筛选高风险场景与异常帧。"
    rationale: "多指标加权方式能够更准确地识别漏检、误检、ID Switch 等不同类型的感知退化问题，提升 Failure Analysis 效率。"
  - title: "仿真联动校验"
    titleEn: "Simulation Integration"
    context: "挖掘出的 Bad Case 需要能够在仿真环境中复现，以支持后续的回归测试。"
    choice: "支持将 Bad Case 导出为 OpenSCENARIO 格式，并集成 esmini headless 模式完成场景可运行性验证。"
    rationale: "OpenSCENARIO 是行业标准格式，esmini 是开源仿真器，两者结合可为后续仿真回归与场景泛化提供基础 Scenario Asset。"
highlights:
  - metric: "全流程"
    label: "覆盖指标统计-挖掘-回放-仿真"
    labelEn: "Full pipeline coverage"
  - metric: "YAML"
    label: "配置驱动的评测体系"
    labelEn: "Configuration-driven evaluation"
  - metric: "OpenSCENARIO"
    label: "标准格式场景导出"
    labelEn: "Standard format export"
roadmap:
  - item: "支持更多数据集格式（KITTI、Waymo）"
    itemEn: "Support additional dataset formats (KITTI, Waymo)"
    priority: medium
  - item: "集成可视化评测报告生成"
    itemEn: "Integrate visual evaluation report generation"
    priority: high
  - item: "支持在线评测模式"
    itemEn: "Support online evaluation mode"
    priority: low
---

评测工具链采用离线批处理架构，核心由四个模块组成：

- **指标计算引擎**：基于 YAML 配置的自动化评测模块，支持检测（mAP、AP）与跟踪（MOTA、IDF1）等核心指标计算，并支持按目标类别、距离区间、速度区间等维度进行切片分析（Slice Analysis）
- **Bad Case 挖掘器**：设计基于多指标加权的挖掘策略，可自动筛选高风险场景与异常帧，辅助定位漏检、误检、ID Switch 等感知退化问题
- **HD Map 回放模块**：基于 nuScenes HD Map 的 BEV 回放模块，支持目标框、轨迹、车道线等信息叠加显示，并支持静态帧与 GIF 导出
- **仿真导出器**：支持将挖掘出的 Bad Case 导出为 OpenSCENARIO（.xosc）格式，并集成 esmini headless 模式完成场景可运行性验证

## 工程流程

数据处理采用 CLI 命令行入口，支持评测、回放与场景导出的快速迭代与复现。整体流程：

1. 输入 nuScenes 格式的感知结果数据
2. 执行 YAML 配置驱动的多维度指标计算
3. 基于多指标加权策略自动筛选 Bad Case
4. 通过 HD Map BEV 回放进行问题复盘
5. 导出 OpenSCENARIO 格式用于仿真回归
