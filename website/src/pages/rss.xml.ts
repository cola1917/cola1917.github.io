import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../data/site';
import { isPublished, sortByPublished } from '../lib/content';

export async function GET(context: { site?: URL }) {
  const posts = (await getCollection('blog')).filter(isPublished).sort(sortByPublished);

  return rss({
    title: `${site.name} — Engineering Notes`,
    description: site.description,
    site: context.site ?? 'https://cola1917.github.io',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/blog/${post.id}/`,
      categories: [post.data.category, ...post.data.tags],
    })),
  });
}
