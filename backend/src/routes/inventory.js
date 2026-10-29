import express from '../mini.js'
import { db } from '../db.js'
import { auth } from '../middleware.js'
import { isValidCode } from '../bead.js'

const router = express.Router()

router.get('/', auth, (req, res) => {
  res.json({ stock: db.data.inventory[req.uid] || {} })
})

// 直接设置某色号库存
router.post('/set', auth, (req, res) => {
  const { code, qty } = req.body || {}
  if (!isValidCode(code)) return res.status(400).json({ error: '色号不合法' })
  const stock = (db.data.inventory[req.uid] ||= {})
  stock[code] = Math.max(0, Number(qty) || 0)
  db.save()
  res.json({ stock })
})

// 增减（±数量）
router.post('/adjust', auth, (req, res) => {
  const { code, delta } = req.body || {}
  if (!isValidCode(code)) return res.status(400).json({ error: '色号不合法' })
  const stock = (db.data.inventory[req.uid] ||= {})
  stock[code] = Math.max(0, (stock[code] || 0) + Number(delta || 0))
  db.save()
  res.json({ stock })
})

// 按图纸用量扣减（拼完扣减）。needs: { code: 数量 }
router.post('/deduct', auth, (req, res) => {
  const needs = req.body?.needs || {}
  const stock = (db.data.inventory[req.uid] ||= {})
  const shortage = []
  for (const [code, n] of Object.entries(needs)) {
    const have = stock[code] || 0
    if (have < n) shortage.push({ code, need: n, have })
  }
  if (shortage.length) return res.status(409).json({ ok: false, shortage, stock })
  for (const [code, n] of Object.entries(needs)) stock[code] -= n
  db.save()
  res.json({ ok: true, stock })
})

// 采购清单（缺货列表）
router.post('/shortage', auth, (req, res) => {
  const needs = req.body?.needs || {}
  const stock = db.data.inventory[req.uid] || {}
  const shortage = Object.entries(needs)
    .filter(([c, n]) => (stock[c] || 0) < n)
    .map(([code, need]) => ({ code, need, have: stock[code] || 0 }))
  res.json({ shortage })
})

export { router as inventoryRouter }
