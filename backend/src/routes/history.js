import express from '../mini.js'
import { db } from '../db.js'
import { auth } from '../middleware.js'

const router = express.Router()

router.get('/', auth, (req, res) => {
  res.json({ history: db.data.history[req.uid] || [] })
})

// 记录一次拼豆完成
router.post('/', auth, (req, res) => {
  const { sprite, title, minutes = 0, total = 0 } = req.body || {}
  const rec = {
    id: db.nextId(), sprite, title,
    minutes: Number(minutes) || 0, total: Number(total) || 0, createdAt: Date.now(),
  }
  ;(db.data.history[req.uid] ||= []).unshift(rec)
  db.save()
  res.json({ record: rec })
})

export { router as historyRouter }
