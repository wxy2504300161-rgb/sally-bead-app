import express from '../mini.js'
import { db } from '../db.js'
import { auth } from '../middleware.js'
import { SPRITES, fromSprite, blank } from '../bead.js'

const router = express.Router()

router.get('/', auth, (req, res) => {
  res.json({ drafts: db.data.drafts[req.uid] || [] })
})

router.post('/', auth, (req, res) => {
  const { name = '未命名草稿', sprite, grid, size = 15, progress = 0 } = req.body || {}
  let g = grid
  if (!g && sprite && SPRITES[sprite]) g = fromSprite(sprite, size)
  if (!g || !Array.isArray(g) || !g.length) g = blank(size)
  const draft = { id: db.nextId(), name, sprite: sprite || null, grid: g, size, progress, updatedAt: Date.now() }
  ;(db.data.drafts[req.uid] ||= []).unshift(draft)
  db.save()
  res.json({ draft })
})

router.put('/:id', auth, (req, res) => {
  const list = db.data.drafts[req.uid] || []
  const d = list.find((x) => x.id === +req.params.id)
  if (!d) return res.status(404).json({ error: '草稿不存在' })
  const { name, grid, size, progress } = req.body || {}
  if (name !== undefined) d.name = name
  if (grid !== undefined) d.grid = grid
  if (size !== undefined) d.size = size
  if (progress !== undefined) d.progress = progress
  d.updatedAt = Date.now()
  db.save()
  res.json({ draft: d })
})

router.delete('/:id', auth, (req, res) => {
  const list = db.data.drafts[req.uid] || []
  db.data.drafts[req.uid] = list.filter((x) => x.id !== +req.params.id)
  db.save()
  res.json({ ok: true })
})

export { router as draftsRouter }
