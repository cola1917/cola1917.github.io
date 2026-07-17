import type { CollectionEntry } from 'astro:content';
import type { Locale } from './i18n';

export const isPublished = <T extends { data: { draft: boolean } }>(entry: T) =>
  !entry.data.draft;

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

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
