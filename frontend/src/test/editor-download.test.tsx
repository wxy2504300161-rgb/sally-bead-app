import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Editor from '../pages/Editor'

// 用 mock 替换导出模块，断言「下载图纸」按钮确实调用了导出逻辑并传入当前画布
const { exportBlueprint } = vi.hoisted(() => ({ exportBlueprint: vi.fn() }))
vi.mock('../beadBlueprint', () => ({ exportBlueprint, APP_NAME: 'Sally拼豆' }))

const grid = [
  ['B03', null],
  [null, 'A01'],
] as any

describe('Editor 下载图纸', () => {
  it('名称下方不再显示坐标', () => {
    render(<Editor grid={grid} title="测试图纸" go={() => {}} />)
    expect(screen.queryByText(/坐标/)).toBeNull()
  })

  it('点击右上角「下载图纸」按钮，调用 exportBlueprint 并传入当前 grid', () => {
    render(<Editor grid={grid} title="测试图纸" go={() => {}} />)
    const btn = screen.getByLabelText('下载图纸')
    fireEvent.click(btn)
    expect(exportBlueprint).toHaveBeenCalledTimes(1)
    // hist[hi] 即传入的初始 grid；size=2，默认品牌 MARD
    expect(exportBlueprint).toHaveBeenCalledWith(grid, '测试图纸', 2, 'MARD')
  })
})
