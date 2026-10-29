// Problem 2 验证：数据持久化 —— 写数据 -> 杀掉后端 -> 重启后端 -> 读回，确认未丢失
// 零依赖（仅用 Node 内置 net/http/fetch），直接 node test/persist.test.mjs 运行
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..') // backend/
const SERVER = path.join(ROOT, 'src', 'server.js')
const NODE = process.env.NODE_BIN || process.execPath
const PORT = 8799
const BASE = `http://localhost:${PORT}`

function startServer() {
  const p = spawn(NODE, [SERVER], {
    env: { ...process.env, PORT: String(PORT), NODE_OPTIONS: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  p.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`))
  return p
}

async function waitHealth(timeoutMs = 8000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(BASE + '/api/health')
      if (r.ok) return true
    } catch {}
    await sleep(200)
  }
  throw new Error('后端未在超时内就绪')
}

async function login() {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '13800006688', code: '123456' }),
  })
  const j = await r.json()
  if (!j.token) throw new Error('登录失败: ' + JSON.stringify(j))
  return j.token
}

async function call(method, apiPath, token, body) {
  const r = await fetch(BASE + '/api' + apiPath, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

let failures = 0
function assert(cond, msg) {
  if (cond) console.log('  ✓', msg)
  else { failures++; console.error('  ✗', msg) }
}

// 备份真实开发库，测试结束再还原，避免污染 db.json
const dbPath = path.join(ROOT, 'data', 'db.json')
const bakPath = dbPath + '.bak'
if (fs.existsSync(dbPath)) fs.renameSync(dbPath, bakPath)

async function run() {
  console.log('== 阶段 1：启动后端并写入数据 ==')
  let srv = startServer()
  await waitHealth()

  const token = await login()

  // 作品
  const w = await call('POST', '/works', token, { title: '持久化测试作品', grid: [['B03']], tag: '动物' })
  const wid = w.work.id
  // 收藏
  const fav = await call('POST', `/works/${wid}/favorite`, token)
  // 草稿
  const d = await call('POST', '/drafts', token, { name: '持久化草稿', grid: [['A01']], size: 15, progress: 10 })
  const did = d.draft.id
  // 记录
  await call('POST', '/history', token, { sprite: 'bunny', title: '兔兔', used: { B03: 30 }, note: 'x' })
  // 库存调整
  await call('POST', '/inventory/set', token, { code: 'B03', qty: 88 })
  // 会员开通
  const mem = await call('POST', '/membership/subscribe', token, { plan: 'year' })

  assert(w.work && wid > 0, `创建作品 id=${wid}`)
  assert(fav.liked === true, '收藏成功')
  assert(d.draft && did > 0, `创建草稿 id=${did}`)
  assert(mem.membership?.active === true, '会员已开通')

  // 阶段 2：杀掉后端（模拟关闭/重启）
  console.log('== 阶段 2：杀掉后端（SIGTERM -> 触发落盘）==')
  srv.kill('SIGTERM')
  await sleep(600)
  const code = srv.exitCode
  console.log('  后端退出码:', code)

  // 阶段 3：重启后端并读回
  console.log('== 阶段 3：重启后端，读回数据 ==')
  srv = startServer()
  await waitHealth()
  const token2 = await login()

  const works = await call('GET', `/works`, token2)
  const favList = await call('GET', '/favorites', token2)
  const drafts = await call('GET', '/drafts', token2)
  const history = await call('GET', '/history', token2)
  const inv = await call('GET', '/inventory', token2)
  const membership = await call('GET', '/membership', token2)

  assert(works.works.some((x) => x.id === wid), '重启后作品仍存在')
  assert(favList.works.some((x) => x.id === wid), '重启后收藏仍存在')
  assert(drafts.drafts.some((x) => x.id === did), '重启后草稿仍存在')
  assert(history.history.length > 0, '重启后拼豆记录仍存在')
  assert(inv.stock?.B03 === 88, `重启后库存 B03=${inv.stock?.B03}（应为 88）`)
  assert(membership.membership?.active === true, '重启后会员状态仍有效')

  // 阶段 4：确认落盘文件存在且包含数据
  const dbPath = path.join(ROOT, 'data', 'db.json')
  assert(fs.existsSync(dbPath), `数据文件已落盘: ${dbPath}`)

  srv.kill('SIGTERM')
  await sleep(300)

  console.log('\n== 结果 ==')
  const ok = failures === 0
  if (ok) console.log('✅ 持久化测试全部通过')
  else console.error(`❌ 有 ${failures} 项失败`)
  cleanup()
  process.exit(ok ? 0 : 1)
}

function cleanup() {
  // 还原开发库：备份在则还原，否则删除测试产生的 db.json
  if (fs.existsSync(bakPath)) fs.renameSync(bakPath, dbPath)
  else if (fs.existsSync(dbPath)) fs.rmSync(dbPath)
}

run().catch((e) => { console.error('测试异常:', e); cleanup(); process.exit(1) })
