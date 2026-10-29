import { Component, useEffect, useState, type ReactNode } from 'react'
import { Icon } from './Icons'
import { api, getToken, setToken } from './api'
import type { Grid } from './data'
import Home from './pages/Home'
import Editor from './pages/Editor'
import Compare from './pages/Compare'
import Inventory from './pages/Inventory'
import Me from './pages/Me'
import Detail from './pages/Detail'

export type Route =
  | { name: 'home' }
  | { name: 'editor'; sprite?: string; draftId?: number; grid?: Grid; title?: string; gridId?: number }
  | { name: 'compare'; sprite: string; title?: string; grid?: Grid }
  | { name: 'inventory' }
  | { name: 'me'; path?: string }
  | { name: 'detail'; id: number; back?: Route }

// 顶层错误边界：任何页面渲染崩溃时显示可恢复的提示，而不是白屏
class ErrorBoundary extends Component<{ children: ReactNode; onHome: () => void }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error) { console.error('页面渲染出错：', error) }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-full flex flex-col items-center justify-center gap-4 px-8 py-20 text-center">
          <div className="w-16 h-16 rounded-[22px] bg-blush flex items-center justify-center text-pink-deep"><Icon name="alert" size={26} /></div>
          <p className="font-black text-lg">页面出了点小问题</p>
          <p className="text-xs text-sub font-bold max-w-[260px]">{this.state.error.message || '渲染时发生错误'}</p>
          <button onClick={() => { this.setState({ error: null }); this.props.onHome() }} className="h-11 px-6 rounded-full bg-grad-pink text-white font-black shadow-lift">返回首页</button>
        </div>
      )
    }
    return this.props.children
  }
}

const TABS = [
  { key: 'home', label: '首页', icon: 'home' },
  { key: 'editor', label: '创作', icon: 'brush' },
  { key: 'inventory', label: '豆仓', icon: 'box' },
  { key: 'me', label: '我的', icon: 'user' },
] as const

export default function App() {
  const [route, go] = useState<Route>({ name: 'home' })
  const [ready, setReady] = useState(false)

  // 自动登录（演示）：无 token 时用默认账号登录，保证接口可用
  useEffect(() => {
    ;(async () => {
      try {
        if (!getToken()) {
          const { token } = await api.login('13800006688', '123456')
          setToken(token)
        }
      } catch (e) {
        console.warn('自动登录失败，将以离线模式运行', e)
      } finally {
        setReady(true)
      }
    })()
  }, [])

  const showTabs = ['home', 'inventory', 'me', 'editor'].includes(route.name) && !(route.name === 'me' && route.path)

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-pink-deep">
          <span className="w-10 h-10 rounded-full border-4 border-pink/30 border-t-pink animate-spin" />
          <p className="text-sm font-bold">正在连接小豆像素…</p>
        </div>
      </div>
    )
  }

  let page
  switch (route.name) {
    case 'home': page = <Home go={go} />; break
    case 'editor': page = <Editor key={(route.gridId ?? route.draftId ?? route.sprite ?? 'blank') as string} sprite={route.sprite} draftId={route.draftId} grid={route.grid} title={route.title} go={go} />; break
    case 'compare': page = <Compare sprite={route.sprite} title={route.title} grid={route.grid} go={go} />; break
    case 'inventory': page = <Inventory />; break
    case 'me': page = <Me key={route.path ?? 'root'} path={route.path} go={go} />; break
    case 'detail': page = <Detail back={route.back} id={route.id} go={go} />; break
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center sm:py-8">
      <div className="relative w-full sm:w-[390px] h-[100dvh] sm:h-[844px] bg-white sm:rounded-[44px] overflow-hidden sm:shadow-[0_30px_80px_rgba(244,139,167,.28)] sm:ring-8 sm:ring-white flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <ErrorBoundary key={route.name + ((route as { path?: string }).path ?? '')} onHome={() => go({ name: 'home' })}>{page}</ErrorBoundary>
        </div>
        {showTabs && (
          <nav className="shrink-0 bg-white/95 backdrop-blur border-t border-line px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] flex justify-around">
            {TABS.map((t) => {
              const on = route.name === t.key
              return (
                <button key={t.key} onClick={() => go({ name: t.key } as Route)} className="flex flex-col items-center gap-0.5 w-16">
                  <span className={`w-11 h-8 rounded-full flex items-center justify-center transition ${on ? 'bg-blush text-pink-deep' : 'text-sub'}`}>
                    <Icon name={t.icon} size={21} />
                  </span>
                  <span className={`text-[11px] font-bold ${on ? 'text-pink-deep' : 'text-sub'}`}>{t.label}</span>
                </button>
              )
            })}
          </nav>
        )}
      </div>
    </div>
  )
}
