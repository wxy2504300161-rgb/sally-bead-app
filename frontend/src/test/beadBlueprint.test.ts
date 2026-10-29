import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildBlueprintHtml, downloadHtml, APP_NAME } from '../beadBlueprint'
import type { Grid } from '../data'

// B03 粉 / A01 白 / A12 近黑（用于验证深色格白字）
const grid: Grid = [
  ['B03', 'A01'],
  ['A12', null],
]

describe('buildBlueprintHtml', () => {
  it('包含图纸名称、品牌 logo 与图案色号', () => {
    const html = buildBlueprintHtml(grid, '我的猫咪图纸', 2, '', 'MARD')
    expect(html).toContain('我的猫咪图纸')
    expect(html).toContain(APP_NAME)
    expect(html).toContain('MARD')
    // 每格色号（格子数字）应出现在 HTML 中
    expect(html).toContain('B03')
    expect(html).toContain('A01')
    expect(html).toContain('A12')
  })

  it('包含颜色清单（用量统计）', () => {
    const html = buildBlueprintHtml(grid, 'x', 2, '')
    expect(html).toContain('颜色清单')
    // 颜色清单里应列出用到的色号与用量
    expect(html).toContain('×1')
  })

  it('传入二维码时渲染小二维码，未传则不渲染', () => {
    const withQr = buildBlueprintHtml(grid, 'x', 2, 'data:image/png;base64,ABC')
    expect(withQr).toContain('class="qr"')
    expect(withQr).toContain('data:image/png;base64,ABC')

    const noQr = buildBlueprintHtml(grid, 'x', 2, '')
    expect(noQr).not.toContain('class="qr"')
  })

  it('对用户输入做 HTML 转义，避免注入', () => {
    const html = buildBlueprintHtml(grid, '<script>x</script>', 2, '')
    expect(html).not.toContain('<script>x</script>')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('downloadHtml', () => {
  afterEach(() => vi.restoreAllMocks())

  it('以 .html 文件名触发一次本地下载', async () => {
    let captured: Blob | null = null
    vi.stubGlobal('URL', {
      createObjectURL: (b: Blob) => {
        captured = b
        return 'blob:mock'
      },
      revokeObjectURL: () => {},
    })
    const appendSpy = vi.spyOn(document.body, 'appendChild')

    downloadHtml('我的图纸.html', '<html>hi</html>')

    expect(captured).not.toBeNull()
    const blob = captured!
    expect(blob.type).toBe('text/html;charset=utf-8')
    const text = await new Promise<string>((resolve) => {
      const fr = new FileReader()
      fr.onload = () => resolve(fr.result as string)
      fr.readAsText(blob)
    })
    expect(text).toBe('<html>hi</html>')
    expect(appendSpy).toHaveBeenCalled()
    const a = appendSpy.mock.calls[0][0] as HTMLAnchorElement
    expect(a.tagName).toBe('A')
    expect(a.download).toBe('我的图纸.html')
    expect(a.href).toBe('blob:mock')
  })
})
