// 图片转拼豆图纸：浏览器端负责解码与降采样（浏览器原生能力），
// 把任意图片缩放到 size×size 并读取像素，再交给后端 /convert 按色卡做最近色匹配。
// 本文件同时提供纯函数（nearestColor / quantizeGrid），便于离线兜底与单元测试。
import { PALETTE, type Bead, type Grid } from './data'

export type RGBA = { r: number; g: number; b: number; a: number }
export type RGB = { r: number; g: number; b: number }

/** #FFFFFF -> {r,g,b} */
export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '').trim()
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

const PAL_HSL: { code: string; h: number; s: number; l: number }[] = PALETTE.map((p) => {
  const { r, g, b } = hexToRgb(p.hex)
  return { code: p.code, ...rgbToHsl(r, g, b) }
})

/** RGB(0-255) -> HSL（h:0-360, s/l:0-1） */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case r: h = ((g - b) / d) % 6; break
    case g: h = (b - r) / d + 2; break
    default: h = (r - g) / d + 4
  }
  h *= 60
  if (h < 0) h += 360
  return { h, s, l }
}

/**
 * 找到与给定 RGB 最近的色卡色号。
 * 使用 HSL 空间并给「色相(hue)」更高权重——这样饱和的红/绿/蓝照片会落到同色系珠子上，
 * 而不是被 RGB 欧氏距离误判成棕色等邻近色。低饱和度（灰白黑）由明度/饱和度决定。
 */
export function nearestColor(rgb: RGB, palette: { code: string; h: number; s: number; l: number }[] = PAL_HSL): string {
  const t = rgbToHsl(rgb.r, rgb.g, rgb.b)
  let best = palette[0]
  let bestD = Infinity
  for (const c of palette) {
    let dh = Math.abs(c.h - t.h)
    if (dh > 180) dh = 360 - dh
    const d = 10 * (dh / 180) ** 2 + (c.s - t.s) ** 2 + (c.l - t.l) ** 2
    if (d < bestD) { bestD = d; best = c }
  }
  return best.code
}

const isEmpty = (px: RGBA) => px.a < 128

/**
 * 纯函数：把采样得到的像素矩阵（含 alpha）量化为拼豆色号网格。
 * 透明像素 -> null（空单元格），其余 -> 最近色卡色号。
 */
export function quantizeGrid(pixels: RGBA[][], palette: { code: string; h: number; s: number; l: number }[] = PAL_HSL): Grid {
  return pixels.map((row) => row.map((px) => (isEmpty(px) ? null : nearestColor(px, palette))))
}

/** 浏览器专用：把图片文件解码并按 size×size cover 裁剪采样为像素矩阵 */
export async function fileToPixels(file: File, size: number): Promise<RGBA[][]> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('当前环境不支持 canvas，无法处理图片')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    // cover 填充：等比缩放后居中裁剪
    const sw = img.width || size
    const sh = img.height || size
    const scale = Math.max(size / sw, size / sh)
    const dw = sw * scale
    const dh = sh * scale
    const dx = (size - dw) / 2
    const dy = (size - dh) / 2
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(img, dx, dy, dw, dh)
    const data = ctx.getImageData(0, 0, size, size).data
    const out: RGBA[][] = []
    for (let y = 0; y < size; y++) {
      const row: RGBA[] = []
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4
        row.push({ r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] })
      }
      out.push(row)
    }
    return out
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解码失败，请换一张试试'))
    img.src = src
  })
}

/**
 * 本地兜底：直接在前端完成「采样 + 降色」，无需后端。
 * 当后端 /convert 不可用时调用，保证离线也能出图。
 */
export async function fileToGrid(file: File, size: number): Promise<Grid> {
  const px = await fileToPixels(file, size)
  return quantizeGrid(px)
}
