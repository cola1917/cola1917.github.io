---
title: "自动驾驶触发式场景挖掘引擎 (Trigger Engine)"
titleEn: "TriggerFlow"
description: "面向 Waymo Open Dataset 构建轻量级 Trigger Engine，将长尾风险场景抽象为可配置规则链，支持高价值场景自动挖掘、结构化导出与批量统计；在前 100 个 validation shard 上扫描 29,023 个 scenario，筛选出 162 个高价值场景。"
descriptionEn: "Replay-first risk scenario discovery platform for autonomous driving data closed-loop workflows."
techStack: ["Python", "Waymo Open Dataset", "Rule-based Mining", "Temporal Rule Engine", "JSON Visualization", "Parallel Batch Processing"]
order: 2
problemStatement: "自动驾驶长尾风险场景的挖掘依赖人工标注与经验判断，缺乏系统化的规则引擎支撑。传统方案难以处理复杂交互场景中的误报问题，且缺乏可解释的复核闭环。"
problemStatementEn: "Mining long-tail risk scenarios in autonomous driving relies on manual annotation and experience-based judgment, lacking systematic rule engine support."
decisions:
  - title: "规则 DSL 与 Operator 体系"
    titleEn: "Rule DSL and Operator System"
    context: "不同高价值场景的判断逻辑差异大，需要一套可复用的规则抽象机制。"
    choice: "构建基于规则 DSL 的场景配置机制，将场景判断拆解为可复用 Operator。"
    rationale: "Operator 包括相对纵横向距离、closing speed、heading diff、TTC、车道匹配、红绿灯停止线穿越、时序连续帧约束等，使不同场景能够通过组合规则快速扩展。"
    tradeoffs: "DSL 设计需要较高的抽象能力，但大幅降低了新场景的接入成本。"
  - title: "误检治理策略"
    titleEn: "False Positive Mitigation"
    context: "Cut-in 在自车转弯、目标车静止时容易伪触发，红灯检测中自车右转被误判为闯红灯。"
    choice: "通过未来航向变化、目标车速度、自车转向抑制、车道几何一致性等过滤条件提升场景筛选精度。"
    rationale: "多维度过滤条件能够有效抑制常见误报模式，提升场景筛选的准确率。"
  - title: "性能优化方案"
    titleEn: "Performance Optimization"
    context: "大规模 TFRecord 数据的规则扫描耗时较长，需要优化处理效率。"
    choice: "采用并行 shard 处理、车道匹配缓存、车道空间索引、payload 内联输出等优化策略。"
    rationale: "多级缓存与并行处理显著降低了大规模规则扫描耗时，支撑批量数据处理。"
highlights:
  - metric: "规则 DSL"
    label: "可配置场景规则体系"
    labelEn: "Configurable scenario rule system"
  - metric: "并行处理"
    label: "多 TFRecord 分片批量扫描"
    labelEn: "Multi-shard batch processing"
  - metric: "JSON"
    label: "结构化 payload 可视化"
    labelEn: "Structured payload visualization"
roadmap:
  - item: "支持更多数据集格式（nuScenes、Argoverse）"
    itemEn: "Support additional dataset formats (nuScenes, Argoverse)"
    priority: high
  - item: "引入机器学习辅助的场景分类"
    itemEn: "Introduce ML-assisted scenario classification"
    priority: medium
  - item: "支持在线触发式数据采集"
    itemEn: "Support online trigger-based data collection"
    priority: low
---

Trigger Engine 采用规则引擎架构，核心由四个模块组成：

- **规则 DSL 解析器**：将场景配置文件解析为可执行的 Operator 链，支持相对纵横向距离、closing speed、heading diff、TTC、车道匹配、红绿灯停止线穿越、时序连续帧约束等判断逻辑
- **场景扫描引擎**：对 TFRecord 数据进行逐帧扫描，执行 Operator 链进行场景匹配，支持并行 shard 处理与多级缓存优化
- **误检治理层**：通过未来航向变化、目标车速度、自车转向抑制、车道几何一致性等过滤条件，抑制常见误报模式
- **可视化复核器**：基于 JSON payload 的本地 viewer，支持按文件、scenario、trigger 类型查看挖掘结果，并展示 ego、target、轨迹、地图元素、红绿灯和事件 metadata

## 工程流程

数据处理采用批量扫描模式，整体流程：

1. 输入 Waymo Open Dataset 的 TFRecord 数据
2. 解析规则 DSL 配置，构建 Operator 执行链
3. 并行扫描多个 TFRecord 分片
4. 执行场景匹配与误检过滤
5. 输出结构化 JSON payload
6. 通过可视化 viewer 进行人工复核
7. 迭代修正规则配置
