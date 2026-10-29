import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '../pages/Home'

// 模拟图片采样与本地兜底，避免测试依赖真实 canvas / 文件解码
vi.mock('../imageToGrid', () => ({
  fileToPixels: vi.fn(async () => [
    [
      { r: 255, g: 255, b: 255, a: 255 },
      { r: 255, g: 0, b: 0, a: 255 },
    ],
    [
      { r: 0, g: 200, b: 0, a: 255 },
      { r: 0, g: 0, b: 0, a: 0 },
    ],
  ]),
  fileToGrid: vi.fn(async () => [
    ['A01', 'B07'],
    ['E10', null],
  ]),
}))

describe('首页 banner「图片转图纸」流程', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('点击按钮 -> 选择本地图片 -> 生成图纸 -> 携带 grid 进入编辑器', async () => {
    const go = vi.fn()
    render(<Home go={go} />)

    // 点击 banner 的“图片转图纸”按钮
    fireEvent.click(screen.getByText('图片转图纸'))

    // 模拟在文件选择框中选择一张图片
    const input = document.querySelector('input[type=file]') as HTMLInputElement
    expect(input).toBeTruthy()
    const file = new File(['dummy'], 'pic.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    // 弹窗出现，点击“生成拼豆图纸”
    const genBtn = await screen.findByText('生成拼豆图纸')
    fireEvent.click(genBtn)

    // 断言跳转进入编辑器，并携带了像素网格与标题
    await waitFor(() => {
      const editorRoute = go.mock.calls.map((c) => c[0]).find((r: any) => r.name === 'editor')
      expect(editorRoute).toBeTruthy()
      expect(Array.isArray(editorRoute.grid)).toBe(true)
      expect(editorRoute.grid.length).toBeGreaterThan(0)
      expect(editorRoute.title).toBe('图片转图纸')
    })
  })

  it('选择非图片文件会提示错误且不弹窗', () => {
    const go = vi.fn()
    render(<Home go={go} />)
    fireEvent.click(screen.getByText('图片转图纸'))
    const input = document.querySelector('input[type=file]') as HTMLInputElement
    const file = new File(['x'], 'note.txt', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [file] } })
    // 未进入弹窗（不存在“生成拼豆图纸”按钮），也未跳转
    expect(screen.queryByText('生成拼豆图纸')).toBeNull()
    expect(go).not.toHaveBeenCalled()
  })
})
