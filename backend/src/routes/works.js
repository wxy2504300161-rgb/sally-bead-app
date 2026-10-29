import express from '../mini.js'
import { db } from '../db.js'
import { auth, decorateWork } from '../middleware.js'
import { SPRITES, parse, fromSprite, blank } from '../bead.js'

const router = express.Router()

const CATEGORIES = ['推荐', '杯垫', '挂件', '动物', 'IP', '国风', '节日', '文字']

// 灵感广场列表：?cat=&sort=hot|new&q=
router.get('/', auth, (req, res) => {
  const { cat = '推荐', sort = 'hot', q = '' } = req.query
  let list = db.data.works.map((w) => decorateWork(w, req.uid))
  if (cat && cat !== '推荐') list = list.filter((w) => w.tag === cat)
  if (q) {
    const t = String(q).toLowerCase()
    list = list.filter(
      (w) => w.title.toLowerCase().includes(t) || w.author.toLowerCase().includes(t) || w.tag.toLowerCase().includes(t),
    )
  }
  if (sort === 'new') list.sort((a, b) => b.createdAt - a.createdAt)
  else list.sort((a, b) => b.likes - a.likes)
  res.json({ works: list, categories: CATEGORIES })
})

router.get('/:id', auth, (req, res) => {
  const w = db.data.works.find((x) => x.id === +req.params.id)
  if (!w) return res.status(404).json({ error: '作品不存在' })
  res.json({ work: decorateWork(w, req.uid) })
})

// 发布新作品
router.post('/', auth, (req, res) => {
  const { title, sprite, grid, size = '15×15', tag = '未分类' } = req.body || {}
  if (!title) return res.status(400).json({ error: '请填写作品标题' })
  let g = grid
  if (!g && sprite && SPRITES[sprite]) g = parse(SPRITES[sprite])
  if (!g || !Array.isArray(g) || !g.length) return res.status(400).json({ error: '缺少图纸数据' })
  const user = db.data.users[req.uid]
  const work = {
    id: db.nextId(), title, author: user.name, authorId: req.uid,
    sprite: sprite || null, grid: g, size, tag, likes: 0, likedBy: [], createdAt: Date.now(),
  }
  db.data.works.unshift(work)
  db.save()
  res.json({ work: decorateWork(work, req.uid) })
})

// 点赞 / 收藏 切换
router.post('/:id/favorite', auth, (req, res) => {
  const w = db.data.works.find((x) => x.id === +req.params.id)
  if (!w) return res.status(404).json({ error: '作品不存在' })
  w.likedBy = w.likedBy || []
  const i = w.likedBy.indexOf(req.uid)
  let liked
  if (i >= 0) { w.likedBy.splice(i, 1); liked = false } else { w.likedBy.push(req.uid); liked = true }
  db.save()
  res.json({ liked, likes: w.likedBy.length })
})

export { router as worksRouter }
