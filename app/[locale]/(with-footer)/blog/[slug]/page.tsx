import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { RevalidateOneDay } from '@/lib/constants';
import { getBlogPostBySlug, getPopularBlogPosts, getRelatedBlogPosts } from '@/lib/services/blog-service';

export const revalidate = RevalidateOneDay;

type Props = {
  params: { locale: string; slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  const t = await getTranslations('Blog');

  if (!post) {
    return {
      title: `${t('title')} - AI Save World`,
      description: '',
    };
  }

  return {
    title: `${post.title} - ${t('title')} - AI Save World`,
    description: post.excerpt || post.content.substring(0, 160),
  };
}

// 博客文章内容组件
async function BlogPostContent({ slug }: { slug: string }) {
  const post = await getBlogPostBySlug(slug);
  const t = await getTranslations('Blog');

  if (!post) {
    notFound();
  }

  return (
    <article className='prose prose-lg prose-invert max-w-none'>
      <h1 className='mb-4 text-3xl font-bold'>{post.title}</h1>

      <div className='mb-8 flex items-center'>
        <div className='flex items-center'>
          {post.blog_author?.avatar && (
            <img src={post.blog_author.avatar} alt={post.blog_author.name} className='mr-3 h-10 w-10 rounded-full' />
          )}
          <div>
            <div className='font-medium'>{post.blog_author?.name}</div>
            <div className='text-sm text-gray-400'>
              {new Date(post.published_at || post.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className='ml-auto text-gray-400'>{t('views', { count: post.view_count || 0 })}</div>
      </div>

      {post.featured_image && (
        <div className='mb-8'>
          <img src={post.featured_image} alt={post.title} className='h-auto w-full rounded-lg' />
        </div>
      )}

      {/* 文章标签 */}
      {post.tags && post.tags.length > 0 && (
        <div className='mb-6 flex flex-wrap gap-2'>
          {post.tags.map((tag: string) => (
            <Link
              key={tag}
              href={`/blog/tag/${tag}`}
              className='rounded-full bg-gray-700 px-3 py-1 text-sm hover:bg-gray-600'
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* 文章内容 */}
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}

// 渲染相关文章列表
function renderRelatedPosts(t: any, posts: any[], currentSlug: string) {
  return (
    <div className='mt-16'>
      <h2 className='mb-6 text-2xl font-bold'>{t('relatedPosts')}</h2>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {posts
          .filter((related) => related.slug !== currentSlug)
          .map((related) => (
            <div key={related.slug} className='overflow-hidden rounded-lg border border-gray-700'>
              {related.featured_image && (
                <div className='h-40 overflow-hidden'>
                  <img src={related.featured_image} alt={related.title} className='h-full w-full object-cover' />
                </div>
              )}
              <div className='p-4'>
                <Link href={`/blog/${related.slug}`} className='text-lg font-medium hover:text-blue-400'>
                  {related.title}
                </Link>
                <p className='mt-2 text-sm text-gray-400'>{related.excerpt || related.content.substring(0, 100)}...</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// 相关文章组件
async function RelatedPosts({ slug }: { slug: string }) {
  const t = await getTranslations('Blog');
  const post = await getBlogPostBySlug(slug);

  // 如果找不到文章或文章没有标签，则显示热门文章
  if (!post || !post.tags || post.tags.length === 0) {
    const popularPosts = await getPopularBlogPosts(3);
    if (!popularPosts || popularPosts.length === 0) {
      return null;
    }

    return renderRelatedPosts(t, popularPosts, slug);
  }

  // 使用文章标签查找相关文章
  const relatedPosts = await getRelatedBlogPosts(slug, post.tags, 3);

  if (!relatedPosts || relatedPosts.length === 0) {
    return null;
  }

  return renderRelatedPosts(t, relatedPosts, slug);
}

// 加载状态组件
function LoadingState() {
  return (
    <div className='mx-auto max-w-pc px-4 py-8'>
      <div className='mb-6'>
        <div className='h-6 w-24 rounded bg-gray-700' />
      </div>
      <div className='animate-pulse'>
        <div className='mb-6 h-10 w-3/4 rounded bg-gray-700' />
        <div className='mb-8 flex items-center'>
          <div className='mr-3 h-10 w-10 rounded-full bg-gray-700' />
          <div>
            <div className='mb-2 h-5 w-32 rounded bg-gray-700' />
            <div className='h-4 w-24 rounded bg-gray-700' />
          </div>
        </div>
        <div className='mb-8 h-80 rounded bg-gray-700' />
        <div className='mb-6 flex gap-2'>
          <div className='h-6 w-16 rounded bg-gray-700' />
          <div className='h-6 w-16 rounded bg-gray-700' />
        </div>
        <div className='space-y-4'>
          <div className='h-5 w-full rounded bg-gray-700' />
          <div className='h-5 w-full rounded bg-gray-700' />
          <div className='h-5 w-full rounded bg-gray-700' />
          <div className='h-5 w-full rounded bg-gray-700' />
          <div className='h-5 w-3/4 rounded bg-gray-700' />
        </div>
      </div>
    </div>
  );
}

// 主页面组件
export default async function BlogPostPage({ params }: Props) {
  const t = await getTranslations('Blog');

  return (
    <div className='mx-auto max-w-pc px-4 py-8'>
      <div className='mb-6'>
        <Link href='/blog' className='text-blue-400 hover:text-blue-300'>
          ← {t('backToBlog')}
        </Link>
      </div>

      <Suspense fallback={<LoadingState />}>
        <BlogPostContent slug={params.slug} />
        <RelatedPosts slug={params.slug} />
      </Suspense>
    </div>
  );
}
