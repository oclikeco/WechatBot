# 微信群 AI 聊天机器人

基于 Wechaty 和 Kimi API 实现的智能微信群聊机器人，支持 AI 对话、上下文记忆、群级别对话历史等功能。

## 功能特点

- ✅ AI 智能对话（基于 Kimi API）
- ✅ 群级别对话上下文记忆
- ✅ 支持多个群聊同时监听
- ✅ @机器人触发回复
- ✅ 识别发送者身份
- ✅ 灵活的配置系统
- ✅ 二维码扫码登录
- ✅ 自动保存登录状态

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API Key

编辑 `default_settings.js` 文件，填入你的 Kimi API Key：

```javascript
export const kimi_apikey = "你的API密钥"
```

> 在 [Moonshot AI 开放平台](https://platform.moonshot.cn/) 注册并获取 API Key

### 3. 配置机器人

编辑 `config.js` 文件，配置需要监听的群聊和 AI 参数：

```javascript
export default {
  // 需要监听的群聊名称
  targetRooms: [
    'test_group',
    '工作群',
  ],

  // 是否只在@机器人时回复
  replyOnlyWhenMentioned: true,

  // AI API 配置
  aiModel: 'kimi-k2-0905-preview',
  aiTemperature: 0.6,
  aiMaxHistoryLength: 20,
  aiSystemPrompt: '你是一个有趣的 AI 助手...',
}
```

### 4. 启动机器人

```bash
npm start
```

首次启动会显示二维码，使用微信扫码登录即可。

## 配置说明

### `targetRooms` - 目标群聊

指定需要监听的群聊名称，支持字符串和正则表达式：

```javascript
targetRooms: [
  'test_group',          // 精确匹配
  /开发.*/,              // 正则匹配，如：开发组、开发部
]
```

### AI 配置选项

- `aiModel`: AI 模型名称
  - `kimi-k2-0905-preview` (推荐)
  - `kimi-k2-turbo-preview`
  - `moonshot-v1-8k`
  - `moonshot-v1-32k`
  - `moonshot-v1-128k`

- `aiTemperature`: 生成温度（0-1）
  - 越低越保守，越高越随机
  - 默认 0.6

- `aiMaxHistoryLength`: 对话历史长度
  - 保留最近 N 轮对话
  - 默认 20

- `aiSystemPrompt`: 系统提示词
  - 定义 AI 的角色和行为
  - 可自定义个性化设定

### 其他配置选项

- `replyOnlyWhenMentioned`: 是否只在@机器人时回复（默认 true）
- `replyToSelf`: 是否回复自己的消息（默认 false）

## 核心实现原理

### 1. 项目架构

```
├── bot.js              # 主程序，处理微信消息事件
├── ai.js               # AI API 调用模块
├── config.js           # 机器人配置文件
└── default_settings.js # API Key 等敏感配置
```

### 2. 群级别对话历史

本机器人采用**群级别的对话历史管理**：

- 同一个群内的所有人共享对话上下文
- AI 能看到群里所有人和它的对话记录
- 消息格式：`用户名: 消息内容`，让 AI 知道是谁在说话
- 不同群之间的对话历史完全独立

示例：
```
张三: @机器人 今天天气怎么样？
机器人: @张三 今天天气晴朗...

李四: @机器人 张三刚才问的是哪里的天气？
机器人: @李四 张三刚才问的是今天的天气...
```

### 3. 消息处理流程

```javascript
bot.on('message', async (message) => {
  // 1. 获取消息所在群聊
  const room = message.room()

  // 2. 检查是否@了机器人
  const mentionSelf = await message.mentionSelf()

  // 3. 使用群聊 ID 作为对话标识
  const conversationId = await room.id
  const userName = sender.name()

  // 4. 调用 AI API 获取回复
  const messageWithUser = `${userName}: ${text}`
  const reply = await getAIResponse(messageWithUser, conversationId)

  // 5. @回发送者
  await room.say(reply, sender)
})
```

### 4. AI API 集成

使用 OpenAI SDK 调用 Kimi API：

```javascript
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: kimi_apikey,
  baseURL: 'https://api.moonshot.cn/v1',
})

const completion = await client.chat.completions.create({
  model: 'kimi-k2-0905-preview',
  messages: conversationHistory,
  temperature: 0.6,
})
```

## 高级用法

### 切换 AI 模型

只需修改 `config.js` 中的 `aiModel` 配置，无需修改代码：

```javascript
// 使用更快的模型
aiModel: 'kimi-k2-turbo-preview',

// 使用更长上下文的模型
aiModel: 'moonshot-v1-32k',
```

### 自定义 AI 人格

通过 `aiSystemPrompt` 配置定制 AI 的行为和个性：

```javascript
aiSystemPrompt: `你是一个资深的技术专家，擅长回答编程问题。
回答时请：
1. 简洁明了，直击重点
2. 提供代码示例
3. 保持友好和专业的语气`
```

### 调整对话历史长度

根据使用场景调整历史长度：

```javascript
// 短对话场景（节省 token）
aiMaxHistoryLength: 10,

// 需要长期记忆（消耗更多 token）
aiMaxHistoryLength: 50,
```

### 更换其他 AI 服务

项目设计为通用 AI 接口，可轻松切换到其他服务：

编辑 `ai.js` 修改 API 端点和参数：

```javascript
// 切换到 OpenAI
const client = new OpenAI({
  apiKey: your_openai_key,
  baseURL: 'https://api.openai.com/v1',
})

// 切换到其他兼容 OpenAI API 的服务
const client = new OpenAI({
  apiKey: your_api_key,
  baseURL: 'https://your-service.com/v1',
})
```

## 注意事项

1. **API Key 安全**
   - 不要将 `default_settings.js` 提交到公开仓库
   - 建议添加到 `.gitignore`
   - 定期更换 API Key

2. **微信账号安全**
   - 新注册的微信号可能无法登录
   - 建议使用已实名认证的微信账号
   - 避免频繁发送消息，可能被微信限制

3. **API 成本**
   - Kimi API 按 token 计费
   - `aiMaxHistoryLength` 越大，消耗越多
   - 建议监控 API 使用量

4. **Puppet 选择**
   - `wechaty-puppet-wechat4u`: 免费，基于网页协议
   - `wechaty-puppet-padlocal`: 付费，更稳定
   - `wechaty-puppet-service`: 付费，功能最全

5. **登录状态保存**
   - 登录信息会保存在 `.wechaty` 目录中
   - 重启机器人会自动恢复登录状态
   - 对话历史存在内存中，重启后会清空

6. **消息延迟**
   - 网页协议可能有消息延迟
   - AI API 调用需要时间（通常 1-3 秒）

## 常见问题

### Q: 扫码后提示登录失败？
A: 可能是微信账号不支持网页登录，尝试使用其他 Puppet 或更换账号。

### Q: 机器人无法接收消息？
A: 检查群名称配置是否正确，可以查看控制台日志中的实际群名。

### Q: AI 回复速度慢？
A: 这是正常的，AI API 需要处理时间。可以：
- 减少 `aiMaxHistoryLength` 降低 token 消耗
- 使用更快的模型如 `kimi-k2-turbo-preview`

### Q: 对话历史会丢失吗？
A: 对话历史存储在内存中，机器人重启后会清空。如需持久化，可以自行实现数据库存储。

### Q: 如何让 AI 忘记之前的对话？
A: 目前需要重启机器人。未来可以添加清除历史的命令。

### Q: 可以同时监听多个群吗？
A: 可以！在 `targetRooms` 中添加多个群名即可。每个群的对话历史是独立的。

### Q: 如何切换到其他 AI 模型？
A: 项目使用 OpenAI SDK，理论上支持所有兼容 OpenAI API 的服务。只需修改 `ai.js` 中的 `baseURL` 和 API Key。

## 扩展功能建议

- ✅ 已实现：AI 智能对话
- ✅ 已实现：群级别对话历史
- ✅ 已实现：识别发送者身份
- 📝 待实现：持久化对话历史到数据库
- 📝 待实现：图片识别和处理
- 📝 待实现：管理员命令控制（如清除历史）
- 📝 待实现：统计分析群聊数据
- 📝 待实现：自动欢迎新成员
- 📝 待实现：敏感词过滤

## 相关资源

- [Wechaty 官方文档](https://wechaty.js.org/)
- [Wechaty GitHub](https://github.com/wechaty/wechaty)
- [Moonshot AI 开放平台](https://platform.moonshot.cn/)
- [Kimi API 文档](https://platform.moonshot.cn/docs)

## 许可证

ISC
