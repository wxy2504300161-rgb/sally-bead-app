// 拼豆图纸导出：把当前画布（Grid）生成一个「常规拼豆图纸」HTML 文件并下载到本地。
// 图纸包含：图案网格（每格带色号数字）+ 颜色清单（用量）+ 右上角小二维码与 logo 名称。
// 二维码生成用 qrcode 库，且按需动态加载（失败也不影响导出，仅省略二维码）。
import { bead, type Grid } from './data'

/** 我们的品牌名（显示在图纸右上角） */
export const APP_NAME = 'Sally拼豆'
/** 图纸二维码编码内容——可替换为你的官网 / 小程序码链接 */
const QR_URL = 'https://sallybead.app'

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
  )
}

// 亮度（0~1），用于决定格子内数字是黑字还是白字，保证任何底色都可读
function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function textColorFor(hex: string): string {
  return luminance(hex) > 0.5 ? '#1a1a1a' : '#ffffff'
}

/**
 * 纯函数：根据画布网格 + 二维码 dataURL 生成一份自包含的图纸 HTML 字符串。
 * - 图案：N×N 表格，每格背景是该位置珠子颜色，中央显示色号（格子数字）；空格留白。
 * - 颜色清单：列出用到的每个色号、名称、用量。
 * - 右上角：很小的二维码 + logo 名称。
 */
export function buildBlueprintHtml(
  grid: Grid,
  title: string,
  size: number,
  qrDataUrl: string,
  brand = 'MARD',
): string {
  // 统计每种珠子的用量
  const counts = new Map<string, number>()
  grid.flat().forEach((c) => c && counts.set(c, (counts.get(c) || 0) + 1))
  const total = [...counts.values()].reduce((a, b) => a + b, 0)

  // 图案网格
  const rows = grid
    .map((row) => {
      const tds = row
        .map((c) => {
          if (!c) return '<td class="e"></td>'
          const b = bead(c)
          const tcol = textColorFor(b.hex)
          return `<td style="background:${b.hex}"><span style="color:${tcol}">${esc(c)}</span></td>`
        })
        .join('')
      return `<tr>${tds}</tr>`
    })
    .join('')

  // 颜色清单
  const legend = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([c, n]) => {
      const b = bead(c)
      return `<div class="li"><i style="background:${b.hex}"></i><b>${esc(c)}</b><span>${esc(
        b.name,
      )}</span><em>×${n}</em></div>`
    })
    .join('')

  const qr = qrDataUrl ? `<img class="qr" src="${esc(qrDataUrl)}" alt="QR">` : ''

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · 拼豆图纸</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; color: #2a2a2a; background: #fafafa; padding: 24px; }
  .sheet { max-width: 760px; margin: 0 auto; background: #fff; padding: 28px 32px 36px; border-radius: 16px; box-shadow: 0 8px 30px rgba(0,0,0,.06); }
  .head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; border-bottom: 2px solid #ffe1ea; padding-bottom: 14px; }
  .meta h1 { font-size: 22px; margin: 0 0 6px; font-weight: 800; }
  .meta p { margin: 0; font-size: 13px; color: #888; }
  .brand { text-align: right; flex: none; }
  .brand .qr { width: 64px; height: 64px; display: block; margin-left: auto; border: 1px solid #eee; border-radius: 6px; }
  .brand .logo { margin-top: 6px; font-size: 12px; font-weight: 800; color: #ff5a8a; letter-spacing: .5px; }
  .grid-wrap { overflow-x: auto; margin: 22px 0 8px; }
  table.grid { border-collapse: collapse; margin: 0 auto; }
  table.grid td { width: 21px; height: 21px; border: 1px solid #e6e6e6; text-align: center; vertical-align: middle; }
  table.grid td span { font-size: 9px; font-weight: 700; line-height: 1; }
  table.grid td.e { background: repeating-conic-gradient(#f4f4f4 0% 25%, #fff 0% 50%) 50% / 10px 10px; }
  h2 { font-size: 15px; margin: 26px 0 12px; }
  .legend { display: flex; flex-wrap: wrap; gap: 8px 14px; }
  .li { display: flex; align-items: center; gap: 6px; font-size: 12px; background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 5px 9px; }
  .li i { width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(0,0,0,.08); display: inline-block; }
  .li b { font-weight: 800; }
  .li span { color: #666; }
  .li em { font-style: normal; color: #ff5a8a; font-weight: 700; margin-left: 2px; }
  .foot { margin-top: 26px; font-size: 11px; color: #aaa; text-align: center; }
  @media print { body { background: #fff; padding: 0; } .sheet { box-shadow: none; border-radius: 0; } }
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="meta">
        <h1>${esc(title)}</h1>
        <p>${size}×${size} · 品牌 ${esc(brand)} · 共 ${total} 颗珠子</p>
      </div>
      <div class="brand">
        ${qr}
        <div class="logo">${esc(APP_NAME)}</div>
      </div>
    </div>
    <div class="grid-wrap">
      <table class="grid">${rows}</table>
    </div>
    <h2>颜色清单（每格数字为该位置所用珠子的色号）</h2>
    <div class="legend">${legend}</div>
    <p class="foot">由 ${esc(APP_NAME)} 生成 · 按图纸逐格拼贴即可</p>
  </div>
</body>
</html>`
}

/** 生成二维码 PNG dataURL；任何异常（如运行环境无 canvas）都回退为空串，不影响导出。 */
export async function makeQr(text: string = QR_URL): Promise<string> {
  try {
    const mod = (await import('qrcode')) as any
    const QR = mod.default ?? mod
    return await QR.toDataURL(text, { margin: 1, width: 120 })
  } catch {
    return ''
  }
}

/** 触发浏览器把字符串下载为本地文件（HTML 图纸）。 */
export function downloadHtml(filename: string, html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 一键导出：生成二维码 → 组装图纸 HTML → 下载。供编辑器「下载图纸」按钮调用。 */
export async function exportBlueprint(
  grid: Grid,
  title: string,
  size: number,
  brand = 'MARD',
): Promise<void> {
  const qr = await makeQr()
  const html = buildBlueprintHtml(grid, title, size, qr, brand)
  const safe = (title || '拼豆图纸').replace(/[\\/:*?"<>|]/g, '_').slice(0, 60)
  downloadHtml(`${safe}.html`, html)
}
