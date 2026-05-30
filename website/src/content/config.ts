import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    titleEn: z.string(),
    description: z.string(),
    descriptionEn: z.string(),
    techStack: z.array(z.string()),
    status: z.string().optional(),
    period: z.string().optional(),
    problemStatement: z.string(),
    problemStatementEn: z.string(),
    decisions: z
      .array(
        z.object({
          title: z.string(),
          titleEn: z.string(),
          context: z.string(),
          choice: z.string(),
          rationale: z.string(),
          tradeoffs: z.string().optional(),
        })
      )
      .optional(),
    highlights: z
      .array(
        z.object({
          metric: z.string(),
          label: z.string(),
          labelEn: z.string(),
        })
      )
      .optional(),
    roadmap: z
      .array(
        z.object({
          item: z.string(),
          itemEn: z.string(),
          priority: z.enum(['high', 'medium', 'low']).optional(),
        })
      )
      .optional(),
    order: z.number().default(0),
  }),
});

export const collections = { projects };
