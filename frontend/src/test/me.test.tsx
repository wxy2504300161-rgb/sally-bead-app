import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import Me from '../pages/Me'
import MeSub from '../pages/MeSub'

const go = (() => {}) as any

it('App 启动后点击「我的」tab 能打开我的页面', async () => {
  render(<App />)
  const meTab = await screen.findByText('我的', {}, { timeout: 3000 })
  fireEvent.click(meTab)
  await waitFor(() => expect(screen.getByText('豆豆酱')).toBeInTheDocument(), { timeout: 3000 })
})

it('Me 根页面直接渲染不崩溃', async () => {
  render(<Me go={go} />)
  await waitFor(() => expect(screen.getByText('豆豆酱')).toBeInTheDocument(), { timeout: 3000 })
})

const SUBPATHS = [
  'profile', 'drafts', 'works', 'favorites', 'exports', 'history',
  'vip', 'settings', 'settings/account', 'settings/privacy', 'settings/canvas',
  'settings/brand', 'settings/notify', 'settings/about', 'exports/1',
]
for (const path of SUBPATHS) {
  it(`MeSub 子页面「${path}」渲染不崩溃`, async () => {
    render(<MeSub path={path} go={go} />)
    await new Promise((r) => setTimeout(r, 60))
    expect(document.body).toBeTruthy()
  })
}

// 回归：会员页在套餐数据缺省（后端未返回当前选中套餐）时也不能崩溃
it('会员页在套餐数据缺省时不崩溃（回归 #1）', async () => {
  const original = global.fetch
  // @ts-ignore
  global.fetch = async (url: string): Promise<any> => {
    const u = String(url)
    if (u.includes('/membership/plans')) return { ok: true, status: 200, json: async () => ({ plans: [{ k: 'month', l: '连续包月', p: 12, o: 18 }] }) }
    return { ok: true, status: 200, json: async () => ({}) }
  }
  render(<MeSub path="vip" go={go} />)
  await new Promise((r) => setTimeout(r, 80))
  expect(document.body).toBeTruthy()
  // @ts-ignore
  global.fetch = original
})
