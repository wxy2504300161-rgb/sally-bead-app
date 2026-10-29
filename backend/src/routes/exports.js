import express from '../mini.js'
import { db } from '../db.js'
import { auth } from '../middleware.js'

const router = express.Router()

router.get('/', auth, (req, res) => {
  res.json({ exports: db.data.exports[req.uid] || [] })
})

router.post('/', auth, (req, res) => {
  const { sprite, name, type, sizeLabel = '' } = req.body || {}
  const rec = { id: db.nextId(), sprite, name, type, sizeLabel, createdAt: Date.now() }
  ;(db.data.exports[req.uid] ||= []).unshift(rec)
  db.save()
  res.json({ record: rec })
})

export { router as exportsRouter }
