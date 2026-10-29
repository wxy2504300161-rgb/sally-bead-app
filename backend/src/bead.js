// 拼豆基础数据工具：色卡、图案、网格解析（与前端 shared/bead-data.json 同源）
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const data = require(path.resolve(__dirname, '../../shared/bead-data.json'))

export const PALETTE = data.palette
export const SPRITES = data.sprites
export const KEY = data.key

const CODE_SET = new Set(PALETTE.map((p) => p.code))

/** 把 sprite 字符行解析成网格：字符 -> 色号，'.' -> null */
export function parse(rows) {
  return rows.map((r) => [...r].map((ch) => (ch === '.' ? null : KEY[ch] || null)))
}

/** 统计每种颜色的用量：返回 [[code, count], ...] 降序 */
export function countColors(grid) {
  const m = new Map()
  for (const row of grid) for (const c of row) if (c) m.set(c, (m.get(c) || 0) + 1)
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

export function bead(code) {
  return PALETTE.find((p) => p.code === code)
}

/** 校验色号是否合法 */
export function isValidCode(code) {
  return CODE_SET.has(code)
}

/**
 * 把任意尺寸网格中心对齐放置到一个 n×n 画布（用于从模板 sprite 生成草稿/作品网格）
 */
export function fromSprite(sprite, n) {
  const src = parse(SPRITES[sprite])
  const size = src.length
  const off = Math.floor((n - size) / 2)
  const g = Array.from({ length: n }, () => Array(n).fill(null))
  src.forEach((r, y) => r.forEach((c, x) => { if (g[y + off]) g[y + off][x + off] = c }))
  return g
}

/** 空网格 */
export function blank(n) {
  return Array.from({ length: n }, () => Array(n).fill(null))
}

export { CODE_SET }
