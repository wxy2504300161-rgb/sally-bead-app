// Problem 2 前端侧验证：登录态（token）在 localStorage 中持久化，刷新/关闭/重启浏览器不丢失
import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, clearToken } from '../api'

describe('登录态持久化（localStorage）', () => {
  beforeEach(() => localStorage.clear())

  it('setToken 后 getToken 能读回，clearToken 后为空', () => {
    expect(getToken()).toBeNull()
    setToken('abc.def.ghi')
    expect(getToken()).toBe('abc.def.ghi')
    // 模拟“刷新/重启浏览器”后重新读取
    expect(localStorage.getItem('pixel_token')).toBe('abc.def.ghi')
    clearToken()
    expect(getToken()).toBeNull()
  })

  it('token 写入的是持久化存储（而非 sessionStorage）', () => {
    setToken('persist-me')
    expect(sessionStorage.getItem('pixel_token')).toBeNull()
    expect(localStorage.getItem('pixel_token')).toBe('persist-me')
  })
})
