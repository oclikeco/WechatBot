import { createClient } from '@supabase/supabase-js'
import { supabase_url, supabase_anon_key } from './default_settings.js'

// 创建 Supabase 客户端
const supabase = createClient(supabase_url, supabase_anon_key)

/**
 * 初始化数据库表（首次运行时调用）
 * 需要在 Supabase 控制台创建以下表：
 *
 * 表名: conversation_history
 * 字段:
 *   - id (bigint, primary key, auto-increment)
 *   - conversation_id (text) - 群聊ID
 *   - role (text) - 消息角色: system, user, assistant
 *   - content (text) - 消息内容
 *   - created_at (timestamp with time zone, default: now())
 *
 * SQL 创建语句:
 *
 * CREATE TABLE conversation_history (
 *   id BIGSERIAL PRIMARY KEY,
 *   conversation_id TEXT NOT NULL,
 *   role TEXT NOT NULL,
 *   content TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_conversation_id ON conversation_history(conversation_id);
 * CREATE INDEX idx_created_at ON conversation_history(created_at);
 */

/**
 * 保存消息到数据库
 * @param {string} conversationId - 对话ID（群聊ID）
 * @param {string} role - 消息角色: system, user, assistant
 * @param {string} content - 消息内容
 */
export async function saveMessage(conversationId, role, content) {
  try {
    const { data, error } = await supabase
      .from('conversation_history')
      .insert([
        {
          conversation_id: conversationId,
          role: role,
          content: content
        }
      ])

    if (error) {
      console.error('❌ 保存消息到数据库失败:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('❌ 保存消息异常:', error)
    // 不抛出错误，避免影响主流程
  }
}

/**
 * 从数据库加载对话历史
 * @param {string} conversationId - 对话ID（群聊ID）
 * @param {number} limit - 加载最近 N 条消息（默认20）
 * @returns {Promise<Array>} 消息数组
 */
export async function loadConversationHistory(conversationId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('conversation_history')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ 从数据库加载对话历史失败:', error)
      return []
    }

    // 反转顺序，使最旧的消息在前
    return data.reverse().map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  } catch (error) {
    console.error('❌ 加载对话历史异常:', error)
    return []
  }
}

/**
 * 清除指定对话的历史记录
 * @param {string} conversationId - 对话ID（群聊ID）
 */
export async function clearConversationHistory(conversationId) {
  try {
    const { error } = await supabase
      .from('conversation_history')
      .delete()
      .eq('conversation_id', conversationId)

    if (error) {
      console.error('❌ 清除对话历史失败:', error)
      throw error
    }

    console.log(`🗑️  已从数据库清除对话 ${conversationId} 的历史`)
  } catch (error) {
    console.error('❌ 清除对话历史异常:', error)
  }
}

/**
 * 清除所有对话历史
 */
export async function clearAllConversationHistory() {
  try {
    const { error } = await supabase
      .from('conversation_history')
      .delete()
      .neq('id', 0) // 删除所有记录

    if (error) {
      console.error('❌ 清除所有对话历史失败:', error)
      throw error
    }

    console.log('🗑️  已从数据库清除所有对话历史')
  } catch (error) {
    console.error('❌ 清除所有对话历史异常:', error)
  }
}

/**
 * 清理过期的对话历史（保留最近 N 天的记录）
 * @param {number} days - 保留最近 N 天的记录（默认30天）
 */
export async function cleanupOldHistory(days = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { error } = await supabase
      .from('conversation_history')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('❌ 清理过期历史失败:', error)
      throw error
    }

    console.log(`🧹 已清理 ${days} 天前的对话历史`)
  } catch (error) {
    console.error('❌ 清理过期历史异常:', error)
  }
}

/**
 * 获取对话统计信息
 * @param {string} conversationId - 对话ID（群聊ID）
 * @returns {Promise<Object>} 统计信息
 */
export async function getConversationStats(conversationId) {
  try {
    const { count, error } = await supabase
      .from('conversation_history')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    if (error) {
      console.error('❌ 获取统计信息失败:', error)
      return { messageCount: 0 }
    }

    return { messageCount: count }
  } catch (error) {
    console.error('❌ 获取统计信息异常:', error)
    return { messageCount: 0 }
  }
}
