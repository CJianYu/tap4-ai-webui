import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createClient } from '@/db/supabase/client';
import type { NavigationCategory } from '@/db/supabase/types';
import { ArrowRight, CircleChevronRight, Star, TrendingUp, Zap } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { RevalidateOneHour } from '@/lib/constants';
import Faq from '@/components/Faq';
import SearchForm from '@/components/home/SearchForm';
import WebNavCardList from '@/components/webNav/WebNavCardList';

import { TagList } from './Tag';

const ScrollToTop = dynamic(() => import('@/components/page/ScrollToTop'), { ssr: false });

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: 'Metadata.home',
  });

  const title = t('title');
  const description = t('description');
  const keywords = t('keywords');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL as string;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords,
    alternates: {
      canonical: './',
      languages: {
        en: '/en',
        'zh-CN': '/zh-CN',
      },
    },
    openGraph: {
      type: 'website',
      url: siteUrl,
      title,
      description,
      siteName: 'AI Save World',
      images: [
        {
          url: `${siteUrl}/images/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/images/og-image.png`],
    },
  };
}

export const revalidate = RevalidateOneHour;

export default async function Page() {
  const supabase = createClient();
  const t = await getTranslations('Home');
  const [
    { data: categoryList },
    { data: navigationList },
    { data: popularTools },
    { data: latestNews },
    { data: userReviews },
  ] = await Promise.all([
    supabase.from('navigation_category').select(),
    supabase.from('web_navigation').select().order('collection_time', { ascending: false }).limit(12),
    supabase.from('web_navigation').select().order('view_count', { ascending: false }).limit(6),
    supabase
      .from('blog_posts')
      .select('id,title,slug,excerpt,published_at')
      .order('published_at', { ascending: false })
      .limit(3),
    supabase
      .from('user_reviews')
      .select('id,user_name,rating,comment,tool_id,created_at')
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  return (
    <div className='relative w-full'>
      <div className='relative mx-auto w-full max-w-pc flex-1 px-3 lg:px-0'>
        {/* 英雄区域 - 更现代的设计 */}
        <div className='my-8 flex flex-col text-center lg:mx-auto lg:my-16 lg:gap-3'>
          <div className='mx-auto mb-4 inline-flex items-center justify-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-sm text-blue-400'>
            <Zap size={16} className='animate-pulse' />
            <span>AI Tools Directory</span>
          </div>
          <h1 className='bg-gradient-to-r from-white to-blue-400 bg-clip-text text-3xl font-extrabold text-transparent text-white lg:text-6xl'>
            {t('title')}
          </h1>
          <h2 className='mx-auto mt-3 max-w-2xl text-balance text-sm text-gray-300 lg:text-lg'>{t('subTitle')}</h2>
          <div className='mt-8 flex w-full items-center justify-center'>
            <SearchForm />
          </div>
        </div>

        {/* 标签列表 - 更好的间距和动画 */}
        <div className='mb-12 mt-8'>
          <TagList
            data={categoryList!.map((item: NavigationCategory) => ({
              id: String(item.id),
              name: item.name,
              href: `/category/${item.name}`,
            }))}
          />
        </div>

        {/* 工具分类导航区块 - 更精美的卡片设计 */}
        <section className='mb-16 px-1'>
          <div className='mb-8 flex items-center justify-center gap-3'>
            <div className='h-[1px] w-12 bg-gradient-to-r from-transparent to-blue-500' />
            <h2 className='text-center text-2xl font-bold lg:text-3xl'>{t('toolCategories')}</h2>
            <div className='h-[1px] w-12 bg-gradient-to-l from-transparent to-blue-500' />
          </div>
          <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
            {categoryList?.slice(0, 8).map((category: NavigationCategory) => (
              <Link
                key={category.id}
                href={`/category/${category.name}`}
                className='bg-tap4-gray/10 hover:bg-tap4-gray/20 group relative overflow-hidden rounded-xl border border-gray-800 p-5 text-center transition-all duration-300 hover:border-blue-500/50'
              >
                <div className='absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                <h3 className='mb-2 text-lg font-medium transition-colors group-hover:text-blue-400'>
                  {category.name}
                </h3>
                <p className='text-sm text-gray-400'>{category.title || `${t('exploreTools')} ${category.name}`}</p>
                <div className='mt-3 flex items-center justify-center'>
                  <span className='flex transform items-center gap-1 text-xs text-blue-400 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100'>
                    {t('exploreTools')} <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* AI工具列表 - 更现代的标题样式 */}
        <div className='mb-16 flex flex-col gap-5'>
          <div className='mb-4 flex items-center justify-center gap-3'>
            <div className='h-[1px] w-12 bg-gradient-to-r from-transparent to-blue-500' />
            <h2 className='text-center text-2xl font-bold lg:text-3xl'>{t('ai-navigate')}</h2>
            <div className='h-[1px] w-12 bg-gradient-to-l from-transparent to-blue-500' />
          </div>
          <WebNavCardList dataList={navigationList!} />
          <Link
            href='/explore'
            className='mx-auto mt-2 flex w-fit items-center justify-center gap-2 rounded-full border border-blue-600/30 bg-blue-600/20 px-6 py-3 text-sm font-medium text-blue-400 transition-all duration-300 hover:bg-blue-600/30'
          >
            {t('exploreMore')}
            <CircleChevronRight className='h-[16px] w-[16px]' />
          </Link>
        </div>

        {/* 热门AI工具推荐区块 - 更有吸引力的卡片设计 */}
        <section className='mb-16'>
          <div className='mb-8 flex items-center justify-center gap-3'>
            <div className='h-[1px] w-12 bg-gradient-to-r from-transparent to-blue-500' />
            <h2 className='flex items-center gap-2 text-center text-2xl font-bold lg:text-3xl'>
              <Star size={20} className='text-yellow-400' /> {t('popularAITools')}
            </h2>
            <div className='h-[1px] w-12 bg-gradient-to-l from-transparent to-blue-500' />
          </div>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {popularTools?.map((tool: any) => (
              <div
                key={tool.id}
                className='bg-tap4-gray/10 hover:bg-tap4-gray/15 group rounded-xl border border-gray-800 p-6 transition-all duration-300 hover:border-blue-500/30'
              >
                <div className='mb-4 flex items-center gap-3'>
                  {tool.logo ? (
                    <img
                      src={tool.logo}
                      alt={tool.name}
                      className='h-12 w-12 rounded-xl border border-gray-700 object-cover transition-all duration-300 group-hover:border-blue-500/50'
                    />
                  ) : (
                    <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 font-bold text-blue-400'>
                      {tool.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className='truncate text-lg font-bold transition-colors group-hover:text-blue-400'>
                      {tool.name}
                    </h3>
                    <div className='flex items-center text-xs text-gray-400'>
                      <TrendingUp size={12} className='mr-1 text-green-400' />
                      <span>{tool.view_count || 0} views</span>
                    </div>
                  </div>
                </div>
                <p className='mb-4 line-clamp-2 min-h-[40px] text-sm text-gray-300'>{tool.description}</p>
                <div className='flex items-center justify-between'>
                  <span className='rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-400'>
                    {tool.category}
                  </span>
                  <Link
                    href={`/ai/${tool.slug}`}
                    className='flex items-center gap-1 text-sm font-medium text-blue-400 transition-transform duration-300 hover:underline group-hover:translate-x-1'
                  >
                    {t('learnMore')} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className='mt-8 text-center'>
            <Link
              href='/explore'
              className='inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-medium text-white shadow-lg shadow-blue-900/20 transition-all duration-300 hover:from-blue-500 hover:to-blue-600'
            >
              {t('viewAllTools')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* 最新AI资讯区块 - 更现代的博客卡片 */}
        {latestNews && latestNews.length > 0 && (
          <section className='mb-16'>
            <div className='mb-8 flex items-center justify-center gap-3'>
              <div className='h-[1px] w-12 bg-gradient-to-r from-transparent to-blue-500' />
              <h2 className='text-center text-2xl font-bold lg:text-3xl'>{t('latestAINews')}</h2>
              <div className='h-[1px] w-12 bg-gradient-to-l from-transparent to-blue-500' />
            </div>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              {latestNews.map((post: any, index: number) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className='bg-tap4-gray/10 hover:bg-tap4-gray/15 group flex h-full flex-col rounded-xl border border-gray-800 p-6 transition-all duration-300 hover:border-blue-500/30'
                >
                  <span className='mb-2 w-fit rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400'>
                    Blog #{index + 1}
                  </span>
                  <h3 className='mb-3 text-xl font-bold transition-colors group-hover:text-blue-400'>{post.title}</h3>
                  <p className='mb-4 line-clamp-3 flex-grow text-sm text-gray-300'>{post.excerpt}</p>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs text-gray-400'>{new Date(post.published_at).toLocaleDateString()}</span>
                    <span className='flex items-center gap-1 text-sm text-blue-400 opacity-0 transition-all duration-300 group-hover:opacity-100'>
                      Read <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className='mt-8 text-center'>
              <Link
                href='/blog'
                className='inline-flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-6 py-3 font-medium text-white transition-all duration-300 hover:border-white hover:bg-white/10'
              >
                {t('readBlog')}
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        )}

        {/* 用户评价区块 - 更精美的评价卡片 */}
        {userReviews && userReviews.length > 0 && (
          <section className='mb-16'>
            <div className='mb-8 flex items-center justify-center gap-3'>
              <div className='h-[1px] w-12 bg-gradient-to-r from-transparent to-blue-500' />
              <h2 className='flex items-center gap-2 text-center text-2xl font-bold lg:text-3xl'>{t('userReviews')}</h2>
              <div className='h-[1px] w-12 bg-gradient-to-l from-transparent to-blue-500' />
            </div>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              {userReviews.map((review: any) => (
                <div
                  key={review.id}
                  className='bg-tap4-gray/10 hover:bg-tap4-gray/15 rounded-xl border border-gray-800 p-6 transition-all duration-300'
                >
                  <div className='mb-4 flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 font-bold text-blue-400'>
                        {review.user_name.charAt(0).toUpperCase()}
                      </div>
                      <span className='text-lg font-medium'>{review.user_name}</span>
                    </div>
                    <div className='flex items-center'>
                      <span className='flex text-yellow-400'>{'★'.repeat(review.rating)}</span>
                      <span className='flex text-gray-600'>{'★'.repeat(5 - review.rating)}</span>
                    </div>
                  </div>
                  <p className='mb-4 italic text-gray-300'>&quot;{review.comment}&quot;</p>
                  <div className='text-right text-xs text-gray-400'>
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <Faq />
        <ScrollToTop />
      </div>
    </div>
  );
}
