export interface Project {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  tags: string[];
  cta: string;
  link: string;
}

export const projects: Project[] = [
  {
    id: 'evaluation-suite',
    title: 'ad-eval-suite：面向自动驾驶的感知评测与 Bad Case 分析',
    titleEn: 'AD Evaluation Suite',
    description: '独立开发面向自动驾驶感知算法的离线评测与错误分析工具链，覆盖"指标统计 - Bad Case 挖掘 - 场景回放 - 仿真复现"全流程。',
    descriptionEn: 'Industrial-style evaluation framework for scalable KPI and regression analysis.',
    tags: ['Python', 'nuScenes', '目标检测/多目标跟踪评测', 'HD Map 可视化', 'OpenSCENARIO'],
    cta: 'View Evaluation Workflow →',
    link: '/projects/evaluation-suite',
  },
  {
    id: 'triggerflow',
    title: '自动驾驶触发式场景挖掘引擎 (Trigger Engine)',
    titleEn: 'TriggerFlow',
    description: '面向 Waymo Open Dataset 的轻量级 Trigger Engine，将长尾风险场景抽象为可配置规则链，支持低 TTC 跟驰、Cut-in、红灯通行等高价值场景自动识别。',
    descriptionEn: 'Replay-first risk scenario discovery platform for autonomous driving data closed-loop workflows.',
    tags: ['Python', 'Waymo Open Dataset', 'Rule-based Mining', 'Temporal Rule Engine', 'JSON Visualization'],
    cta: 'Open Architecture →',
    link: '/projects/triggerflow',
  },
  {
    id: 'scenario-framework',
    title: '自动驾驶仿真场景泛化与标准化生成',
    titleEn: 'Scenario Generalization Framework',
    description: '设计统一 JSON Schema，构建 JSON → OpenSCENARIO 转换链路，支持场景参数泛化与回归评测，实现真实 Bad Case 的结构化表达与场景资产化。',
    descriptionEn: 'Simulation replay and parameterized scenario generation infrastructure for robustness validation.',
    tags: ['Python', 'esmini', 'OpenSCENARIO', 'JSON Schema', 'Scenario Generation'],
    cta: 'Explore Framework →',
    link: '/projects/scenario-framework',
  },
];
