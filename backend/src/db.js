// 轻量 JSON 文件存储：内存缓存 + 原子落盘（写入临时文件后 rename）
// 适合原型/单机部署；如需并发与更强一致性可平滑替换为 SQLite。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSeed } from './seed.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 数据目录：默认 backend/data（本地/单机）；在云平台上可设 DATA_DIR 指向持久磁盘挂载点
// （如 Railway Volume 挂载到 /data 时设 DATA_DIR=/data），使 db.json 跨重启保留。
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '../data')
const DB_PATH = path.join(DATA_DIR, 'db.json')

let cache = null

function load() {
  if (cache) return cache
  try {
    if (fs.existsSync(DB_PATH)) {
      cache = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
    } else {
      cache = buildSeed()
      persist()
    }
  } catch (err) {
    console.error('[db] 读取失败，使用种子数据重建:', err.message)
    cache = buildSeed()
    persist()
  }
  return cache
}

function persist() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const tmp = DB_PATH + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2))
  fs.renameSync(tmp, DB_PATH)
}

export const db = {
  get data() {
    return load()
  },
  /** 落盘（在修改 data 后调用） */
  save() {
    persist()
  },
  /** 仅在已加载过数据时才落盘，避免把 null 写进文件 */
  flush() {
    if (cache) persist()
  },
  /** 自增 id，前缀用于区分集合 */
  nextId() {
    const d = load()
    d._seq = (d._seq || 1000) + 1
    return d._seq
  },
  /** 重置为种子数据（--reset 用） */
  reset() {
    cache = buildSeed()
    persist()
    return cache
  },
}
