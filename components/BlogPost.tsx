import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useLocale, useTranslations } from 'next-intl';

// 支持的语言列表
const SUPPORTED_LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸' },
  cn: { name: '简体中文', flag: '🇨🇳' },
  tw: { name: '繁體中文', flag: '🇹🇼' },
  jp: { name: '日本語', flag: '🇯🇵' },
  es: { name: 'Español', flag: '🇪🇸' },
};

// 初始化Supabase客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 博客帖子接口
interface BlogPostData {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  published_at: string;
  status: number;
  author_id: number;
  tags: string[];
  i18n?: Record<
    string,
    {
      title?: string;
      content?: string;
      excerpt?: string;
    }
  >;
  author?: {
    name: string;
    bio: string;
  };
}

interface BlogPostProps {
  slug: string;
  initialData?: BlogPostData;
}

// 使用函数声明而不是函数表达式
function BlogPost({ slug, initialData }: BlogPostProps): React.ReactElement {
  const t = useTranslations('Blog');
  const locale = useLocale();
  const [post, setPost] = useState<BlogPostData | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(locale || 'en');

  // 获取博客帖子数据
  useEffect(() => {
    if (!slug || initialData) return;

    const fetchPost = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('blog_post')
          .select('*, author:blog_author(*)')
          .eq('slug', slug)
          .single();

        if (fetchError) {
          const supabaseError = new Error(fetchError.message);
          throw supabaseError;
        }
        setPost(data);
      } catch (err: any) {
        console.error('Error fetching blog post:', err);
        setError(err.message || 'Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, initialData]);

  // 处理语言切换
  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
  };

  // 获取当前语言的内容
  const getLocalizedContent = (field: 'title' | 'content' | 'excerpt'): string => {
    if (!post) return '';

    // 调试输出
    console.log('当前选择的语言:', selectedLanguage);
    console.log('可用的语言:', post.i18n ? Object.keys(post.i18n) : '没有i18n字段');
    console.log('i18n内容:', post.i18n);

    // 如果选择英文(默认语言)，直接返回主字段内容
    if (selectedLanguage === 'en') {
      return post[field] || '';
    }

    // 如果选择其他语言，从i18n字段获取
    if (post.i18n && post.i18n[selectedLanguage]) {
      const translatedContent = post.i18n[selectedLanguage][field];
      console.log(`${selectedLanguage}语言的${field}字段:`, translatedContent ? '有内容' : '无内容');
      return translatedContent || post[field] || '';
    }

    // 如果当前语言没有翻译，回退到英文
    console.log(`没有找到${selectedLanguage}语言的翻译，回退到英文`);
    return post[field] || '';
  };

  if (loading) return <div className='py-12 text-center'>{t('loading')}</div>;
  if (error) return <div className='py-12 text-center text-red-500'>{error}</div>;
  if (!post) return <div className='py-12 text-center'>{t('postNotFound')}</div>;

  const postDate = new Date(post.published_at).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // 获取按钮的CSS类名，避免嵌套三元表达式
  const getButtonClassName = (code: string) => {
    const base = 'px-2 py-1 text-sm font-medium border border-gray-300 focus:outline-none';
    const selected =
      code === selectedLanguage ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50';

    // 位置相关样式
    let position = '';
    if (code === Object.keys(SUPPORTED_LANGUAGES)[0]) {
      position = 'rounded-l-md';
    } else if (code === Object.keys(SUPPORTED_LANGUAGES)[Object.keys(SUPPORTED_LANGUAGES).length - 1]) {
      position = 'rounded-r-md';
    } else {
      position = 'border-l-0 border-r-0';
    }

    return `${base} ${selected} ${position}`;
  };

  return (
    <div className='container mx-auto max-w-4xl px-4 py-8'>
      {/* 语言选择器 */}
      <div className='mb-6 flex justify-end'>
        <div className='inline-flex rounded-md shadow-sm'>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, { name, flag }]) => (
            <button
              key={code}
              type='button'
              onClick={() => handleLanguageChange(code)}
              className={getButtonClassName(code)}
            >
              <span className='mr-1'>{flag}</span>
              <span className='hidden sm:inline'>{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 博客标题和元数据 */}
      <div className='mb-10'>
        <h1 className='mb-6 text-4xl font-bold'>{getLocalizedContent('title')}</h1>
        <div className='flex flex-wrap items-center text-gray-600'>
          <span className='mb-2 mr-4'>{postDate}</span>
          {post.author && (
            <span className='mb-2 mr-4'>
              {t('by')} {post.author.name}
            </span>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className='flex flex-wrap'>
              {post.tags.map((tag) => (
                <span key={tag} className='mb-2 mr-2 rounded bg-gray-200 px-2 py-1 text-xs text-gray-800'>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 博客内容 - 使用直接HTML渲染 */}
      <article className='prose prose-lg max-w-none'>
        <div dangerouslySetInnerHTML={{ __html: getLocalizedContent('content') }} />
      </article>
    </div>
  );
}

export default BlogPost;
