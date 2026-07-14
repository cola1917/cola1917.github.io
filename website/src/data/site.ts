import type { Locale } from '../lib/i18n';

export const site = {
  name: 'Jiangtao Wang',
  email: 'colawang1997@outlook.com',
  github: 'https://github.com/cola1917',
  title: {
    en: 'Jiangtao Wang — Autonomous Driving Simulation & Evaluation',
    zh: '王江涛 — 自动驾驶仿真与系统评测',
  },
  description: {
    en: 'Engineering notes, system case studies, and updates on autonomous-driving simulation, system evaluation, and scenario/data mining.',
    zh: '关于自动驾驶仿真、系统评测、场景与数据挖掘的工程笔记、系统案例和动态。',
  },
  nav: {
    en: [
      { href: '/blog/', label: 'Blog' },
      { href: '/work/', label: 'Work' },
      { href: '/news/', label: 'News' },
      { href: '/about/', label: 'About' },
      { href: '/search/', label: 'Search' },
    ],
    zh: [
      { href: '/zh/blog/', label: '博客' },
      { href: '/zh/work/', label: '作品' },
      { href: '/zh/news/', label: '动态' },
      { href: '/zh/about/', label: '关于' },
      { href: '/zh/search/', label: '搜索' },
    ],
  },
} as const;

export const categoryLabels = {
  en: {
    simulation: 'Simulation',
    evaluation: 'System Evaluation',
    'scenario-mining': 'Scenario Mining',
    'data-infrastructure': 'Data Infrastructure',
    'engineering-notes': 'Engineering Notes',
  },
  zh: {
    simulation: '仿真系统',
    evaluation: '系统评测',
    'scenario-mining': '场景挖掘',
    'data-infrastructure': '数据基础设施',
    'engineering-notes': '工程笔记',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type CategorySlug = keyof typeof categoryLabels.en;

export const statusLabels = {
  en: { active: 'active', completed: 'completed', revising: 'revising' },
  zh: { active: '进行中', completed: '已完成', revising: '修订中' },
} as const;

export const newsTypeLabels = {
  en: {
    site: 'site',
    project: 'project',
    writing: 'writing',
    'open-source': 'open source',
    milestone: 'milestone',
  },
  zh: {
    site: '站点',
    project: '项目',
    writing: '写作',
    'open-source': '开源',
    milestone: '里程碑',
  },
} as const;
