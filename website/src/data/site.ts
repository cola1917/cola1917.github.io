export const site = {
  name: 'Jiangtao Wang',
  title: 'Jiangtao Wang — Autonomous Driving Simulation & Evaluation',
  description:
    'Engineering notes, system case studies, and updates on autonomous-driving simulation, system evaluation, and scenario/data mining.',
  email: 'colawang1997@outlook.com',
  github: 'https://github.com/cola1917',
  nav: [
    { href: '/blog/', label: 'Blog' },
    { href: '/work/', label: 'Work' },
    { href: '/news/', label: 'News' },
    { href: '/about/', label: 'About' },
    { href: '/search/', label: 'Search' },
  ],
} as const;

export const categoryLabels = {
  simulation: 'Simulation',
  evaluation: 'System Evaluation',
  'scenario-mining': 'Scenario Mining',
  'data-infrastructure': 'Data Infrastructure',
  'engineering-notes': 'Engineering Notes',
} as const;

export type CategorySlug = keyof typeof categoryLabels;
