// 微信群自动回复机器人配置
export default {
  // 需要监听的群聊名称列表（支持正则匹配）
  targetRooms: [
    'test_group',
    '群星摸鱼ing（英法坡中德版'
    // 可以添加更多群名
  ],

  // 是否只在@机器人时回复
  replyOnlyWhenMentioned: true,

  // 是否回复自己的消息
  replyToSelf: false,

  // AI API 配置
  aiModel: 'kimi-k2-0905-preview', // 模型名称，根据使用的 AI 服务商调整
  aiTemperature: 0.6, // 生成温度，范围 0-1，越高越随机
  aiMaxHistoryLength: 20, // 保留的对话历史长度
  aiSystemPrompt: `你的名字是'被拉black'，也可以叫你小黑，你是一个有趣的 AI 助手，你和用户在微信里聊天，所以说话尽量简短有趣`,

  // 数据库持久化配置
  usePersistence: true, // 是否启用数据库持久化对话历史（true 使用数据库，false 仅内存）

  // Memory 记忆模块配置
  useMemory: true, // 是否启用记忆模块（自动加载关键记忆到上下文）
}
