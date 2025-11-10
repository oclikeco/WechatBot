// 高级示例：集成 AI 对话的配置

export default {
  // 目标群聊
  targetRooms: [
    '测试群',
  ],

  // 基础回复规则
  autoReplyRules: [
    {
      keyword: /^\/help$/,
      reply: `🤖 机器人命令列表：
/help - 显示帮助
/time - 获取当前时间
/weather - 查询天气
/joke - 讲个笑话`
    },
    {
      keyword: /^\/time$/,
      reply: () => `⏰ 当前时间：${new Date().toLocaleString('zh-CN')}`
    },
    {
      keyword: /早上好|早安/i,
      reply: ['早上好！', '早安！新的一天开始了', '早～'][Math.floor(Math.random() * 3)]
    },
    {
      keyword: /晚安/i,
      reply: '晚安，做个好梦～'
    },
  ],

  // 高级选项
  replyOnlyWhenMentioned: false,
  replyToSelf: false,
  defaultReply: null,

  // AI 回复配置（示例，需要自行实现）
  aiConfig: {
    enabled: false,
    apiKey: 'your-api-key',
    model: 'gpt-3.5-turbo',
    // 当没有匹配到规则时，是否使用 AI 回复
    fallbackToAI: true,
  },

  // 防刷屏配置
  antiSpam: {
    enabled: true,
    maxMessagesPerMinute: 10,
  },

  // 欢迎新成员
  welcomeNewMember: {
    enabled: true,
    message: '欢迎新成员 @{name} 加入群聊！'
  },
}
