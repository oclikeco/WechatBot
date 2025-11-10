import { WechatyBuilder } from 'wechaty'
import qrcode from 'qrcode-terminal'
import config from './config.js'

// 创建 Wechaty 实例
const bot = WechatyBuilder.build({
  name: 'wechat-bot',
  puppet: 'wechaty-puppet-wechat4u',
})

// 登录二维码事件
bot.on('scan', (qrcodeUrl, status) => {
  console.log(`📱 扫描二维码登录: ${status}`)
  console.log(`https://wechaty.js.org/qrcode/${encodeURIComponent(qrcodeUrl)}`)
  qrcode.generate(qrcodeUrl, { small: true })
})

// 登录成功事件
bot.on('login', (user) => {
  console.log(`✅ 登录成功: ${user.name()}`)
  console.log(`🤖 机器人已启动，开始监听群消息...`)
})

// 登出事件
bot.on('logout', (user) => {
  console.log(`👋 ${user.name()} 已登出`)
})

// 消息事件处理
bot.on('message', async (message) => {
  try {
    // 获取消息的房间（群聊）
    const room = message.room()

    // 只处理群消息
    if (!room) {
      return
    }

    // 获取群名称
    const roomTopic = await room.topic()
    const sender = message.talker()
    const text = message.text()

    // 调试：打印所有群消息的群名（方便知道要配置哪些群）
    console.log(`📱 收到群消息 [${roomTopic}]`)

    // 检查是否为目标群聊
    const isTargetRoom = config.targetRooms.some(targetRoom => {
      if (typeof targetRoom === 'string') {
        return roomTopic === targetRoom
      } else if (targetRoom instanceof RegExp) {
        return targetRoom.test(roomTopic)
      }
      return false
    })

    if (!isTargetRoom) {
      console.log(`⏭️  群 [${roomTopic}] 不在监听列表中，跳过`)
      return
    }

    // 检查是否回复自己的消息
    if (!config.replyToSelf && message.self()) {
      return
    }

    // 检查是否只在@机器人时回复
    const mentionSelf = await message.mentionSelf()
    if (config.replyOnlyWhenMentioned && !mentionSelf) {
      return
    }

    console.log(`📩 [${roomTopic}] ${sender.name()}: ${text}`)

    // 匹配回复规则
    let replyText = null
    for (const rule of config.autoReplyRules) {
      if (rule.keyword.test(text)) {
        replyText = rule.reply
        break
      }
    }

    // 如果没有匹配到规则，使用默认回复
    if (!replyText && config.defaultReply) {
      replyText = config.defaultReply
    }

    // 发送回复
    if (replyText) {
      // 如果是@机器人，则@回发送者
      if (mentionSelf) {
        await room.say(replyText, sender)
      } else {
        await room.say(replyText)
      }
      console.log(`🤖 回复: ${replyText}`)
    }
  } catch (error) {
    console.error('❌ 处理消息时出错:', error)
  }
})

// 错误处理
bot.on('error', (error) => {
  console.error('❌ 机器人出错:', error)
})

// 启动机器人
console.log('🚀 启动微信机器人...')
bot.start()
  .then(() => console.log('✨ 机器人启动成功'))
  .catch(error => {
    console.error('❌ 启动失败:', error)
    process.exit(1)
  })

// 优雅退出
process.on('SIGINT', async () => {
  console.log('\n👋 正在关闭机器人...')
  await bot.stop()
  process.exit(0)
})
