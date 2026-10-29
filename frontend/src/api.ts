// 前端 API 客户端：封装所有后端接口调用
// 开发时由 vite 代理把 /api 转发到后端（默认 http://localhost:8787）
//
// 生产环境（如 Cloudflare Pages 只托管前端）可把后端指向独立部署的 Node 服务：
//   在构建环境变量中设置 VITE_API_BASE=https://api.你的域名.com （不要带结尾斜杠）
// 未配置时默认同源 /api（本地开发、或前后端同域时）。
const API_BASE: string = String((import.meta as any).env?.VITE_API_BASE ?? '').replace(/\/$/, '')
const TOKEN_KEY = 'pixel_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

class ApiError extends Error {}
export { ApiError }

async function request<T = any>(path: string, opts: { method?: string; body?: any; keepalive?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(API_BASE + '/api' + path, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    // keepalive：在页面刷新/关闭时发起的请求也能送达后端，避免草稿丢失
    keepalive: opts.keepalive ?? false,
  })
  let data: any = {}
  try { data = await res.json() } catch { /* ignore */ }
  if (!res.ok) throw new ApiError(data?.error || `请求失败 (${res.status})`)
  return data as T
}

export const api = {
  // 账号
  login: (phone: string, code: string) => request('/auth/login', { method: 'POST', body: { phone, code } }),
  me: () => request('/auth/me'),
  updateMe: (patch: any) => request('/auth/me', { method: 'PUT', body: patch }),

  // 作品 / 灵感广场
  listWorks: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString()
    return request('/works' + (qs ? '?' + qs : ''))
  },
  getWork: (id: number) => request('/works/' + id),
  createWork: (body: any) => request('/works', { method: 'POST', body }),
  toggleFavorite: (id: number) => request('/works/' + id + '/favorite', { method: 'POST' }),
  favorites: () => request('/favorites'),

  // 草稿
  listDrafts: () => request('/drafts'),
  createDraft: (body: any, opts: { keepalive?: boolean } = {}) => request('/drafts', { method: 'POST', body, keepalive: opts.keepalive }),
  updateDraft: (id: number, body: any, opts: { keepalive?: boolean } = {}) => request('/drafts/' + id, { method: 'PUT', body, keepalive: opts.keepalive }),
  deleteDraft: (id: number) => request('/drafts/' + id, { method: 'DELETE' }),

  // 豆仓库存
  getInventory: () => request('/inventory'),
  setInventory: (code: string, qty: number) => request('/inventory/set', { method: 'POST', body: { code, qty } }),
  adjustInventory: (code: string, delta: number) => request('/inventory/adjust', { method: 'POST', body: { code, delta } }),
  deductInventory: (needs: Record<string, number>) => request('/inventory/deduct', { method: 'POST', body: { needs } }),
  inventoryShortage: (needs: Record<string, number>) => request('/inventory/shortage', { method: 'POST', body: { needs } }),

  // 拼豆记录
  listHistory: () => request('/history'),
  addHistory: (body: any) => request('/history', { method: 'POST', body }),

  // 拼豆对照进度
  getProgress: (sprite: string) => request('/progress/' + encodeURIComponent(sprite)),
  saveProgress: (sprite: string, done: string[]) => request('/progress/' + encodeURIComponent(sprite), { method: 'PUT', body: { done } }),

  // 导出记录
  listExports: () => request('/exports'),
  addExport: (body: any) => request('/exports', { method: 'POST', body }),

  // 会员
  plans: () => request('/membership/plans'),
  membership: () => request('/membership'),
  subscribe: (plan: string) => request('/membership/subscribe', { method: 'POST', body: { plan } }),
  cancelMembership: () => request('/membership/cancel', { method: 'POST' }),

  // 设置
  getSettings: () => request('/settings'),
  updateSettings: (patch: any) => request('/settings', { method: 'PUT', body: patch }),

  // AI 图片转图纸（演示）
  convert: (body: any) => request('/convert', { method: 'POST', body }),
}

// 简单的异步加载 hook
import { useEffect, useState } from 'react'
export function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    setLoading(true); setError(null)
    fn()
      .then((d) => { if (alive) setData(d) })
      .catch((e) => { if (alive) setError(e?.message || '加载失败') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { data, loading, error }
}
