import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../Icons'
import { PALETTE, SPRITES, parse, countColors, bead, type Grid } from '../data'
import { api } from '../api'
import { exportBlueprint } from '../beadBlueprint'
import type { Route } from '../App'

const SIZES = [15, 29, 34]
const BRANDS = ['MARD', 'Artkal', 'COCO', 'Hama']
type Tool = 'pen' | 'eraser' | 'picker' | 'bucket' | 'wand'

const blank = (n: number): Grid => Array.from({ length: n }, () => Array(n).fill(null))
const fromSprite = (s: string, n: number): Grid => {
  const src = parse(SPRITES[s]); const g = blank(n); const off = Math.floor((n - src.length) / 2)
  src.forEach((r, y) => r.forEach((c, x) => { if (g[y + off]) g[y + off][x + off] = c }))
  return g
}

export default function Editor({ sprite, draftId, grid, title, go }: { sprite?: string; draftId?: number; grid?: Grid; title?: string; go: (r: Route) => void }) {
  const init = grid ?? (sprite ? fromSprite(sprite, 15) : blank(15))
  const [size, setSize] = useState(init.length)
  const [hist, setHist] = useState<Grid[]>([init])
  const [hi, setHi] = useState(0)
  const grid0 = hist[hi]
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('B03')
  const [brand, setBrand] = useState('MARD')
  const [sym, setSym] = useState<'none' | 'x' | 'y'>('none')
  const [mirror, setMirror] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [drawing, setDrawing] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [name, setName] = useState(title || (sprite ? '复刻 · ' + sprite : '未命名图纸'))
  const [did, setDid] = useState<number | undefined>(draftId)
  const [toast, setToast] = useState('')
  const firstRun = useRef(true)
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1600) }

  const stats = useMemo(() => countColors(grid0), [grid0])
  const total = stats.reduce((a, b) => a + b[1], 0)

  const commit = (g: Grid, push = true) => {
    if (push) { setHist([...hist.slice(0, hi + 1), g]); setHi(hi + 1) }
    else { const h = [...hist]; h[hi] = g; setHist(h) }
  }
  const resize = (n: number) => {
    setSize(n); const g = sprite ? fromSprite(sprite, n) : blank(n); setHist([g]); setHi(0)
  }

  const apply = (x: number, y: number, push: boolean) => {
    if (tool === 'picker') { const c = grid0[y][x]; if (c) { setColor(c); setTool('pen') } return }
    const g = grid0.map((r) => [...r])
    const val = tool === 'eraser' ? null : color
    if (tool === 'bucket' || tool === 'wand') {
      const target = g[y][x]; if (target === val) return
      if (tool === 'wand') { g.forEach((r) => r.forEach((c, i) => { if (c === target) r[i] = val })) }
      else {
        const st = [[x, y]]
        while (st.length) { const [cx, cy] = st.pop()!; if (cx < 0 || cy < 0 || cx >= size || cy >= size || g[cy][cx] !== target) continue; g[cy][cx] = val; st.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]) }
      }
    } else {
      g[y][x] = val
      if (sym === 'x') g[y][size - 1 - x] = val
      if (sym === 'y') g[size - 1 - y][x] = val
    }
    commit(g, push)
  }

  const cell = Math.floor((330 / size) * zoom)
  const TOOLS: { k: Tool; icon: string; label: string }[] = [
    { k: 'pen', icon: 'pen', label: '画笔' }, { k: 'eraser', icon: 'eraser', label: '橡皮' },
    { k: 'picker', icon: 'picker', label: '吸管' }, { k: 'bucket', icon: 'bucket', label: '油漆桶' },
    { k: 'wand', icon: 'wand', label: '同色替换' },
  ]

  // 自动保存草稿（编辑后防抖落库）
  const save = async (g: Grid, n: number, nm: string, keepalive = false) => {
    const filled = g.flat().filter(Boolean).length
    const progress = Math.round((filled / (n * n)) * 100)
    try {
      if (did) { await api.updateDraft(did, { grid: g, size: n, name: nm, progress }, { keepalive }) }
      else { const r: any = await api.createDraft({ grid: g, size: n, name: nm, sprite: sprite || null, progress }, { keepalive }); if (r?.draft?.id) setDid(r.draft.id) }
    } catch (e) { console.warn('草稿保存失败', e) }
  }
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    const t = setTimeout(() => { save(hist[hi], size, name); flash('已自动保存草稿') }, 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hi, size, name])

  // 页面刷新/关闭瞬间：立即把最新画布用 keepalive 请求落库，避免防抖窗口内丢失
  const latest = useRef({ g: hist[hi], n: size, nm: name })
  latest.current = { g: hist[hi], n: size, nm: name }
  useEffect(() => {
    const onUnload = () => { void save(latest.current.g, latest.current.n, latest.current.nm, true) }
    window.addEventListener('beforeunload', onUnload)
    return () => window.removeEventListener('beforeunload', onUnload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const publish = async () => {
    try {
      await api.createWork({ title: name, sprite: sprite || null, grid: hist[hi], size: `${size}×${size}`, tag: '未分类' })
      flash('已发布到灵感广场')
    } catch (e: any) { flash(e?.message || '发布失败') }
  }

  return (
    <div className="flex flex-col min-h-full bg-[#FFF8FA]" onPointerUp={() => setDrawing(false)}>
      <header className="px-4 pt-12 pb-2 flex items-center gap-2 bg-white">
        <button onClick={() => go({ name: 'home' })} className="w-9 h-9 rounded-full bg-blush text-pink-deep flex items-center justify-center"><Icon name="back" size={18} /></button>
        <div className="flex-1 min-w-0">
          <input value={name} onChange={(e) => setName(e.target.value)} className="font-black truncate bg-transparent outline-none w-full" />
          <p className="text-[11px] text-sub">{`${size}×${size} · 自动保存`}</p>
        </div>
        <button disabled={hi === 0} onClick={() => setHi(hi - 1)} className="w-9 h-9 rounded-full flex items-center justify-center text-ink disabled:text-line"><Icon name="undo" size={19} /></button>
        <button disabled={hi === hist.length - 1} onClick={() => setHi(hi + 1)} className="w-9 h-9 rounded-full flex items-center justify-center text-ink disabled:text-line"><Icon name="redo" size={19} /></button>
        <button onClick={() => { void exportBlueprint(hist[hi], name, size, brand); flash('已导出图纸文件') }} className="w-9 h-9 rounded-full bg-blush text-pink-deep flex items-center justify-center" title="下载图纸" aria-label="下载图纸"><Icon name="download" size={18} /></button>
        <button onClick={publish} className="h-9 px-3 rounded-full bg-grad-pink text-white text-[13px] font-black shadow-soft">发布</button>
        <button onClick={() => go({ name: 'compare', sprite: sprite || 'custom', grid: hist[hi], title: name })} className="h-9 px-3.5 rounded-full bg-grad-pink text-white text-[13px] font-black shadow-soft">开拼</button>
      </header>

      <div className="bg-white px-4 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-line">
        {SIZES.map((n) => (
          <button key={n} onClick={() => resize(n)} className={`shrink-0 h-7 px-3 rounded-full text-xs font-bold ${size === n ? 'bg-ink text-white' : 'bg-line/70 text-sub'}`}>{n}×{n}</button>
        ))}
        <button className="shrink-0 h-7 px-3 rounded-full text-xs font-bold bg-butter/60 text-[#A9762B] flex items-center gap-1"><Icon name="lock" size={12} />102×102</button>
        <span className="w-px h-5 bg-line shrink-0" />
        <button onClick={() => setSym(sym === 'x' ? 'none' : 'x')} className={`shrink-0 h-7 px-3 rounded-full text-xs font-bold ${sym === 'x' ? 'bg-lilac text-[#6A4CC0]' : 'bg-line/70 text-sub'}`}>左右对称</button>
        <button onClick={() => setSym(sym === 'y' ? 'none' : 'y')} className={`shrink-0 h-7 px-3 rounded-full text-xs font-bold ${sym === 'y' ? 'bg-lilac text-[#6A4CC0]' : 'bg-line/70 text-sub'}`}>上下对称</button>
        <button onClick={() => setMirror(!mirror)} className={`shrink-0 h-7 px-3 rounded-full text-xs font-bold flex items-center gap-1 ${mirror ? 'bg-sky text-[#2F7FA8]' : 'bg-line/70 text-sub'}`}><Icon name="mirror" size={13} />熨烫翻面</button>
      </div>

      <div className="relative flex-1 min-h-[360px] overflow-auto no-scrollbar flex items-center justify-center p-4">
        <div className="checker rounded-2xl shadow-soft p-1.5 select-none touch-none" style={{ transform: mirror ? 'scaleX(-1)' : undefined }}>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${size}, ${cell}px)` }}>
            {grid0.map((r, y) => r.map((c, x) => (
              <div key={`${x}-${y}`}
                onPointerDown={(e) => { (e.target as HTMLElement).releasePointerCapture?.(e.pointerId); setDrawing(true); apply(x, y, true) }}
                onPointerEnter={() => { if (drawing && (tool === 'pen' || tool === 'eraser')) apply(x, y, false) }}
                className="flex items-center justify-center"
                style={{ width: cell, height: cell, boxShadow: 'inset 0 0 0 .5px rgba(0,0,0,.07)', ...(x % 5 === 4 && x < size - 1 ? { borderRight: '1px solid rgba(255,140,170,.35)' } : {}), ...(y % 5 === 4 && y < size - 1 ? { borderBottom: '1px solid rgba(255,140,170,.35)' } : {}) }}>
                {c && <span className="block w-[84%] h-[84%] rounded-full" style={{ background: bead(c).hex, boxShadow: 'inset 0 -1px 0 rgba(0,0,0,.12), inset 0 0 0 1px rgba(0,0,0,.05)' }} />}
              </div>
            )))}
          </div>
        </div>

        <div className="absolute left-4 bottom-4 flex flex-col bg-white rounded-2xl shadow-soft overflow-hidden">
          <button onClick={() => setZoom(Math.min(2, zoom + 0.25))} className="w-9 h-9 flex items-center justify-center"><Icon name="plus" size={16} /></button>
          <span className="text-[10px] text-center font-bold text-sub">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.max(0.75, zoom - 0.25))} className="w-9 h-9 flex items-center justify-center"><Icon name="minus" size={16} /></button>
        </div>

        <div className="absolute right-3 top-3 w-[132px]">
          <button onClick={() => setShowStats(!showStats)} className="w-full bg-white/95 backdrop-blur rounded-2xl shadow-soft p-3 text-left">
            <div className="flex items-center justify-between"><span className="text-xs font-black">用量统计</span><span className="text-[10px] text-sub">{total} 颗</span></div>
            {showStats && (
              <div className="mt-2 flex flex-col gap-1.5 max-h-40 overflow-y-auto no-scrollbar">
                {stats.length === 0 && <p className="text-[11px] text-sub">还没有落豆哦</p>}
                {stats.map(([c, n]) => (
                  <div key={c} className="flex items-center gap-1.5 text-[11px]">
                    <i className="w-3.5 h-3.5 rounded-full border border-black/5" style={{ background: bead(c).hex }} />
                    <span className="font-bold">{c}</span>
                    <span className="ml-auto text-sub">×{n}</span>
                  </div>
                ))}
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-t-[24px] shadow-[0_-6px_20px_rgba(255,182,200,.18)] pt-3 pb-3">
        <div className="flex justify-between px-4">
          {TOOLS.map((t) => (
            <button key={t.k} onClick={() => setTool(t.k)} className="flex flex-col items-center gap-1 w-14">
              <span className={`w-11 h-11 rounded-2xl flex items-center justify-center transition ${tool === t.k ? 'bg-grad-pink text-white shadow-soft' : 'bg-line/60 text-ink'}`}><Icon name={t.icon} size={20} /></span>
              <span className={`text-[10px] font-bold ${tool === t.k ? 'text-pink-deep' : 'text-sub'}`}>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 px-4 mt-3">
          <div className="flex bg-line/60 rounded-full p-0.5">
            {BRANDS.map((b) => (
              <button key={b} onClick={() => setBrand(b)} className={`px-2.5 h-6 rounded-full text-[11px] font-bold ${brand === b ? 'bg-white text-pink-deep shadow-soft' : 'text-sub'}`}>{b}</button>
            ))}
          </div>
          <span className="ml-auto text-[11px] font-bold text-sub">当前 <b className="text-ink">{brand} {color}</b></span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pt-3 pb-1">
          {PALETTE.map((p) => (
            <button key={p.code} onClick={() => { setColor(p.code); if (tool === 'eraser' || tool === 'picker') setTool('pen') }} className="shrink-0 flex flex-col items-center gap-1">
              <span className={`w-9 h-9 rounded-full border border-black/5 transition ${color === p.code ? 'ring-[3px] ring-pink ring-offset-2 scale-105' : ''}`} style={{ background: p.hex, boxShadow: 'inset 0 -3px 0 rgba(0,0,0,.08)' }} />
              <span className="text-[10px] font-bold text-sub">{p.code}</span>
            </button>
          ))}
        </div>
      </div>
      {toast && <div className="fixed sm:absolute left-1/2 -translate-x-1/2 bottom-28 bg-ink/90 text-white text-sm font-bold px-4 py-2.5 rounded-2xl">{toast}</div>}
    </div>
  )
}
