import { createClient } from '@supabase/supabase-js'
import { supabase_url, supabase_anon_key } from './default_settings.js'

// 创建 Supabase 客户端
const supabase = createClient(supabase_url, supabase_anon_key)

/**
 * 数据库表结构：
 *
 * CREATE TABLE memories (
 *   id BIGSERIAL PRIMARY KEY,
 *   conversation_id TEXT NOT NULL,
 *   memory_text TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_memories_conversation_id ON memories(conversation_id);
 *
 * -- 启用行级安全
 * ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
 *
 * CREATE POLICY "允许所有用户读取记忆" ON memories FOR SELECT USING (true);
 * CREATE POLICY "允许所有用户插入记忆" ON memories FOR INSERT WITH CHECK (true);
 * CREATE POLICY "允许所有用户删除记忆" ON memories FOR DELETE USING (true);
 */

/**
 * 添加记忆
 * @param {string} conversationId - 对话ID（群聊ID）
 * @param {string} memoryText - 记忆内容（自然语言描述）
 */
export async function addMemory(conversationId, memoryText) {
  try {
    const { data, error } = await supabase
      .from('memories')
      .insert([
        {
          conversation_id: conversationId,
          memory_text: memoryText
        }
      ])

    if (error) {
      console.error('❌ 保存记忆失败:', error)
      throw error
    }

    console.log(`💾 已保存记忆: ${memoryText.substring(0, 50)}...`)
    return data
  } catch (error) {
    console.error('❌ 保存记忆异常:', error)
  }
}

/**
 * 获取对话的所有记忆
 * @param {string} conversationId - 对话ID（群聊ID）
 * @param {number} limit - 最多返回多少条记忆（按时间排序），默认不限制
 * @returns {Promise<Array<string>>} 记忆文本数组
 */
export async function getMemories(conversationId, limit = null) {
  try {
    let query = supabase
      .from('memories')
      .select('memory_text, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ 获取记忆失败:', error)
      return []
    }

    return data.map(m => m.memory_text)
  } catch (error) {
    console.error('❌ 获取记忆异常:', error)
    return []
  }
}

/**
 * 格式化记忆为系统提示词的一部分
 * @param {Array<string>} memories - 记忆数组
 * @returns {string} 格式化后的记忆文本
 */
export function formatMemoriesForPrompt(memories) {
  if (!memories || memories.length === 0) {
    return ''
  }

  const memoriesText = memories.map((m, i) => `${i + 1}. ${m}`).join('\n')
  return `\n\n【记忆】以下是你记住的关于这个群聊的重要信息：\n${memoriesText}\n`
}

/**
 * 删除指定记忆
 * @param {string} conversationId - 对话ID
 * @param {string} memoryText - 要删除的记忆内容
 */
export async function deleteMemory(conversationId, memoryText) {
  try {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('memory_text', memoryText)

    if (error) {
      console.error('❌ 删除记忆失败:', error)
      throw error
    }

    console.log(`🗑️  已删除记忆: ${memoryText.substring(0, 50)}...`)
  } catch (error) {
    console.error('❌ 删除记忆异常:', error)
  }
}

/**
 * 清除对话的所有记忆
 * @param {string} conversationId - 对话ID
 */
export async function clearMemories(conversationId) {
  try {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('conversation_id', conversationId)

    if (error) {
      console.error('❌ 清除记忆失败:', error)
      throw error
    }

    console.log(`🗑️  已清除对话 ${conversationId} 的所有记忆`)
  } catch (error) {
    console.error('❌ 清除记忆异常:', error)
  }
}

/**
 * 搜索记忆（简单的关键词匹配）
 * @param {string} conversationId - 对话ID
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<Array<string>>} 匹配的记忆
 */
export async function searchMemories(conversationId, keyword) {
  try {
    const { data, error } = await supabase
      .from('memories')
      .select('memory_text')
      .eq('conversation_id', conversationId)
      .ilike('memory_text', `%${keyword}%`)

    if (error) {
      console.error('❌ 搜索记忆失败:', error)
      return []
    }

    return data.map(m => m.memory_text)
  } catch (error) {
    console.error('❌ 搜索记忆异常:', error)
    return []
  }
}

/**
 * 获取记忆统计
 * @param {string} conversationId - 对话ID
 * @returns {Promise<Object>} 统计信息
 */
export async function getMemoryStats(conversationId) {
  try {
    const { count, error } = await supabase
      .from('memories')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    if (error) {
      console.error('❌ 获取记忆统计失败:', error)
      return { count: 0 }
    }

    return { count }
  } catch (error) {
    console.error('❌ 获取记忆统计异常:', error)
    return { count: 0 }
  }
}
