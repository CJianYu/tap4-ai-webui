import { createClient, createServerComponentClient } from '@/db/supabase/client';
import { BlogComment } from '@/db/supabase/types';

// 当发生错误时，使用一个标准化的错误处理函数
const handleServiceError = (
  operation: string,
  error: unknown,
  defaultReturn: any,
  context: Record<string, any> = {},
) => {
  console.error(`Error in ${operation}:`, error, context);
  return defaultReturn;
};

// 获取所有已发布的博客文章（分页）
export async function getBlogPosts(page = 1, limit = 10) {
  try {
    const supabase = await createServerComponentClient();
    const offset = (page - 1) * limit;

    const {
      data: posts,
      error,
      count,
    } = await supabase
      .from('blog_post')
      .select('*, blog_author(*)', { count: 'exact' })
      .eq('status', 2) // 已发布状态
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return { posts: posts || [], count: count || 0 };
  } catch (err) {
    return handleServiceError('getBlogPosts', err, { posts: [], count: 0 }, { page, limit });
  }
}

// 获取单篇博客文章
export async function getBlogPostBySlug(slug: string) {
  try {
    const supabase = await createServerComponentClient();

    const { data: post, error } = await supabase
      .from('blog_post')
      .select('*, blog_author(*)')
      .eq('slug', slug)
      .single();

    if (error) {
      throw error;
    }

    // 在后台增加浏览次数，但不要阻塞返回结果
    // 使用普通客户端而不是服务器客户端
    try {
      await createClient()
        .from('blog_post')
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq('slug', slug);
    } catch (updateError) {
      console.error('Error updating view count:', updateError);
    }

    return post;
  } catch (err) {
    return handleServiceError('getBlogPostBySlug', err, null, { slug });
  }
}

// 获取热门博客文章
export async function getPopularBlogPosts(limit = 5) {
  try {
    const supabase = await createServerComponentClient();

    const { data: posts, error } = await supabase
      .from('blog_post')
      .select('*, blog_author(*)')
      .eq('status', 2) // 已发布状态
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return posts || [];
  } catch (err) {
    return handleServiceError('getPopularBlogPosts', err, [], { limit });
  }
}

// 获取相关博客文章（基于标签）
export async function getRelatedBlogPosts(currentPostSlug: string, tags: string[], limit = 3) {
  try {
    if (!tags || tags.length === 0) {
      return await getPopularBlogPosts(limit);
    }

    const supabase = await createServerComponentClient();

    // 基于标签找相关文章
    const { data: posts, error } = await supabase
      .from('blog_post')
      .select('*, blog_author(*)')
      .eq('status', 2) // 已发布状态
      .neq('slug', currentPostSlug) // 排除当前文章
      .contains('tags', tags)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    if (!posts || posts.length < limit) {
      // 如果相关文章不足，则补充热门文章
      const popularPosts = await getPopularBlogPosts(limit);

      if (!posts) {
        return popularPosts.filter((post: any) => post.slug !== currentPostSlug).slice(0, limit);
      }

      // 合并相关文章和热门文章，确保没有重复
      const existingSlugs = new Set(posts.map((post: any) => post.slug));
      const additionalPosts = popularPosts.filter(
        (post: any) => post.slug !== currentPostSlug && !existingSlugs.has(post.slug),
      );

      return [...posts, ...additionalPosts].slice(0, limit);
    }

    return posts;
  } catch (err) {
    // 如果出错，返回热门文章
    return handleServiceError('getRelatedBlogPosts', err, await getPopularBlogPosts(limit), {
      currentPostSlug,
      tags,
      limit,
    });
  }
}

// 获取文章评论
export async function getBlogComments(postSlug: string) {
  try {
    const supabase = await createServerComponentClient();

    const { data: comments, error } = await supabase
      .from('blog_comment')
      .select('*')
      .eq('post_slug', postSlug)
      .eq('status', 1) // 已批准的评论
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return comments || [];
  } catch (err) {
    return handleServiceError('getBlogComments', err, [], { postSlug });
  }
}

// 提交评论
export const submitComment = async (comment: Omit<BlogComment, 'id' | 'created_at' | 'status'>) => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('blog_comment')
      .insert({
        ...comment,
        status: 0, // 待审核状态
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('Unknown error submitting comment'),
    };
  }
};

// 按标签获取文章
export async function getBlogPostsByTag(tag: string, page = 1, limit = 10) {
  try {
    const supabase = await createServerComponentClient();
    const offset = (page - 1) * limit;

    const {
      data: posts,
      error,
      count,
    } = await supabase
      .from('blog_post')
      .select('*, blog_author(*)', { count: 'exact' })
      .eq('status', 2) // 已发布状态
      .contains('tags', [tag])
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return { posts: posts || [], count: count || 0 };
  } catch (err) {
    return handleServiceError('getBlogPostsByTag', err, { posts: [], count: 0 }, { tag, page, limit });
  }
}

// 添加博客评论
export async function addBlogComment(
  comment: Pick<BlogComment, 'post_slug' | 'author_name' | 'author_email' | 'content' | 'parent_id'>,
) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.from('blog_comment').insert(comment).select().single();

    if (error) {
      throw error;
    }

    return data;
  } catch (err) {
    throw err instanceof Error ? err : new Error('添加评论失败');
  }
}
