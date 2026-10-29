import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from './mini.js'
import { db } from './db.js'

import { authRouter } from './routes/auth.js'
import { worksRouter } from './routes/works.js'
import { favoritesRouter } from './routes/favorites.js'
import { draftsRouter } from './routes/drafts.js'
import { inventoryRouter } from './routes/inventory.js'
import { historyRouter } from './routes/history.js'
import { progressRouter } from './routes/progress.js'
import { exportsRouter } from './routes/exports.js'
import { membershipRouter } from './routes/membership.js'
import { settingsRouter } from './routes/settings.js'
import { convertRouter } from './routes/convert.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 8787

const app = express()

// 中间件：跨域 + 解析 JSON
// CORS 来源可用环境变量 CORS_ORIGIN 指定（多域名用逗号分隔），默认放行所有来源，
// 方便本地开发 / Cloudflare Pages 前端直接调用；上线后可改为前端真实域名提升安全性。
const ALLOW_ORIGIN = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const allowOrigin = (origin) => {
  if (ALLOW_ORIGIN.includes('*') || !origin) return '*'
  return ALLOW_ORIGIN.includes(origin) ? origin : ''
}
app.use(express.json())
app.use((req, res, next) => {
  const origin = req.headers.origin
  const ao = allowOrigin(origin)
  if (ao) res.setHeader('Access-Control-Allow-Origin', ao)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return }
  next()
})

app.get('/api/health', (req, res) => res.json({ ok: true, time: Date.now() }))

app.use('/api/auth', authRouter)
app.use('/api/works', worksRouter)
app.use('/api/favorites', favoritesRouter)
app.use('/api/drafts', draftsRouter)
app.use('/api/inventory', inventoryRouter)
app.use('/api/history', historyRouter)
app.use('/api/progress', progressRouter)
app.use('/api/exports', exportsRouter)
app.use('/api/membership', membershipRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/convert', convertRouter)

app.listen(PORT, () => {
  console.log(`✅ 小豆像素后端已启动: http://localhost:${PORT}`)
  console.log(`   数据文件: ${path.resolve(__dirname, '../data/db.json')}`)
})

// 优雅退出：先把内存数据落盘，避免关闭/重启时丢失
function shutdown(sig) {
  try { db.flush() } catch (e) { console.error('退出落盘失败:', e?.message) }
  console.log(`\n收到 ${sig}，已保存数据并退出`)
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
