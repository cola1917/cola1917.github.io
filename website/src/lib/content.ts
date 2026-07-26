import type { CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';

// 允许把日期写成“本地的今天”而不被 UTC 构建时间隐藏（时区最多快 UTC 14 小时）。
const PUBLISH_GRACE_MS = 24 * 60 * 60 * 1000;
const buildTime = Date.now();

export const isPublished = <T extends { data: { draft: boolean; publishedAt?: Date; date?: Date } }>(
  entry: T,
) => {
  if (entry.data.draft) return false;
  const published = entry.data.publishedAt ?? entry.data.date;
  return !published || published.valueOf() <= buildTime + PUBLISH_GRACE_MS;
};

export const isLocale = <T extends { data: { locale: Locale } }>(locale: Locale) =>
  (entry: T) => entry.data.locale === locale;

export const sortByPublished = (
  a: CollectionEntry<'blog'>,
  b: CollectionEntry<'blog'>,
) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf();

export const sortNews = (
  a: CollectionEntry<'news'>,
  b: CollectionEntry<'news'>,
) => b.data.date.valueOf() - a.data.date.valueOf();

export const sortProjects = (
  a: CollectionEntry<'projects'>,
  b: CollectionEntry<'projects'>,
) => b.data.order - a.data.order || b.data.year - a.data.year;

export const formatDate = (date: Date, locale: Locale = 'zh') =>
  new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en', {
    year: 'numeric',
    month: locale === 'zh' ? 'long' : 'short',
    day: locale === 'zh' ? 'numeric' : '2-digit',
    timeZone: 'UTC',
  }).format(date);

// 保留 CJK 字符，避免中文 tag 被压缩成空字符串（Astro 路由参数支持非 ASCII）。
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/g, '');
