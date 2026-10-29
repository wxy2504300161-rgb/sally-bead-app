import { describe, it, expect } from 'vitest'
import { hexToRgb, nearestColor, quantizeGrid } from '../imageToGrid'

describe('imageToGrid 纯函数（图片降色核心逻辑）', () => {
  it('hexToRgb 解析正确', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
    expect(hexToRgb('#2E2A2B')).toEqual({ r: 46, g: 42, b: 43 })
  })

  it('nearestColor 匹配最近色卡色号', () => {
    expect(nearestColor({ r: 255, g: 255, b: 255 })).toBe('A01') // 雪白
    expect(nearestColor({ r: 46, g: 42, b: 43 })).toBe('A12') // 墨黑
    expect(nearestColor({ r: 255, g: 0, b: 0 })).toBe('B07') // 近玫红
    expect(nearestColor({ r: 0, g: 200, b: 0 })).toBe('E10') // 近草绿
    expect(nearestColor({ r: 0, g: 160, b: 230 })).toBe('D04') // 浅蓝 -> 天蓝（同色系更浅的珠子）
  })

  it('quantizeGrid：透明像素 -> null，其余 -> 最近色号', () => {
    const pixels = [
      [
        { r: 255, g: 255, b: 255, a: 255 },
        { r: 255, g: 0, b: 0, a: 255 },
      ],
      [
        { r: 0, g: 200, b: 0, a: 255 },
        { r: 0, g: 0, b: 0, a: 0 }, // 透明 => 空
      ],
    ]
    const grid = quantizeGrid(pixels)
    expect(grid).toEqual([
      ['A01', 'B07'],
      ['E10', null],
    ])
  })
})
