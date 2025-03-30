/* eslint-disable import/prefer-default-export */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { Database } from './types';

// 为普通用途创建客户端（可在客户端和服务器端使用）
export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase环境变量未配置');
    // 返回一个模拟的客户端对象，避免运行时错误
    return {
      from: () => ({
        select: () => ({ data: [], error: new Error('Supabase环境变量未配置') }),
      }),
    } as any;
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

// 为服务器组件创建客户端（仅在服务器端使用）
// 使用动态导入避免在客户端导入next/headers
export async function createServerComponentClient() {
  // 确保只在服务器端执行
  if (typeof window !== 'undefined') {
    console.warn('createServerComponentClient被在客户端调用，将回退使用普通客户端');
    return createClient();
  }

  try {
    // 动态导入服务器端依赖项
    const { cookies } = await import('next/headers');
    const { createServerClient } = await import('@supabase/ssr');

    const cookieStore = cookies();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase环境变量未配置');
      throw new Error('Supabase环境变量未配置');
    }

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      },
    );
  } catch (error) {
    console.error('创建服务器组件Supabase客户端失败:', error);
    // 降级为普通客户端
    return createClient();
  }
}
