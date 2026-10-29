// Problem 3 验证：图片转图纸接口（/api/convert）
// 真实启后端，登录后上传像素矩阵，校验降色结果与色号合法性。
// 零依赖，直接 node test/convert.test.mjs 运行（测试结束还原 db.json）
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..') // backend/
const SERVER = path.join(ROOT, 'src', 'server.js')
const NODE = process.env.NODE_BIN || process.execPath
const PORT = 8801
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

const dbPath = path.join(ROOT, 'data', 'db.json')
const bakPath = dbPath + '.bak'
if (fs.existsSync(dbPath)) fs.renameSync(dbPath, bakPath)

function cleanup() {
  if (fs.existsSync(bakPath)) fs.renameSync(bakPath, dbPath)
  else if (fs.existsSync(dbPath)) fs.rmSync(dbPath)
}

async function run() {
  console.log('== 启动后端并登录 ==')
  const srv = startServer()
  await waitHealth()
  const token = await login()

  // 2×2 像素矩阵：白、红、绿、透明
  const pixels = [
    [{ r: 255, g: 255, b: 255, a: 255 }, { r: 255, g: 0, b: 0, a: 255 }],
    [{ r: 0, g: 200, b: 0, a: 255 }, { r: 0, g: 0, b: 0, a: 0 }],
  ]
  const res = await call('POST', '/convert', token, { size: 2, pixels })

  console.log('== 校验降色结果 ==')
  assert(res.grid && Array.isArray(res.grid), '返回 grid 数组')
  assert(res.grid?.length === 2 && res.grid?.[0]?.length === 2, 'grid 维度为 2×2')
  assert(res.grid?.[0]?.[0] === 'A01', `白色 -> 雪白 A01（实际 ${res.grid?.[0]?.[0]}）`)
  assert(res.grid?.[0]?.[1] === 'B07', `红色 -> 玫红 B07（实际 ${res.grid?.[0]?.[1]}）`)
  assert(res.grid?.[1]?.[0] === 'E10', `绿色 -> 草绿 E10（实际 ${res.grid?.[1]?.[0]}）`)
  assert(res.grid?.[1]?.[1] === null, '透明像素 -> null（空单元格）')

  const allValid = res.grid?.flat().filter(Boolean).every((c) => /^[A-G]\d{2}$/.test(c))
  assert(allValid, 'grid 中非空色号均为合法色卡格式')

  // 缺少 pixels -> 400 错误
  const bad = await call('POST', '/convert', token, {})
  assert(bad.error, '缺少 pixels 时返回错误信息')

  srv.kill('SIGTERM')
  await sleep(300)

  console.log('\n== 结果 ==')
  const ok = failures === 0
  if (ok) console.log('✅ 图片转图纸接口测试全部通过')
  else console.error(`❌ 有 ${failures} 项失败`)
  cleanup()
  process.exit(ok ? 0 : 1)
}

run().catch((e) => { console.error('测试异常:', e); cleanup(); process.exit(1) })
