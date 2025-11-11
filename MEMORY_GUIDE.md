# Memory 模块使用指南

## 什么是 Memory 模块？

Memory 模块允许 AI 自动识别并保存关键记忆点（自然语言描述），这些记忆会在每次 AI 回复时自动加载到上下文中，让 AI 记住重要信息。

## 与对话历史的区别

- **对话历史**：记录所有对话，按时间顺序，会被 `maxHistoryLength` 限制
- **Memory 记忆**：只存储关键信息，永久保留（除非手动删除），不受对话长度限制

## 工作原理

当 `useMemory: true` 时：

1. **自动记忆**：AI 会自动判断对话中是否有需要长期记住的信息（如用户偏好、重要日期、群规则等）
2. **主动保存**：AI 决定保存记忆时，会自动调用 `add_memory` 工具将信息存储到数据库
3. **自动加载**：每次对话开始时，所有记忆会被加载到 AI 的上下文中

## AI 自动记忆的场景

AI 会在以下情况自动创建记忆：

- 用户明确表达偏好（"我喜欢..."、"我不喜欢..."）
- 重要日期和截止时间（"下周五是deadline"）
- 群规则和约定（"每周三开会"、"禁止发广告"）
- 项目信息（"项目代号：凤凰计划"）
- 个人信息（"张三负责前端开发"）
- 其他需要长期记住的关键信息

## 使用场景示例

### 场景 1：AI 自动记住用户偏好
```
用户: 我喜欢在晚上工作，白天效率比较低
AI: 好的，我记住了！[AI 自动调用 add_memory 保存这个偏好]
```

### 场景 2：AI 自动记住群规则
```
用户: 提醒一下，我们群规定每周五下午3点是固定会议时间
AI: 明白了，我会记住这个时间！[AI 自动保存这个规则]
```

### 场景 3：AI 自动记住项目信息
```
用户: 我们的项目代号是凤凰计划，技术栈是 React + Node.js
AI: 好的，已记下项目信息。[AI 自动保存项目相关信息]
```

## API 使用方法（手动添加记忆）

### 添加记忆
```javascript
import { addMemory } from './memory.js'

await addMemory(
  conversationId,       // 群聊ID
  '记忆内容（自然语言）'  // 要记住的内容
)
```

### 获取记忆
```javascript
import { getMemories } from './memory.js'

// 获取所有记忆（默认不限制数量）
const memories = await getMemories(conversationId)

// 获取最多10条记忆
const memories = await getMemories(conversationId, 10)

console.log(memories)
// ['用户张三喜欢在晚上工作', '每周五下午3点是固定会议时间', ...]
```

### 搜索记忆
```javascript
import { searchMemories } from './memory.js'

const results = await searchMemories(conversationId, '会议')
// 返回包含"会议"关键词的所有记忆
```

### 删除记忆
```javascript
import { deleteMemory, clearMemories } from './memory.js'

// 删除特定记忆
await deleteMemory(conversationId, '要删除的记忆内容')

// 清除所有记忆
await clearMemories(conversationId)
```

## 在机器人中集成

记忆模块已经自动集成到 bot.js 中：

1. **配置开关**：在 `config.js` 中设置 `useMemory: true`
2. **自动加载**：每次对话开始时自动加载所有记忆
3. **自动保存**：AI 会自动判断并保存重要信息
4. **格式化**：记忆会格式化后添加到系统提示词

## 手动添加记忆的方式

### 方式 1：让 AI 自动判断（推荐）
正常对话，当你提到重要信息时，AI 会自动保存：
```
你: 我们团队的 Slack 频道是 #project-phoenix
AI: 好的，我记住了！
```

### 方式 2：通过代码检测关键词
在 bot.js 中检测特定模式的消息并自动保存：

```javascript
import { addMemory } from './memory.js'

// 检测"记住"命令
if (text.startsWith('记住：')) {
  const memoryText = text.replace('记住：', '').trim()
  await addMemory(conversationId, memoryText)
  await room.say('✅ 已记住！', sender)
}
```

### 方式 3：通过数据库管理工具
直接在 Supabase Dashboard 中编辑 `memories` 表。

## 最佳实践

1. **记忆内容格式**
   - 使用清晰的自然语言
   - 包含关键人物/时间/事件
   - 保持简洁明了

2. **定期清理**
   - 删除过期的记忆
   - 更新变化的信息

3. **信任 AI 判断**
   - AI 会自动识别重要信息
   - 不需要手动标记每条信息

## 数据库表结构

```sql
memories
├── id              # 主键
├── conversation_id # 群聊ID
├── memory_text     # 记忆内容
└── created_at      # 创建时间
```

## 配置

在 `config.js` 中：
```javascript
useMemory: true  // 启用记忆模块（AI 自动判断并保存记忆）
```

在 `ai.js` 中：
- 默认加载所有记忆（无数量限制）
- AI 通过 Function Calling 自动决定何时添加记忆
- 使用 `memoryTools` 定义记忆工具的能力和使用场景
