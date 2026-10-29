import express from '../mini.js'
import { auth } from '../middleware.js'
import { PALETTE, countColors } from '../bead.js'

// 把 #FFFFFF 转成 [r,g,b]
function hexToRgb(hex) {
  const h = String(hex).replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d) % 6; break
      case g: h = (b - r) / d + 2; break
      default: h = (r - g) / d + 4
    }
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s, l }
}

// 与前端 imageToGrid 同源算法：HSL 空间 + 色相加权，让饱和色落到同色系珠子
const PAL_HSL = PALETTE.map((p) => ({ code: p.code, ...rgbToHsl(...hexToRgb(p.hex)) }))

function nearest(px) {
  const t = rgbToHsl(px.r, px.g, px.b)
  let best = PAL_HSL[0]
  let bd = Infinity
  for (const c of PAL_HSL) {
    let dh = Math.abs(c.h - t.h)
    if (dh > 180) dh = 360 - dh
    const d = 10 * (dh / 180) ** 2 + (c.s - t.s) ** 2 + (c.l - t.l) ** 2
    if (d < bd) { bd = d; best = c }
  }
  return best.code
}

// 像素矩阵 -> 拼豆色号网格；透明(alpha<128) -> null
function quantize(pixels) {
  return pixels.map((row) =>
    row.map((px) => {
      if (!px) return null
      if (px.a !== undefined && px.a < 128) return null
      return nearest(px)
    }),
  )
}

/**
 * 图片转图纸（真实接口）
 * 入参: { size?: number, pixels: RGBA[][] }  —— pixels 由前端用 canvas 解码/降采样后上传
 * 出参: { grid, size, colors, stats }
 * 注意：图片解码/缩放由浏览器原生完成（前端 fileToPixels），本接口只做「按色卡最近色匹配」，
 *       保证零依赖、跨格式，且与前端离线兜底算法一致。
 */
const router = express.Router()
router.post('/', auth, (req, res) => {
  const { size = 29, pixels } = req.body || {}
  if (!Array.isArray(pixels) || !pixels.length || !Array.isArray(pixels[0])) {
    return res.status(400).json({ error: '缺少有效的像素矩阵 pixels（二维数组）' })
  }
  const n = [15, 29, 34].includes(Number(size)) ? Number(size) : pixels.length
  // 防御：若上传矩阵维度与 size 不一致，以矩阵实际维度为准
  const grid = quantize(pixels)
  const stats = countColors(grid)
  res.json({
    grid,
    size: grid.length,
    colors: stats.length,
    stats,
    note: '已将上传图片采样像素按色卡最近色匹配为拼豆图纸。',
  })
})

export { router as convertRouter }
