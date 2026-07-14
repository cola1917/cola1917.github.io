import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../../data/site';
import { isLocale, isPublished, sortByPublished } from '../../lib/content';
import { contentSlug } from '../../lib/i18n';

export async function GET(context: { site?: URL }) {
  const posts = (await getCollection('blog')).filter(isPublished).filter(isLocale('zh')).sort(sortByPublished);

  return rss({
    title: `${site.name} — 工程笔记`,
    description: site.description.zh,
    site: context.site ?? 'https://cola1917.github.io',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/zh/blog/${contentSlug(post.id)}/`,
      categories: [post.data.category, ...post.data.tags],
    })),
  });
}
