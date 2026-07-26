import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../../data/site';
import { isLocale, isPublished, sortByPublished } from '../../lib/content';
import { contentSlug } from '../../lib/i18n';

export async function GET(context: { site?: URL }) {
  const posts = (await getCollection('blog')).filter(isPublished).filter(isLocale('en')).sort(sortByPublished);

  return rss({
    title: 'Engineering Notes',
    description: site.description.en,
    // channel <link> 应指向英文首页 /en/，与中文 feed 区分归属页面。
    site: new URL('/en/', context.site ?? 'https://cola1917.github.io'),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/en/blog/${contentSlug(post.id)}/`,
      categories: post.data.tags,
    })),
  });
}
