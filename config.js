// 微信群自动回复机器人配置
export default {
  // 需要监听的群聊名称列表（支持正则匹配）
  targetRooms: [
    'test_group'
    // 可以添加更多群名
  ],

  // 自动回复规则
  autoReplyRules: [
    {
      // 关键词匹配（支持正则表达式）
      keyword: /你好|hello|hi/i,
      // 回复内容
      reply: '你好！我是自动回复机器人，有什么可以帮助你的吗？'
    },
    {
      keyword: /天气/,
      reply: '请查看天气预报网站获取最新天气信息'
    },
    {
      keyword: /帮助|help/i,
      reply: `📖 机器人功能说明：
1. 自动回复常见问题
2. 关键词触发回复
3. @机器人进行交互

输入关键词即可获得相应回复！`
    }
  ],

  // 是否只在@机器人时回复
  replyOnlyWhenMentioned: false,

  // 是否回复自己的消息
  replyToSelf: false,

  // 默认回复（当没有匹配到关键词时）
  defaultReply: null, // 设置为 null 则不回复，或设置具体文本
}
