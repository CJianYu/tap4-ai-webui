const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');
require('dotenv').config();

// Supabase 客户端初始化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// API配置
const API_URL = 'http://127.0.0.1:8040/site/crawl';
const API_HEADERS = {
  Accept: '*/*',
  'User-Agent': 'Thunder Client (https://www.thunderclient.com)',
  'Content-Type': 'application/json',
  Authorization: 'Bearer 4487f197tap4ai8Zh42Ufi6mAHWGdy',
};

// 读取AI工具列表
async function readAiSourceList() {
  return new Promise((resolve, reject) => {
    const results = [];
    let isFirstLine = true;

    // 直接使用逐行读取，手动解析CSV
    fs.createReadStream(path.join(__dirname, 'ai_source_list/ai_tools_list_by-tap4-ai.sql.csv'))
      .on('data', (chunk) => {
        const lines = chunk.toString().split('\n');

        for (const line of lines) {
          // 跳过第一行表头
          if (isFirstLine) {
            isFirstLine = false;
            continue;
          }

          // 解析CSV行
          const parts = line.split(',');

          // 第1列是name，第2列是URL，第3列是description
          // 如果第1列为空但第2列有内容，认为是URL
          if (parts.length >= 1) {
            const url = parts[0].trim();
            if (url && url.startsWith('http')) {
              results.push(url);
            }
            // 如果第1列不是URL但第2列是，则使用第2列
            else if (parts.length >= 2 && parts[1].trim() && parts[1].trim().startsWith('http')) {
              results.push(parts[1].trim());
            }
          }
        }
      })
      .on('end', () => {
        console.log(`读取到${results.length}个AI工具URL`);
        resolve(results);
      })
      .on('error', (error) => {
        console.error('读取CSV文件失败:', error);
        reject(error);
      });
  });
}

// 保存剩余的URL到文件
async function saveRemainingUrls(urls) {
  if (!urls || urls.length === 0) return;

  try {
    // 创建备份
    const originalPath = path.join(__dirname, 'ai_source_list/ai_tools_list_by-tap4-ai.sql.csv');
    const backupPath = path.join(__dirname, 'ai_source_list/ai_tools_list_backup.csv');

    if (fs.existsSync(originalPath)) {
      fs.copyFileSync(originalPath, backupPath);
      console.log('已创建原始文件备份');
    }

    // 读取原始CSV头部
    const header = fs.readFileSync(originalPath, 'utf8').split('\n')[0];

    // 构建新的CSV内容
    const csvContent = [
      header,
      ...urls.map((url) => {
        // 简单处理，假设只有url一列
        // 实际情况应该保留原始行的所有列
        return url;
      }),
    ].join('\n');

    fs.writeFileSync(originalPath, csvContent);
    console.log(`已将${urls.length}个剩余URL保存回文件`);
  } catch (error) {
    console.error('保存剩余URL失败:', error);
  }
}

// 调用API获取AI工具数据
async function crawlAiTool(url) {
  try {
    console.log(`正在爬取: ${url}`);
    const requestData = {
      url,
      tags: ['selected tags: ai-detector', 'chatbot', 'text-writing', 'image', 'code-it'],
    };

    const response = await axios.post(API_URL, requestData, {
      headers: API_HEADERS,
      timeout: 30000, // 30秒超时
    });

    if (response.status === 200) {
      console.log(`成功爬取: ${url}`);
      // 检查API响应格式
      const responseData = response.data;
      if (responseData.code === 200 && responseData.msg === 'success' && responseData.data) {
        console.log(`API返回数据成功: ${responseData.data.name || responseData.data.title}`);
        return responseData; // 直接返回完整响应，让updateSupabase来处理
      } else {
        console.error(`API返回格式异常:`, responseData);
        return null;
      }
    } else {
      console.error(`爬取失败 ${url}: 状态码 ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`爬取失败 ${url}:`, error.message);
    return null;
  }
}

// 更新Supabase数据库
async function updateSupabase(data) {
  if (!data) return false;

  try {
    // API返回的数据格式为 { code: 200, msg: 'success', data: {...} }
    // 需要检查code并提取内部data对象
    let toolData;

    if (data.code === 200 && data.msg === 'success' && data.data) {
      toolData = data.data;
      console.log('API返回成功，提取内部data对象');
    } else if (data.url) {
      // 如果数据直接就是工具数据对象
      toolData = data;
      console.log('API直接返回工具数据对象');
    } else {
      console.error('API响应格式不符合预期:', data);
      return false;
    }

    // 格式化爬取的数据以匹配web_navigation表结构
    const formattedData = {
      name: toolData.name || toolData.title || '',
      url: toolData.url || '',
      title: toolData.title || '',
      category_name: 'AI Tools', // 默认分类
      content: toolData.description || '',
      detail: toolData.detail || '',
      image_url: toolData.screenshot_data || toolData.image_url || '',
      thumbnail_url: toolData.screenshot_thumbnail_data || toolData.thumbnail_url || '',
      tag_name: (toolData.tags || []).join(','),
      star_rating: 5, // 默认评分
      collection_time: new Date().toISOString(),
      website_data: JSON.stringify(toolData),
    };

    console.log('格式化后的数据:', {
      name: formattedData.name,
      url: formattedData.url,
      title: formattedData.title,
      // 其他字段太长，不输出
    });

    // 检查是否已存在相同URL的记录
    const { data: existingData, error: fetchError } = await supabase
      .from('web_navigation')
      .select('id')
      .eq('url', formattedData.url)
      .maybeSingle();

    if (fetchError) {
      console.error('查询数据库失败:', fetchError);
      return false;
    }

    let result;
    if (existingData?.id) {
      // 更新现有记录
      console.log(`更新记录 ID: ${existingData.id}`);
      result = await supabase.from('web_navigation').update(formattedData).eq('id', existingData.id);
    } else {
      // 插入新记录
      console.log('插入新记录');
      result = await supabase.from('web_navigation').insert(formattedData);
    }

    if (result.error) {
      console.error('更新Supabase失败:', result.error);
      return false;
    }

    console.log('Supabase更新成功');
    return true;
  } catch (error) {
    console.error('更新Supabase时发生错误:', error);
    return false;
  }
}

// 主函数
async function main() {
  console.log('开始爬取AI工具数据...');
  let aiSourceList = await readAiSourceList();
  const originalCount = aiSourceList.length;

  // 处理结果记录
  const results = {
    success: [],
    failed: [],
  };

  // 设置最大处理数量，避免一次处理太多
  const MAX_PROCESS = 50;
  const processCount = Math.min(aiSourceList.length, MAX_PROCESS);

  // 逐个处理AI工具，只处理列表前面的几个
  for (let i = 0; i < processCount; i++) {
    const url = aiSourceList[0]; // 始终处理列表中的第一个
    console.log(`处理 ${url}... (${i + 1}/${processCount})`);

    const data = await crawlAiTool(url);

    if (data) {
      const updateSuccess = await updateSupabase(data);
      if (updateSuccess) {
        results.success.push(url);
      } else {
        results.failed.push(url);
      }
    } else {
      results.failed.push(url);
    }

    // 从列表中删除已处理的URL
    aiSourceList = aiSourceList.filter((item) => item !== url);

    // 随机延迟1-3秒，避免请求过快
    const delay = Math.floor(Math.random() * 2000) + 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // 保存剩余未处理的URL回文件
  await saveRemainingUrls(aiSourceList);

  // 汇总结果
  console.log('\n爬取完成!');
  console.log(`成功: ${results.success.length}`);
  console.log(`失败: ${results.failed.length}`);
  console.log(`剩余: ${aiSourceList.length}`);
  console.log(`处理进度: ${originalCount - aiSourceList.length}/${originalCount}`);

  if (results.failed.length > 0) {
    console.log('\n失败的URL:');
    results.failed.forEach((url) => console.log(`- ${url}`));
  }
}

// 执行主函数
main().catch(console.error);
