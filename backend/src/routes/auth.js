import express from '../mini.js'
import crypto from 'node:crypto'
import { db } from '../db.js'
import { auth } from '../middleware.js'

const router = express.Router()

// 演示登录：输入手机号 + 验证码（任意 6 位），未注册自动创建账号并初始化个人数据
router.post('/login', (req, res) => {
  const { phone, code } = req.body || {}
  if (!phone) return res.status(400).json({ error: '请输入手机号' })
  if (!/^\d{6}$/.test(String(code || ''))) return res.status(400).json({ error: '验证码为 6 位数字（演示填 123456）' })

  let user = Object.values(db.data.users).find((u) => u.phone === phone)
  if (!user) {
    const id = 'u' + db.nextId()
    user = {
      id, phone, name: '新豆友', bio: '用一颗颗豆子拼出小确幸', avatar: 'bunny',
      city: '上海', brand: 'Artkal', level: 1, levelName: '拼豆新手', days: 1, createdAt: Date.now(),
    }
    db.data.users[id] = user
    db.data.inventory[id] = { ...(db.data.inventory.u1 || {}) }
    db.data.drafts[id] = []
    db.data.history[id] = []
    db.data.progress[id] = {}
    db.data.exports[id] = []
    db.data.settings[id] = { ...db.data.settings.u1 }
    db.data.membership[id] = { active: false, plan: null, since: null, expiresAt: null }
    db.save()
  }

  const token = crypto.randomBytes(18).toString('base64url')
  db.data.tokens[token] = user.id
  db.save()
  res.json({ token, user })
})

router.get('/me', auth, (req, res) => {
  res.json({ user: db.data.users[req.uid] })
})

router.put('/me', auth, (req, res) => {
  const u = db.data.users[req.uid]
  const { name, bio, avatar, city, brand } = req.body || {}
  if (name !== undefined) u.name = name
  if (bio !== undefined) u.bio = bio
  if (avatar !== undefined) u.avatar = avatar
  if (city !== undefined) u.city = city
  if (brand !== undefined) u.brand = brand
  db.save()
  res.json({ user: u })
})

export { router as authRouter }
