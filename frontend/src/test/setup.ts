import '@testing-library/jest-dom/vitest'

// jsdom 未实现 URL.createObjectURL / revokeObjectURL，测试中补一个空实现
if (typeof (globalThis.URL as any).createObjectURL !== 'function') {
  ;(globalThis.URL as any).createObjectURL = () => 'blob:mock'
  ;(globalThis.URL as any).revokeObjectURL = () => {}
}

// ---- 模拟后端：返回与真实接口一致的数据结构，确保页面在“后端可用”场景下渲染 ----
const USER = {
  id: 'u1', name: '豆豆酱', avatar: 'bunny', phone: '13800006688',
  bio: '用一颗颗豆子拼出小确幸', city: '上海', brand: 'Artkal',
  level: 4, levelName: '拼豆达人', days: 128,
}
const WORKS = [
  { id: 1, title: '樱花小兔杯垫', authorId: 'u1', sprite: 'bunny', likes: 2384, tag: '杯垫', size: '29×29' },
  { id:2, title: '草莓甜心挂件', authorId: 'u2', sprite: 'strawberry', likes: 1569, tag: '挂件', size: '15×15' },
]

function json(body: any, ok = true, status = 200) {
  return { ok, status, json: async () => body } as Response
}

// @ts-ignore - 测试中替换全局 fetch
global.fetch = async (url: string, opts: any = {}): Promise<any> => {
  const u = String(url)
  const method = (opts.method || 'GET').toUpperCase()
  if (u.includes('/auth/login')) return json({ token: 'tok-123', user: USER })
  if (u.includes('/auth/me')) return json({ user: USER })
  if (u.includes('/works') && method === 'GET') return json({ works: WORKS })
  if (u.includes('/favorites')) return json({ works: [] })
  if (u.includes('/drafts')) return json({ drafts: [] })
  if (u.includes('/history')) return json({ history: [] })
  if (u.includes('/membership/plans')) return json({ plans: [{ k: 'month', l: '连续包月', p: 12, o: 18 }, { k: 'year', l: '年卡', p: 98, o: 216, hot: true }, { k: 'life', l: '永久会员', p: 198, o: 398 }] })
  if (u.includes('/membership')) return json({ membership: { active: false, plan: null } })
  if (u.includes('/settings')) return json({ settings: {} })
  if (u.includes('/exports')) return json({ exports: [] })
  if (u.includes('/inventory')) return json({ stock: {} })
  if (u.includes('/convert')) {
    const body = opts.body ? JSON.parse(opts.body) : {}
    const size = Number(body.size) || 15
    const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => 'B07'))
    return json({ grid, size, colors: 1, stats: [['B07', size * size]] })
  }
  return json({})
}
