# Jiangtao Wang — Engineering Notes

A static editorial site for writing, project case studies, and short updates about autonomous-driving simulation, system evaluation, and scenario/data mining.

## Stack

- Astro
- TypeScript content collections
- Markdown and MDX
- Tailwind CSS
- Pagefind search
- Static English and Simplified Chinese routes
- RSS and sitemap generation

## Local development

```bash
cd website
npm install
npm run dev
```

Production builds are written to `website/dist` and deployed by GitHub Actions.

Simplified Chinese is the default language at the root URL. English pages use the
`/en/` prefix, with a `中文 / EN` switcher in the site header. Pagefind builds a
separate search index for each document language.

Chinese content lives directly under `website/src/content/<collection>/`. English
translations use the matching `en/` subdirectory and the same filename. Categories
are fixed; tags are free-form ASCII technical labels added in each article's frontmatter.
