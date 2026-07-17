export const site = {
  name: 'Jiangtao Wang',
  email: 'colawang1997@outlook.com',
  github: 'https://github.com/cola1917',
  title: {
    en: 'Autonomous Driving Simulation & Evaluation',
    zh: '自动驾驶仿真、系统评测与数据分析',
  },
  description: {
    en: 'Engineering notes, system case studies, and updates on autonomous-driving simulation, system evaluation, and scenario/data mining.',
    zh: '记录自动驾驶仿真、系统评测、场景挖掘与数据工程中的方法、实践和思考。',
  },
  nav: {
    en: [
      { href: '/en/blog/', label: 'Blog' },
      { href: '/en/work/', label: 'Work' },
      { href: '/en/news/', label: 'News' },
      { href: '/en/about/', label: 'About' },
      { href: '/en/search/', label: 'Search' },
    ],
    zh: [
      { href: '/blog/', label: '博客' },
      { href: '/work/', label: '项目' },
      { href: '/news/', label: '动态' },
      { href: '/about/', label: '关于' },
      { href: '/search/', label: '搜索' },
    ],
  },
} as const;

export const statusLabels = {
  en: { active: 'active', completed: 'completed', revising: 'revising' },
  zh: { active: '进行中', completed: '已完成', revising: '修订中' },
} as const;

export const newsTypeLabels = {
  en: {
    site: 'site',
    project: 'project',
    writing: 'writing',
    chat: 'chat',
    'open-source': 'open source',
    milestone: 'milestone',
  },
  zh: {
    site: '站点',
    project: '项目',
    writing: '写作',
    chat: '闲谈',
    'open-source': '开源',
    milestone: '里程碑',
  },
} as const;
