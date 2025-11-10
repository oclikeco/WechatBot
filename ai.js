import OpenAI from 'openai'
import { kimi_apikey } from './default_settings.js'

// 创建 AI API 客户端
const client = new OpenAI({
  apiKey: kimi_apikey,
  baseURL: 'https://api.moonshot.cn/v1',
})

// 存储每个群聊的对话历史（用于实现群级别的上下文记忆）
const conversationHistory = new Map()

/**
 * 调用 AI API 获取回复
 * @param {string} userMessage - 用户发送的消息（包含用户名标注，如 "张三: 你好"）
 * @param {string} conversationId - 对话ID（通常是群聊ID，同一个群共享对话历史）
 * @param {object} options - 可选配置
 * @returns {Promise<string>} AI 的回复内容
 */
export async function getAIResponse(userMessage, conversationId = 'default', options = {}) {
  try {
    // 获取或初始化该对话的历史
    if (!conversationHistory.has(conversationId)) {
      conversationHistory.set(conversationId, [
        {
          role: 'system',
          content: options.systemPrompt || '你是一个有帮助的 AI 助手，你会为用户提供安全，有帮助，准确的回答。'
        }
      ])
    }

    const messages = conversationHistory.get(conversationId)

    // 添加用户消息
    messages.push({
      role: 'user',
      content: userMessage
    })

    // 限制历史消息长度，避免超过 token 限制
    const maxHistoryLength = options.maxHistoryLength || 20
    if (messages.length > maxHistoryLength) {
      // 保留系统提示词和最近的消息
      const systemMessage = messages[0]
      const recentMessages = messages.slice(-maxHistoryLength + 1)
      conversationHistory.set(conversationId, [systemMessage, ...recentMessages])
    }

    // 调用 AI API
    const completion = await client.chat.completions.create({
      model: options.model || 'kimi-k2-turbo-preview',
      messages: conversationHistory.get(conversationId),
      temperature: options.temperature || 0.6,
    })

    // 获取 AI 的回复
    const assistantMessage = completion.choices[0].message.content

    // 将助手回复添加到历史记录
    conversationHistory.get(conversationId).push({
      role: 'assistant',
      content: assistantMessage
    })

    return assistantMessage
  } catch (error) {
    console.error('❌ AI API 调用失败:', error)
    throw error
  }
}

/**
 * 清除指定群聊的对话历史
 * @param {string} conversationId - 对话ID（群聊ID）
 */
export function clearConversation(conversationId) {
  conversationHistory.delete(conversationId)
  console.log(`🗑️  已清除对话 ${conversationId} 的历史`)
}

/**
 * 清除所有对话历史
 */
export function clearAllConversations() {
  conversationHistory.clear()
  console.log('🗑️  已清除所有对话历史')
}
