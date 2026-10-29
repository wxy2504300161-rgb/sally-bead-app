import express from '../mini.js'
import { db } from '../db.js'
import { auth } from '../middleware.js'

const router = express.Router()

const PLANS = [
  { k: 'month', l: '连续包月', p: 12, o: 18, d: '次月 ¥12 自动续费' },
  { k: 'year', l: '年卡', p: 98, o: 216, d: '低至 ¥8.2/月', hot: true },
  { k: 'life', l: '永久会员', p: 198, o: 398, d: '一次买断' },
]

function calcExpiry(plan) {
  const now = Date.now()
  if (plan === 'month') return now + 30 * 86400000
  if (plan === 'year') return now + 365 * 86400000
  return null // 永久
}

router.get('/plans', (req, res) => res.json({ plans: PLANS }))

router.get('/', auth, (req, res) => {
  res.json({ membership: db.data.membership[req.uid] || { active: false, plan: null } })
})

// 演示支付：直接开通（真实环境应接入微信/支付宝回调）
router.post('/subscribe', auth, (req, res) => {
  const { plan } = req.body || {}
  if (!PLANS.find((p) => p.k === plan)) return res.status(400).json({ error: '套餐不存在' })
  const m = { active: true, plan, since: Date.now(), expiresAt: calcExpiry(plan) }
  db.data.membership[req.uid] = m
  db.save()
  res.json({ membership: m })
})

router.post('/cancel', auth, (req, res) => {
  const m = db.data.membership[req.uid]
  if (m) m.active = false
  db.save()
  res.json({ membership: m || { active: false, plan: null } })
})

export { router as membershipRouter, PLANS }
