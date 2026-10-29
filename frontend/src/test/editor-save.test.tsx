// Problem 2 前端侧验证：编辑器在页面刷新/关闭（beforeunload）时，立即把最新画布落库，避免防抖窗口内丢失
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, act } from '@testing-library/react'

const { createDraft, updateDraft } = vi.hoisted(() => ({
  createDraft: vi.fn().mockResolvedValue({ draft: { id: 9 } }),
  updateDraft: vi.fn().mockResolvedValue({}),
}))

vi.mock('../api', () => ({
  api: { createDraft, updateDraft },
}))

import Editor from '../pages/Editor'

describe('编辑器 beforeunload 落库', () => {
  beforeEach(() => {
    createDraft.mockClear()
    updateDraft.mockClear()
  })

  it('页面卸载（刷新/关闭）时触发草稿保存', () => {
    render(<Editor go={() => {}} />)
    // 模拟用户刷新/关闭页面：浏览器派发 beforeunload
    act(() => {
      window.dispatchEvent(new Event('beforeunload'))
    })
    // 首次进入没有 draftId -> 应调用 createDraft（携带 keepalive）
    expect(createDraft).toHaveBeenCalledTimes(1)
    const [, opts] = createDraft.mock.calls[0]
    expect(opts?.keepalive).toBe(true)
  })

  it('已有草稿时 beforeunload 调用 updateDraft', () => {
    render(<Editor draftId={5} go={() => {}} />)
    act(() => {
      window.dispatchEvent(new Event('beforeunload'))
    })
    expect(updateDraft).toHaveBeenCalledTimes(1)
    const [, , opts] = updateDraft.mock.calls[0]
    expect(opts?.keepalive).toBe(true)
  })
})
