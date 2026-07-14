import type { CollectionEntry } from 'astro:content';

export const isPublished = <T extends { data: { draft: boolean } }>(entry: T) =>
  !entry.data.draft;

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

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(date);

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
