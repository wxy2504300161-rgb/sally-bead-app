import express from '../mini.js'
import { db } from '../db.js'
import { auth } from '../middleware.js'

const router = express.Router()

// 拼豆对照进度（按图案名存储已完成格子集合）
router.get('/:sprite', auth, (req, res) => {
  const p = db.data.progress[req.uid] || {}
  res.json({ done: p[req.params.sprite] || [] })
})

router.put('/:sprite', auth, (req, res) => {
  const { done = [] } = req.body || {}
  const p = (db.data.progress[req.uid] ||= {})
  p[req.params.sprite] = done
  db.save()
  res.json({ done })
})

export { router as progressRouter }
