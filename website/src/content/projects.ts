export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  cta: string;
  link: string;
}

export const projects: Project[] = [
  {
    id: 'triggerflow',
    title: 'TriggerFlow',
    description: 'Replay-first risk scenario discovery platform for autonomous driving data closed-loop workflows.',
    tags: ['Python', 'TFRecord', 'Rule-based Mining', 'Docker', 'CSV/JSON Pipeline'],
    cta: 'Open Architecture →',
    link: '/projects/triggerflow',
  },
  {
    id: 'evaluation-suite',
    title: 'AD Evaluation Suite',
    description: 'Industrial-style evaluation framework for scalable KPI and regression analysis.',
    tags: ['Python', 'nuScenes', 'Object Detection', 'MOTA/IDF1', 'OpenSCENARIO'],
    cta: 'View Evaluation Workflow →',
    link: '/projects/evaluation-suite',
  },
  {
    id: 'scenario-framework',
    title: 'Scenario Generalization Framework',
    description: 'Simulation replay and parameterized scenario generation infrastructure for robustness validation.',
    tags: ['BEV', 'Shared Memory', 'Numba', 'TurboJPEG', 'Multi-process'],
    cta: 'Explore Framework →',
    link: '/projects/scenario-framework',
  },
];
