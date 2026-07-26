import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { slugify } from './lib/content';

// 在构建期拦住会生成空路由的 tag，以及单篇文章内 slug 化后互相碰撞的 tag；
// 跨文章的同 slug tag（如 "eval/metrics" 与 "eval metrics"）由 tags 页按 slug 分组合并处理。
const tagsSchema = z
  .array(z.string())
  .default([])
  .refine((tags) => tags.every((tag) => slugify(tag).length > 0), {
    message: 'Each tag must contain at least one letter, digit, or CJK character.',
  })
  .refine((tags) => new Set(tags.map(slugify)).size === tags.length, {
    message: 'Tags must not collapse to the same slug.',
  });

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    tags: tagsSchema,
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    locale: z.enum(['en', 'zh']).default('zh'),
  }),
});

const news = defineCollection({
  loader: glob({ base: './src/content/news', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    type: z.enum(['site', 'project', 'writing', 'chat', 'open-source', 'milestone']),
    summary: z.string(),
    link: z.string().optional(),
    draft: z.boolean().default(false),
    locale: z.enum(['en', 'zh']).default('zh'),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    year: z.number(),
    // 长期项目可用 timeframe 表达时间跨度（如 "2024 – 2026"），展示时优先于 year。
    timeframe: z.string().optional(),
    status: z.enum(['active', 'completed', 'revising']),
    role: z.string(),
    stack: z.array(z.string()).default([]),
    // 量化结果，卡片与详情页直接展示（如 "回归耗时 6h → 40min"）。
    metrics: z.array(z.string()).default([]),
    // 外部证据链接（repo / demo / 视频）。
    links: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    draft: z.boolean().default(false),
    locale: z.enum(['en', 'zh']).default('zh'),
  }),
});

export const collections = { blog, news, projects };
