import { Suspense } from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import type { BlogAuthor, BlogPost } from '@/db/supabase/types';
import { getTranslations } from 'next-intl/server';

import { RevalidateOneDay } from '@/lib/constants';
import { getBlogPostsByTag } from '@/lib/services/blog-service';

// 扩展 BlogPost 类型以包含 blog_author
type BlogPostWithAuthor = BlogPost & {
  blog_author?: BlogAuthor;
};

export const revalidate = RevalidateOneDay;

type Props = {
  params: { locale: string; tag: string };
  searchParams: { page?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  const t = await getTranslations('Blog');

  return {
    title: `${tag} - ${t('title')} - AI Save World`,
    description: `${t('title')} - AI Save World`,
  };
}

// 加载状态组件
function LoadingState() {
  return (
    <div className='animate-pulse'>
      <div className='mb-8 h-8 w-1/3 rounded bg-gray-700' />

      <div className='space-y-6'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='rounded-lg border border-gray-700 p-6'>
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
export default async function BlogTagPage({ params, searchParams }: Props) {
  const t = await getTranslations('Blog');
  const tag = decodeURIComponent(params.tag);
  const page = parseInt(searchParams.page || '1', 10);

  // 获取文章数据
  const { posts, count } = await getBlogPostsByTag(tag, page);

  // 计算总页数
  const totalPages = Math.ceil(count / 10);

  return (
    <div className='mx-auto max-w-pc px-4 py-8'>
      <div className='mb-6'>
        <Link href='/blog' className='text-blue-400 hover:text-blue-300'>
          ← {t('backToBlog')}
        </Link>
      </div>

      <h1 className='mb-8 text-3xl font-bold'>{t('tagTitle', { tag })}</h1>

      <Suspense fallback={<LoadingState />}>
        {!posts || posts.length === 0 ? (
          <div className='py-12 text-center'>
            <p className='text-xl'>{t('noPostsWithTag', { tag })}</p>
          </div>
        ) : (
          <>
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
                      href={`/blog/tag/${encodeURIComponent(tag)}?page=${page - 1}`}
                      className='rounded-md border border-gray-700 px-4 py-2 hover:bg-gray-700'
                    >
                      {t('prev')}
                    </Link>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={`/blog/tag/${encodeURIComponent(tag)}?page=${pageNum}`}
                      className={`rounded-md border px-4 py-2 ${
                        pageNum === page ? 'border-blue-600 bg-blue-600' : 'border-gray-700 hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ))}

                  {page < totalPages && (
                    <Link
                      href={`/blog/tag/${encodeURIComponent(tag)}?page=${page + 1}`}
                      className='rounded-md border border-gray-700 px-4 py-2 hover:bg-gray-700'
                    >
                      {t('next')}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </Suspense>
    </div>
  );
}
