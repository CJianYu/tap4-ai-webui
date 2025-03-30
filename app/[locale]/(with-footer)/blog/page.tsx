import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import type { BlogAuthor, BlogPost } from '@/db/supabase/types';
import { useTranslations } from 'next-intl';

import { RevalidateOneDay } from '@/lib/constants';
import { getBlogPosts, getPopularBlogPosts } from '@/lib/services/blog-service';

// 扩展 BlogPost 类型以包含 blog_author
type BlogPostWithAuthor = BlogPost & {
  blog_author?: BlogAuthor;
};

export const revalidate = RevalidateOneDay;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Blog - AI Save World',
    description: 'Latest updates, news, and insights from AI Save World',
  };
}

// 热门文章组件
async function PopularPostsSection() {
  const t = useTranslations('Blog');
  const popularPosts = await getPopularBlogPosts();

  if (!popularPosts || popularPosts.length === 0) {
    return null;
  }

  return (
    <div className='mb-12'>
      <h2 className='mb-4 text-xl font-semibold'>{t('popular')}</h2>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {popularPosts.map((post: BlogPostWithAuthor) => (
          <div key={post.slug} className='overflow-hidden rounded-lg border border-gray-700'>
            {post.featured_image && (
              <div className='h-40 overflow-hidden'>
                <img src={post.featured_image} alt={post.title} className='h-full w-full object-cover' />
              </div>
            )}
            <div className='p-4'>
              <Link href={`/blog/${post.slug}`} className='text-lg font-medium hover:text-blue-400'>
                {post.title}
              </Link>
              <p className='mt-2 text-sm text-gray-400'>{post.excerpt || post.content.substring(0, 120)}...</p>
              <div className='mt-4 flex items-center justify-between'>
                <span className='text-xs text-gray-500'>
                  {new Date(post.published_at || post.created_at).toLocaleDateString()}
                </span>
                <span className='text-xs text-gray-500'>{t('views', { count: post.view_count || 0 })}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 博客文章列表组件
async function BlogPostsList({ page }: { page: number }) {
  const t = useTranslations('Blog');
  const { posts, count } = await getBlogPosts(page);

  // 计算总页数
  const totalPages = Math.ceil(count / 10);

  if (!posts || posts.length === 0) {
    return (
      <div className='py-12 text-center'>
        <p className='text-xl'>No blog posts available</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className='mb-4 text-xl font-semibold'>{t('latestPosts')}</h2>
      <div className='grid grid-cols-1 gap-6'>
        {posts.map((post: BlogPostWithAuthor) => (
          <div key={post.slug} className='rounded-lg border border-gray-700 p-6'>
            <Link href={`/blog/${post.slug}`} className='text-xl font-medium hover:text-blue-400'>
              {post.title}
            </Link>

            <div className='mb-4 mt-2 flex items-center'>
              <div className='flex items-center'>
                {post.blog_author?.avatar && (
                  <img
                    src={post.blog_author.avatar}
                    alt={post.blog_author.name}
                    className='mr-2 h-6 w-6 rounded-full'
                  />
                )}
                <span className='text-sm text-gray-400'>{post.blog_author?.name}</span>
              </div>
              <span className='mx-2 text-gray-500'>•</span>
              <span className='text-sm text-gray-400'>
                {new Date(post.published_at || post.created_at).toLocaleDateString()}
              </span>
              {post.tags && post.tags.length > 0 && (
                <>
                  <span className='mx-2 text-gray-500'>•</span>
                  <div className='flex flex-wrap gap-2'>
                    {post.tags.map((tag: string) => (
                      <Link
                        key={tag}
                        href={`/blog/tag/${tag}`}
                        className='rounded bg-gray-700 px-2 py-1 text-xs hover:bg-gray-600'
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            <p className='text-gray-300'>{post.excerpt || post.content.substring(0, 200)}...</p>

            <div className='mt-4'>
              <Link href={`/blog/${post.slug}`} className='text-blue-400 hover:text-blue-300'>
                {t('readMore')} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className='mt-8 flex justify-center'>
          <div className='flex space-x-2'>
            {page > 1 && (
              <Link
                href={`/blog?page=${page - 1}`}
                className='rounded-md border border-gray-700 px-4 py-2 hover:bg-gray-700'
              >
                {t('prev')}
              </Link>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Link
                key={pageNum}
                href={`/blog?page=${pageNum}`}
                className={`rounded-md border px-4 py-2 ${
                  pageNum === page ? 'border-blue-600 bg-blue-600' : 'border-gray-700 hover:bg-gray-700'
                }`}
              >
                {pageNum}
              </Link>
            ))}

            {page < totalPages && (
              <Link
                href={`/blog?page=${page + 1}`}
                className='rounded-md border border-gray-700 px-4 py-2 hover:bg-gray-700'
              >
                {t('next')}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 加载状态组件
function LoadingState() {
  return (
    <div className='mx-auto max-w-pc px-4 py-8'>
      <div className='animate-pulse'>
        <div className='mb-8 h-8 w-1/4 rounded bg-gray-700' />
        <div className='mb-4 h-6 w-1/5 rounded bg-gray-700' />
        <div className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='rounded-lg border border-gray-700 p-4'>
              <div className='mb-4 h-40 rounded bg-gray-700' />
              <div className='mb-2 h-6 w-3/4 rounded bg-gray-700' />
              <div className='mb-4 h-4 w-full rounded bg-gray-700' />
              <div className='flex justify-between'>
                <div className='h-4 w-1/4 rounded bg-gray-700' />
                <div className='h-4 w-1/4 rounded bg-gray-700' />
              </div>
            </div>
          ))}
        </div>
        <div className='mb-4 h-6 w-1/5 rounded bg-gray-700' />
        {[1, 2, 3].map((i) => (
          <div key={i} className='mb-6 rounded-lg border border-gray-700 p-6'>
            <div className='mb-4 h-6 w-3/4 rounded bg-gray-700' />
            <div className='mb-4 flex items-center'>
              <div className='mr-2 h-6 w-6 rounded-full bg-gray-700' />
              <div className='h-4 w-1/6 rounded bg-gray-700' />
            </div>
            <div className='mb-2 h-4 w-full rounded bg-gray-700' />
            <div className='mb-2 h-4 w-full rounded bg-gray-700' />
            <div className='mt-4 h-4 w-1/3 rounded bg-gray-700' />
          </div>
        ))}
      </div>
    </div>
  );
}

// 主页面组件
export default function BlogHomePage({ searchParams }: { searchParams: { page?: string } }) {
  const t = useTranslations('Blog');
  const page = parseInt(searchParams.page || '1', 10);

  return (
    <div className='mx-auto max-w-pc px-4 py-8'>
      <h1 className='mb-8 text-3xl font-bold'>{t('title')}</h1>

      <Suspense fallback={<LoadingState />}>
        {/* 热门文章区域 */}
        <PopularPostsSection />

        {/* 文章列表 */}
        <BlogPostsList page={page} />
      </Suspense>
    </div>
  );
}
