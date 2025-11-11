import OpenAI from 'openai'
import { kimi_apikey } from './default_settings.js'
import { saveMessage, loadConversationHistory, clearConversationHistory, clearAllConversationHistory } from './database.js'
import { getMemories, formatMemoriesForPrompt, addMemory } from './memory.js'

// 创建 AI API 客户端
const client = new OpenAI({
  apiKey: kimi_apikey,
  baseURL: 'https://api.moonshot.cn/v1',
})

// 存储每个群聊的对话历史（内存缓存，用于快速访问）
const conversationHistory = new Map()

// 定义记忆工具的函数描述
const memoryTools = [
  {
    type: 'function',
    function: {
      name: 'add_memory',
      description: '保存重要信息到长期记忆中。当对话中出现需要长期记住的关键信息时使用此工具，例如：用户偏好、重要日期、群规则、项目信息、个人信息等。这些记忆会在未来的所有对话中被加载。',
      parameters: {
        type: 'object',
        properties: {
          memory_text: {
            type: 'string',
            description: '需要记住的内容，用清晰的自然语言描述，包含关键人物/时间/事件信息'
          }
        },
        required: ['memory_text']
      }
    }
  }
]

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
      // 先尝试从数据库加载历史
      if (options.usePersistence) {
        console.log(`📚 从数据库加载对话历史: ${conversationId}`)
        const dbHistory = await loadConversationHistory(conversationId, options.maxHistoryLength || 20)

        if (dbHistory.length > 0) {
          conversationHistory.set(conversationId, dbHistory)
          console.log(`✅ 从数据库加载了 ${dbHistory.length} 条历史记录`)
        } else {
          // 数据库没有历史，初始化新对话
          const baseSystemPrompt = options.systemPrompt || '你是一个有帮助的 AI 助手，你会为用户提供安全，有帮助，准确的回答。'

          // 加载记忆并附加到系统提示词
          let systemPrompt = baseSystemPrompt
          if (options.useMemory) {
            const memories = await getMemories(conversationId)
            if (memories.length > 0) {
              systemPrompt += formatMemoriesForPrompt(memories)
              console.log(`🧠 加载了 ${memories.length} 条记忆`)
            }
          }

          conversationHistory.set(conversationId, [
            {
              role: 'system',
              content: systemPrompt
            }
          ])
          // 保存系统提示词到数据库
          await saveMessage(conversationId, 'system', systemPrompt)
        }
      } else {
        // 不使用持久化，仅内存
        const baseSystemPrompt = options.systemPrompt || '你是一个有帮助的 AI 助手，你会为用户提供安全，有帮助，准确的回答。'

        // 即使不持久化对话，也可以加载记忆
        let systemPrompt = baseSystemPrompt
        if (options.useMemory) {
          const memories = await getMemories(conversationId)
          if (memories.length > 0) {
            systemPrompt += formatMemoriesForPrompt(memories)
            console.log(`🧠 加载了 ${memories.length} 条记忆`)
          }
        }

        conversationHistory.set(conversationId, [
          {
            role: 'system',
            content: systemPrompt
          }
        ])
      }
    }

    const messages = conversationHistory.get(conversationId)

    // 添加用户消息
    messages.push({
      role: 'user',
      content: userMessage
    })

    // 保存用户消息到数据库
    if (options.usePersistence) {
      await saveMessage(conversationId, 'user', userMessage)
    }

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
      tools: options.useMemory ? memoryTools : undefined,
      tool_choice: options.useMemory ? 'auto' : undefined
    })

    const responseMessage = completion.choices[0].message

    // 处理工具调用（如果AI决定添加记忆）
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // 将AI的工具调用消息添加到历史
      conversationHistory.get(conversationId).push(responseMessage)

      // 处理每个工具调用
      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === 'add_memory') {
          const args = JSON.parse(toolCall.function.arguments)
          console.log(`💾 AI 决定添加记忆: ${args.memory_text}`)

          // 保存记忆到数据库
          await addMemory(conversationId, args.memory_text)

          // 添加工具调用结果到历史
          conversationHistory.get(conversationId).push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify({ success: true, message: '记忆已保存' })
          })
        }
      }

      // 再次调用AI获取最终回复
      const finalCompletion = await client.chat.completions.create({
        model: options.model || 'kimi-k2-turbo-preview',
        messages: conversationHistory.get(conversationId),
        temperature: options.temperature || 0.6
      })

      const assistantMessage = finalCompletion.choices[0].message.content

      // 将助手回复添加到历史记录
      conversationHistory.get(conversationId).push({
        role: 'assistant',
        content: assistantMessage
      })

      // 保存助手回复到数据库
      if (options.usePersistence) {
        await saveMessage(conversationId, 'assistant', assistantMessage)
      }

      return assistantMessage
    }

    // 获取 AI 的回复（没有工具调用的情况）
    const assistantMessage = responseMessage.content

    // 将助手回复添加到历史记录
    conversationHistory.get(conversationId).push({
      role: 'assistant',
      content: assistantMessage
    })

    // 保存助手回复到数据库
    if (options.usePersistence) {
      await saveMessage(conversationId, 'assistant', assistantMessage)
    }

    return assistantMessage
  } catch (error) {
    console.error('❌ AI API 调用失败:', error)
    throw error
  }
}

/**
 * 清除指定群聊的对话历史（内存和数据库）
 * @param {string} conversationId - 对话ID（群聊ID）
 * @param {boolean} clearDB - 是否同时清除数据库（默认false）
 */
export async function clearConversation(conversationId, clearDB = false) {
  conversationHistory.delete(conversationId)
  console.log(`🗑️  已清除内存中对话 ${conversationId} 的历史`)

  if (clearDB) {
    await clearConversationHistory(conversationId)
  }
}

/**
 * 清除所有对话历史（内存和数据库）
 * @param {boolean} clearDB - 是否同时清除数据库（默认false）
 */
export async function clearAllConversations(clearDB = false) {
  conversationHistory.clear()
  console.log('🗑️  已清除内存中所有对话历史')

  if (clearDB) {
    await clearAllConversationHistory()
  }
}
