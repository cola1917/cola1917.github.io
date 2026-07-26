import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://cola1917.github.io',
  output: 'static',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    mdx(),
    // hreflang alternates 由 BaseLayout 按“译文是否真实存在”精确输出；
    // sitemap 的 i18n 选项只会按前缀机械互指，会宣称不存在的译文页，故不启用。
    sitemap({
      // 精确匹配两个搜索页，避免误伤未来 URL 中恰好含 /search/ 段的内容页。
      filter: (page) => !/^\/(en\/)?search\/$/.test(new URL(page).pathname),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: true,
    },
  },
});
