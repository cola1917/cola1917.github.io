export const locales = ['en', 'zh'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

export const languageTags: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-CN',
};

export const localeFromPath = (pathname: string): Locale =>
  pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'zh';

export const stripLocalePrefix = (pathname: string) => {
  if (pathname === '/en') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return pathname || '/';
};

export const pathForLocale = (pathname: string, locale: Locale) => {
  const basePath = stripLocalePrefix(pathname);
  return locale === 'en' ? `/en${basePath}` : basePath;
};

export const contentSlug = (id: string) => id.replace(/^en\//, '');

export const localizedPath = (locale: Locale, pathname: string) =>
  pathname.startsWith('/') && !pathname.startsWith('//')
    ? pathForLocale(pathname, locale)
    : pathname;

export const localeCopy = {
  en: {
    skip: 'Skip to content',
    primaryNavigation: 'Primary navigation',
    language: 'Language',
    home: 'home',
    updated: 'Updated',
    role: 'Role',
    status: 'Status',
    stack: 'Stack',
  },
  zh: {
    skip: '跳到主要内容',
    primaryNavigation: '主导航',
    language: '语言',
    home: '首页',
    updated: '更新于',
    role: '职责',
    status: '状态',
    stack: '技术栈',
  },
} as const;
