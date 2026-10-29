import express from '../mini.js'
import { db } from '../db.js'
import { auth, decorateWork } from '../middleware.js'

const router = express.Router()

// 我的收藏（= 点赞过的作品）
router.get('/', auth, (req, res) => {
  const uid = req.uid
  const list = db.data.works
    .filter((w) => (w.likedBy || []).includes(uid))
    .map((w) => decorateWork(w, uid))
  res.json({ works: list })
})

export { router as favoritesRouter }
