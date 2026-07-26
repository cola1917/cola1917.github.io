import { site } from '../data/site';

// 同一 Person 实体在多个页面输出时，url 与 @id 必须保持稳定，
// 否则搜索引擎会把它拆成多个弱关联实体。统一以站点根为准。
export const personLd = (astroSite?: URL) => {
  const base = (astroSite ?? new URL('https://cola1917.github.io/')).href;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${base}#person`,
    name: site.name,
    alternateName: '王江涛',
    jobTitle: 'Autonomous Driving Simulation Engineer',
    email: `mailto:${site.email}`,
    url: base,
    sameAs: [site.github],
  };
};
