import express from '../mini.js'
import { db } from '../db.js'
import { auth } from '../middleware.js'

const router = express.Router()

router.get('/', auth, (req, res) => {
  res.json({ settings: db.data.settings[req.uid] || {} })
})

router.put('/', auth, (req, res) => {
  const s = (db.data.settings[req.uid] ||= {})
  Object.assign(s, req.body || {})
  db.save()
  res.json({ settings: s })
})

export { router as settingsRouter }
