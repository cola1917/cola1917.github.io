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

English remains at the root URL. Simplified Chinese pages use the `/zh/` prefix,
with an `EN / 中文` switcher in the site header. Pagefind builds a separate search
index for each document language.
