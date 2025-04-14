require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');
const https = require('https');

// 设置默认超时时间和重试次数
const DEFAULT_TIMEOUT = 60000; // 60秒
const DEFAULT_RETRY = 3;

// 创建axios实例并配置
const axiosInstance = axios.create({
  timeout: DEFAULT_TIMEOUT,
  httpsAgent: new https.Agent({
    keepAlive: true,
    rejectUnauthorized: false, // 注意：在生产环境中应该设置为true
  }),
  proxy: process.env.HTTPS_PROXY
    ? {
        host: process.env.HTTPS_PROXY.split('://')[1].split(':')[0],
        port: parseInt(process.env.HTTPS_PROXY.split('://')[1].split(':')[1]),
      }
    : null,
});

// 创建xAI API客户端
const xaiClient = axios.create({
  baseURL: 'https://api.x.ai',
  timeout: DEFAULT_TIMEOUT,
  headers: {
    Authorization: `Bearer ${process.env.XAI_API_KEY || 'xai-bRzRbECs4q39ybG58tIDzyJWQhaYMJ7eTnleH45iMdUBWtVEqJzYfEYuj3KEcDPCAW04Utro2n6GY3Xi'}`,
    'Content-Type': 'application/json',
  },
});

// 初始化服务
const parser = new Parser({
  timeout: DEFAULT_TIMEOUT,
  customFields: {
    item: ['media:content', 'content', 'contentSnippet'],
  },
});

// 初始化Supabase客户端
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// 配置RSS源和网站
const sources = [
  { type: 'rss', url: 'https://www.artificialintelligence-news.com/feed/' },
  { type: 'rss', url: 'https://venturebeat.com/category/ai/feed/' },
  { type: 'web', url: 'https://www.techcrunch.com/category/artificial-intelligence', selector: 'article' },
  // 添加更多信息源
];

// xAI API调用函数
async function callXaiApi(messages, model = 'grok-2', temperature = 0.7) {
  try {
    console.log(`调用xAI API，使用模型: ${model}...`);

    const response = await xaiClient.post('/v1/chat/completions', {
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: 2048,
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('xAI API 调用失败:', error.response?.data || error.message);
    throw error;
  }
}

// 辅助函数：重试函数
async function withRetry(fn, retries = DEFAULT_RETRY, delay = 2000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.log(`操作失败，${delay / 1000}秒后重试，剩余重试次数: ${retries}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 1.5);
  }
}

// 主函数
async function generateBlog() {
  try {
    console.log('开始博客生成流程...');

    // 1. 抓取内容
    const articles = await withRetry(() => fetchContentFromSources());
    console.log(`从信息源获取了${articles.length}篇文章`);

    if (articles.length === 0) {
      console.log('没有获取到文章，终止流程');
      return { success: false, error: '没有获取到文章' };
    }

    // 2. 分析和筛选内容
    let selectedContent;
    let isAiSuccess = true;

    try {
      selectedContent = await withRetry(() => analyzeAndFilterContent(articles));
      console.log('内容分析和筛选完成');
    } catch (error) {
      console.error('xAI内容分析失败:', error);
      isAiSuccess = false;
      return { success: false, error: 'xAI内容分析失败，终止流程' };
    }

    // 3. 生成博客文章
    let blogPost;
    try {
      blogPost = await withRetry(() => generateBlogContent(selectedContent));
      console.log('博客内容生成完成');
    } catch (error) {
      console.error('xAI内容生成失败:', error);
      isAiSuccess = false;
      return { success: false, error: 'xAI内容生成失败，终止流程' };
    }

    // 如果AI处理失败，不继续翻译和发布
    if (!isAiSuccess) {
      console.log('xAI处理失败，终止流程');
      return { success: false, error: 'xAI处理失败，终止流程' };
    }

    // 4. 多语言翻译 (一次只翻译一个语言以减少超时风险)
    let translatedPosts;
    try {
      translatedPosts = await translateContentSequentially(blogPost);
      console.log('多语言翻译完成');
    } catch (error) {
      console.error('xAI翻译失败:', error);
      return { success: false, error: 'xAI翻译失败，终止流程' };
    }

    // 5. 保存到数据库
    await withRetry(() => saveToDatabase(translatedPosts));
    console.log('博客已保存到数据库');

    return { success: true, message: '博客生成和发布成功' };
  } catch (error) {
    console.error('博客生成过程中出错:', error);
    return { success: false, error: error.message };
  }
}

// 从各种源获取内容
async function fetchContentFromSources() {
  const allArticles = [];
  const ONE_DAY_AGO = new Date();
  ONE_DAY_AGO.setDate(ONE_DAY_AGO.getDate() - 1);

  for (const source of sources) {
    try {
      if (source.type === 'rss') {
        const feed = await withRetry(() => parser.parseURL(source.url));
        feed.items.forEach((item) => {
          const pubDate = new Date(item.pubDate);
          if (pubDate >= ONE_DAY_AGO) {
            allArticles.push({
              title: item.title,
              content: item.content || item.contentSnippet,
              link: item.link,
              pubDate: item.pubDate,
              source: feed.title,
            });
          }
        });
      } else if (source.type === 'web') {
        const response = await withRetry(() => axiosInstance.get(source.url));
        const $ = cheerio.load(response.data);
        $(source.selector).each((i, element) => {
          // 根据网站结构提取信息
          const title = $(element).find('h2').text().trim();
          const link = $(element).find('a').attr('href');
          const summary = $(element).find('p').text().trim();

          // 尝试从不同网站结构中提取日期
          let pubDate;
          const dateSelectors = ['.date', '.post-date', '.article-date', 'time', '[datetime]', '.published-date'];

          for (const selector of dateSelectors) {
            const dateElement = $(element).find(selector);
            if (dateElement.length) {
              const dateText = dateElement.text().trim() || dateElement.attr('datetime');
              if (dateText) {
                pubDate = new Date(dateText);
                if (!isNaN(pubDate)) break;
              }
            }
          }

          // 如果无法获取日期，使用当前时间
          if (!pubDate || isNaN(pubDate)) {
            pubDate = new Date();
          }

          if (pubDate >= ONE_DAY_AGO && title && link) {
            allArticles.push({
              title,
              content: summary,
              link,
              pubDate: pubDate.toISOString(),
              source: source.url,
            });
          }
        });
      }
    } catch (error) {
      console.error(`从源 ${source.url} 获取内容时出错:`, error.message);
    }
  }

  // 去重逻辑
  const uniqueArticles = new Map();
  allArticles.forEach((article) => {
    // 使用标题和链接作为唯一标识
    const key = `${article.title}-${article.link}`;
    if (!uniqueArticles.has(key)) {
      uniqueArticles.set(key, article);
    }
  });

  // 按发布日期排序并限制数量
  return Array.from(uniqueArticles.values())
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 20); // 只保留最新的20篇文章
}

// 使用xAI分析和筛选内容
async function analyzeAndFilterContent(articles) {
  if (articles.length === 0) {
    return '未找到足够的相关文章进行分析。';
  }

  // 预处理：合并过多的文章以适应API限制
  const combinedContent = articles
    .map((a) => `Title: ${a.title}\nSource: ${a.source}\nLink: ${a.link}\nSummary: ${a.content?.substring(0, 300)}...`)
    .join('\n\n')
    .substring(0, 12000); // 限制总文本长度

  // 调用xAI API
  const messages = [
    {
      role: 'system',
      content:
        '你是一个AI研究员，专门筛选最新、最有价值的AI应用案例。筛选标准：1)内容的原创性和新颖性 2)行业实用性 3)技术创新程度 4)可能的社会影响',
    },
    {
      role: 'user',
      content: `以下是今天抓取的AI相关文章，请分析并筛选出5-8个最有价值的内容，特别关注各行各业如何使用AI的实际案例。提取关键信息并分类整理：\n\n${combinedContent}`,
    },
  ];

  return await callXaiApi(messages, 'grok-2', 0.5);
}

// 使用xAI生成博客内容
async function generateBlogContent(selectedContent) {
  const currentDate = new Date().toISOString().split('T')[0];
  const timestamp = Date.now(); // 添加时间戳确保唯一性

  // 调用xAI API
  const messages = [
    {
      role: 'system',
      content:
        '你是一位专业的AI趋势分析师和技术作家。你的文章具有深度洞察力、清晰的结构和实用的见解。请使用HTML格式输出，包含适当的<h1>, <h2>, <p>, <ul>, <li>等标签，而不是使用Markdown格式。',
    },
    {
      role: 'user',
      content: `根据以下筛选的内容，撰写一篇完整的博客文章，主题为"AI行业动态周报：各行各业的AI应用案例(${currentDate})"。文章需包含：1)引人入胜的介绍 2)按行业或应用类型分类的案例分析 3)每个案例的技术实现和价值 4)未来发展趋势 5)结论。确保内容原创、有见地且引用来源。请使用HTML格式输出，不要使用Markdown：\n\n${selectedContent}`,
    },
  ];

  const content = await callXaiApi(messages, 'grok-2', 0.7);

  const title = `AI行业动态周报：各行各业的AI应用案例(${currentDate})`;

  // 创建带有时间戳的slug，确保唯一性
  const slug = `ai-industry-weekly-update-${currentDate}-${timestamp}`.toLowerCase().replace(/[^\w\s\-]/g, '');

  // 提取第一段作为摘要
  let excerpt = '';
  const firstParagraphMatch = content.match(/<p>(.*?)<\/p>/);
  if (firstParagraphMatch && firstParagraphMatch[1]) {
    excerpt = firstParagraphMatch[1].substring(0, 200) + '...';
  } else {
    excerpt = content.split('\n\n')[0].substring(0, 200) + '...';
  }

  return {
    title,
    slug,
    content,
    excerpt,
    tags: ['AI', '行业动态', '应用案例', '技术趋势'],
  };
}

// 顺序翻译内容为多语言版本，一次只翻译一种语言
async function translateContentSequentially(blogPost) {
  // 定义所有支持的语言
  const targetLanguages = [
    { code: 'cn', name: '简体中文' },
    { code: 'tw', name: '繁體中文' },
    // 减少语言数量以提高成功率
    { code: 'jp', name: '日本語' },
    { code: 'es', name: 'Español' },
  ];

  // 先生成英文版本作为主要版本
  console.log(`生成英文版本作为默认语言...`);
  let englishTitle, englishContent, englishExcerpt, englishSlug;

  try {
    // 为英文版本发送翻译请求
    const messages = [
      {
        role: 'system',
        content:
          'You are a professional translator specializing in AI and technology content. Translate the following Chinese blog post into fluent, natural English while preserving all technical details and insights.',
      },
      {
        role: 'user',
        content: `Translate the following content to English.\nTitle: ${blogPost.title}\nExcerpt: ${blogPost.excerpt}\nContent: ${blogPost.content}`,
      },
    ];

    const translatedResult = await callXaiApi(messages, 'grok-2', 0.3);

    // 提取翻译后的标题、摘要和内容
    let title = '',
      excerpt = '',
      content = '';

    // 尝试提取标题
    const titleMatch = translatedResult.match(/Title:(.*?)(?=Excerpt:|Content:|$)/s);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    // 尝试提取摘要
    const excerptMatch = translatedResult.match(/Excerpt:(.*?)(?=Content:|$)/s);
    if (excerptMatch && excerptMatch[1]) {
      excerpt = excerptMatch[1].trim();
    }

    // 尝试提取内容
    const contentMatch = translatedResult.match(/Content:(.*?)$/s);
    if (contentMatch && contentMatch[1]) {
      content = contentMatch[1].trim();
    } else {
      // 如果没有明确的Content标记，使用剩余的所有文本
      content = translatedResult
        .replace(/Title:.*?(?=Excerpt:|$)/s, '')
        .replace(/Excerpt:.*?(?=Content:|$)/s, '')
        .replace(/Content:/s, '')
        .trim();
    }

    // 如果提取失败，使用原始内容
    englishTitle =
      title ||
      `AI Industry Weekly Update: AI Application Cases Across Various Industries (${blogPost.title.match(/\(\d{4}-\d{2}-\d{2}\)/)?.[0] || ''})`;
    englishExcerpt = excerpt || blogPost.excerpt;
    englishContent = content || blogPost.content;

    // 使用博客文章的slug作为英文版的slug
    englishSlug = blogPost.slug;

    console.log('英文版本生成成功');
  } catch (error) {
    console.error('生成英文版本失败:', error);
    // 出错时使用简单的英文转换
    englishTitle = `AI Industry Weekly Update: AI Application Cases Across Various Industries (${blogPost.title.match(/\(\d{4}-\d{2}-\d{2}\)/)?.[0] || ''})`;
    englishExcerpt = 'Weekly update of AI applications across various industries...';
    englishContent = blogPost.content;
    englishSlug = blogPost.slug;
  }

  // 创建多语言内容对象，默认包含英文(en)
  const multilingual = {
    en: {
      title: englishTitle,
      content: englishContent,
      excerpt: englishExcerpt,
      slug: englishSlug,
    },
    tags: blogPost.tags,
  };

  // 添加中文版本
  multilingual.cn = {
    title: blogPost.title,
    content: blogPost.content,
    excerpt: blogPost.excerpt,
    slug: englishSlug + '-cn',
  };

  // 逐个翻译其他语言
  for (const lang of targetLanguages) {
    if (lang.code === 'cn') continue; // 中文已经添加，跳过

    console.log(`翻译内容为 ${lang.name} (${lang.code})...`);

    try {
      await withRetry(async () => {
        const systemMessages = {
          tw: '你是一位專業翻譯，專門處理AI和科技內容。請將以下中文博客文章翻譯成流暢、自然的繁體中文，同時保留所有技術細節和見解。',
          jp: 'あなたはAIとテクノロジーのコンテンツを専門とするプロの翻訳者です。次の中国語のブログ投稿を、すべての技術的な詳細と洞察を保持しながら、流暢で自然な日本語に翻訳してください。',
          es: 'Eres un traductor profesional especializado en contenidos de IA y tecnología. Traduce la siguiente publicación de blog en chino a un español fluido y natural, conservando todos los detalles técnicos y perspectivas.',
        };

        // 为每种语言发送单独的翻译请求，使用中文原文进行翻译
        const messages = [
          {
            role: 'system',
            content: systemMessages[lang.code],
          },
          {
            role: 'user',
            content: `Translate the following content to ${lang.name}.\nTitle: ${blogPost.title}\nExcerpt: ${blogPost.excerpt}\nContent: ${blogPost.content}`,
          },
        ];

        const translatedResult = await callXaiApi(messages, 'grok-2', 0.3);

        // 提取翻译后的标题、摘要和内容
        let title = '',
          excerpt = '',
          content = '';

        // 尝试提取标题
        const titleMatch = translatedResult.match(/Title:(.*?)(?=Excerpt:|Content:|$)/s);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
        }

        // 尝试提取摘要
        const excerptMatch = translatedResult.match(/Excerpt:(.*?)(?=Content:|$)/s);
        if (excerptMatch && excerptMatch[1]) {
          excerpt = excerptMatch[1].trim();
        }

        // 尝试提取内容
        const contentMatch = translatedResult.match(/Content:(.*?)$/s);
        if (contentMatch && contentMatch[1]) {
          content = contentMatch[1].trim();
        } else {
          // 如果没有明确的Content标记，使用剩余的所有文本
          content = translatedResult
            .replace(/Title:.*?(?=Excerpt:|$)/s, '')
            .replace(/Excerpt:.*?(?=Content:|$)/s, '')
            .replace(/Content:/s, '')
            .trim();
        }

        // 如果提取失败，使用整个翻译结果
        if (!title) title = blogPost.title;
        if (!excerpt || excerpt.startsWith('<!DOCTYPE') || excerpt.startsWith('<html')) {
          // 从内容中提取摘要
          if (content && content.match(/<p>(.*?)<\/p>/)) {
            const firstParagraphMatch = content.match(/<p>(.*?)<\/p>/);
            if (firstParagraphMatch && firstParagraphMatch[1]) {
              excerpt = firstParagraphMatch[1].substring(0, 200) + '...';
            } else {
              excerpt = content.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
            }
          } else {
            excerpt = translatedResult.split('\n')[0].substring(0, 200) + '...';
          }
          console.log(`修复了${lang.code}语言的摘要内容`);
        }
        if (!content) content = translatedResult;

        // 将翻译后的内容添加到多语言对象
        multilingual[lang.code] = {
          title: title,
          content: content,
          excerpt: excerpt,
          slug: `${englishSlug}-${lang.code}`,
        };

        // 等待一段时间，避免API请求过快
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }, 2);
    } catch (error) {
      console.error(`翻译到 ${lang.name} 失败:`, error);
      // 出错时使用默认内容
      multilingual[lang.code] = {
        title: blogPost.title,
        content: blogPost.content,
        excerpt: blogPost.excerpt,
        slug: `${englishSlug}-${lang.code}`,
      };
    }
  }

  return multilingual;
}

// 保存博客到数据库
async function saveToDatabase(translatedPosts) {
  try {
    // 获取默认作者ID
    const { data: authorData, error: authorError } = await supabase.from('blog_author').select('id').limit(1).single();

    if (authorError) {
      console.error('获取作者ID失败:', authorError);
      // 创建一个默认作者
      const { data: newAuthor, error: createError } = await supabase
        .from('blog_author')
        .insert([{ name: 'AI Bot', bio: 'Auto-generated content bot' }])
        .select();

      if (createError) throw createError;
      authorData = newAuthor[0];
    }

    // 准备多语言字段 - 使用英文版本作为默认值
    const languages = Object.keys(translatedPosts).filter((key) => key !== 'tags');
    const defaultLanguage = 'en';

    // 准备i18n对象 - 为每种非默认语言创建条目
    const i18n = {};

    // 同时准备content_translations等字段（兼容旧结构）
    const title_translations = {};
    const content_translations = {};
    const excerpt_translations = {};

    // 对每种语言进行规范化处理
    languages.forEach((lang) => {
      if (lang !== defaultLanguage && translatedPosts[lang]) {
        // 确保摘要正确提取，可能需要从内容中提取
        let excerpt = translatedPosts[lang].excerpt || '';

        // 检查并修复excerpt内容，确保它不包含HTML标签开头
        if (excerpt.startsWith('<!DOCTYPE') || excerpt.startsWith('<html')) {
          // 从内容中提取第一段作为摘要
          const contentText = translatedPosts[lang].content || '';
          const firstParagraphMatch = contentText.match(/<p>(.*?)<\/p>/);
          if (firstParagraphMatch && firstParagraphMatch[1]) {
            excerpt = firstParagraphMatch[1].substring(0, 200) + '...';
          } else {
            excerpt = contentText.replace(/<[^>]*>/g, '').substring(0, 200) + '...';
          }

          // 更新translatedPosts中的摘要
          translatedPosts[lang].excerpt = excerpt;

          console.log(`修复了${lang}语言的摘要内容`);
        }

        // 新结构：i18n字段
        i18n[lang] = {
          title: translatedPosts[lang].title,
          content: translatedPosts[lang].content,
          excerpt: excerpt,
        };

        // 旧结构：单独的 _translations 字段 - 确保完全相同的内容
        title_translations[lang] = translatedPosts[lang].title;
        content_translations[lang] = translatedPosts[lang].content;
        excerpt_translations[lang] = excerpt;
      }
    });

    // 检查该slug是否已存在
    const { data: existingPost, error: checkError } = await supabase
      .from('blog_post')
      .select('id')
      .eq('slug', translatedPosts[defaultLanguage].slug)
      .maybeSingle();

    if (checkError) {
      console.error('检查已有博客时出错:', checkError);
      throw checkError;
    }

    let result;

    if (existingPost) {
      // 如果已存在，则更新该记录
      console.log(`发现已有博客(ID: ${existingPost.id})，将进行更新...`);
      const { error: updateError } = await supabase
        .from('blog_post')
        .update({
          title: translatedPosts[defaultLanguage].title,
          content: translatedPosts[defaultLanguage].content,
          excerpt: translatedPosts[defaultLanguage].excerpt,
          author_id: authorData.id,
          published_at: new Date().toISOString(),
          status: 2, // 已发布状态
          tags: translatedPosts.tags,
          i18n: i18n, // 使用i18n字段存储其他语言版本
          title_translations: title_translations, // 兼容旧结构
          content_translations: content_translations, // 兼容旧结构
          excerpt_translations: excerpt_translations, // 兼容旧结构
        })
        .eq('id', existingPost.id);

      if (updateError) throw updateError;
      result = existingPost;
    } else {
      // 不存在则创建新记录
      const { data: newPost, error: insertError } = await supabase
        .from('blog_post')
        .insert({
          title: translatedPosts[defaultLanguage].title,
          slug: translatedPosts[defaultLanguage].slug,
          content: translatedPosts[defaultLanguage].content,
          excerpt: translatedPosts[defaultLanguage].excerpt,
          author_id: authorData.id,
          published_at: new Date().toISOString(),
          status: 2, // 已发布状态
          tags: translatedPosts.tags,
          i18n: i18n, // 使用i18n字段存储其他语言版本
          title_translations: title_translations, // 兼容旧结构
          content_translations: content_translations, // 兼容旧结构
          excerpt_translations: excerpt_translations, // 兼容旧结构
        })
        .select()
        .single();

      if (insertError) throw insertError;
      result = newPost;
    }

    console.log('博客内容已成功保存到数据库');
    console.log('博客ID:', result.id);
    console.log('默认语言(英文)标题:', translatedPosts[defaultLanguage].title);
    console.log('多语言版本数量:', Object.keys(i18n).length);
    console.log('使用了双重兼容结构，同时支持i18n和_translations字段');
  } catch (error) {
    console.error('保存到数据库时出错:', error);
    throw error;
  }
}

// 执行主函数
if (require.main === module) {
  generateBlog()
    .then((result) => {
      console.log(result);
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('执行出错:', error);
      process.exit(1);
    });
}

module.exports = { generateBlog };
