# 微信群自动回复机器人

基于 Wechaty 实现的微信群自动回复机器人，支持关键词匹配、正则表达式、@回复等功能。

## 功能特点

- ✅ 支持多个群聊同时监听
- ✅ 关键词匹配自动回复（支持正则表达式）
- ✅ @机器人触发回复
- ✅ 灵活的配置系统
- ✅ 二维码扫码登录
- ✅ 自动保存登录状态

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置机器人

编辑 `config.js` 文件，配置需要监听的群聊和回复规则：

```javascript
export default {
  // 需要监听的群聊名称
  targetRooms: [
    '测试群',
    '工作群',
  ],

  // 自动回复规则
  autoReplyRules: [
    {
      keyword: /你好|hello/i,
      reply: '你好！我是自动回复机器人'
    },
    // 添加更多规则...
  ],
}
```

### 3. 启动机器人

```bash
npm start
```

首次启动会显示二维码，使用微信扫码登录即可。

## 配置说明

### `targetRooms` - 目标群聊

指定需要监听的群聊名称，支持字符串和正则表达式：

```javascript
targetRooms: [
  '测试群',              // 精确匹配
  /开发.*/,              // 正则匹配，如：开发组、开发部
]
```

### `autoReplyRules` - 回复规则

定义关键词和对应的回复内容：

```javascript
autoReplyRules: [
  {
    keyword: /天气/,                    // 关键词（支持正则）
    reply: '请查看天气预报网站'          // 回复内容
  },
  {
    keyword: /价格|多少钱/,
    reply: '请联系客服咨询价格信息'
  },
]
```

### 其他配置选项

- `replyOnlyWhenMentioned`: 是否只在@机器人时回复（默认 false）
- `replyToSelf`: 是否回复自己的消息（默认 false）
- `defaultReply`: 未匹配到规则时的默认回复（默认 null 不回复）

## 核心实现原理

### 1. Wechaty 初始化

```javascript
import { WechatyBuilder } from 'wechaty'

const bot = WechatyBuilder.build({
  name: 'wechat-bot',
  puppet: 'wechaty-puppet-wechat4u',
})
```

### 2. 事件监听

Wechaty 提供了丰富的事件：

- `scan` - 扫码登录
- `login` - 登录成功
- `logout` - 登出
- `message` - 收到消息
- `error` - 错误处理

### 3. 消息处理流程

```javascript
bot.on('message', async (message) => {
  // 1. 获取消息所在群聊
  const room = message.room()

  // 2. 判断是否为目标群聊
  const roomTopic = await room.topic()

  // 3. 匹配回复规则
  for (const rule of config.autoReplyRules) {
    if (rule.keyword.test(text)) {
      await room.say(rule.reply)
      break
    }
  }
})
```

### 4. @回复功能

```javascript
// 检测是否@了机器人
const mentionSelf = await message.mentionSelf()

// @回发送者
if (mentionSelf) {
  await room.say(replyText, sender)
}
```

## 高级用法

### 动态回复

可以在回复规则中使用函数来实现动态内容：

```javascript
autoReplyRules: [
  {
    keyword: /时间/,
    reply: () => `当前时间：${new Date().toLocaleString()}`
  },
]
```

然后修改 bot.js 中的回复逻辑：

```javascript
if (replyText) {
  const finalReply = typeof replyText === 'function'
    ? replyText()
    : replyText
  await room.say(finalReply)
}
```

### 多条件匹配

```javascript
{
  keyword: /订单.*查询|查询.*订单/,
  reply: '请提供订单号，格式：订单号 + 数字'
}
```

### 群聊白名单/黑名单

```javascript
// 白名单模式（只回复指定群）
targetRooms: ['VIP客户群', '技术支持群']

// 排除特定群（需要自己实现逻辑）
const excludeRooms = ['管理群']
if (excludeRooms.includes(roomTopic)) {
  return
}
```

## 注意事项

1. **微信账号安全**
   - 新注册的微信号可能无法登录
   - 建议使用已实名认证的微信账号
   - 避免频繁发送消息，可能被微信限制

2. **Puppet 选择**
   - `wechaty-puppet-wechat4u`: 免费，基于网页协议
   - `wechaty-puppet-padlocal`: 付费，更稳定
   - `wechaty-puppet-service`: 付费，功能最全

3. **登录状态保存**
   - 登录信息会保存在 `.memory-card.json` 文件中
   - 重启机器人会自动恢复登录状态

4. **消息延迟**
   - 网页协议可能有消息延迟
   - 建议添加适当的延迟避免被限制

## 常见问题

### Q: 扫码后提示登录失败？
A: 可能是微信账号不支持网页登录，尝试使用其他 Puppet 或更换账号。

### Q: 机器人无法接收消息？
A: 检查群名称配置是否正确，可以添加日志查看实际群名。

### Q: 如何实现智能对话？
A: 可以集成 ChatGPT、文心一言等 AI API，在回复规则中调用。

### Q: 能否实现定时发送消息？
A: 可以，使用 `setInterval` 或 `node-schedule` 实现定时任务。

## 扩展功能建议

- 接入 AI 对话（ChatGPT、Claude 等）
- 添加数据库存储聊天记录
- 实现图片、文件自动回复
- 添加管理员命令控制
- 统计分析群聊数据
- 实现自动欢迎新成员
- 添加敏感词过滤

## 相关资源

- [Wechaty 官方文档](https://wechaty.js.org/)
- [Wechaty GitHub](https://github.com/wechaty/wechaty)
- [Puppet 对比](https://wechaty.js.org/docs/puppet-services/)

## 许可证

ISC
