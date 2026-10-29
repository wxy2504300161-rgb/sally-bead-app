import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../Icons'
import { SPRITES, parse, countColors, bead } from '../data'
import type { Route } from '../App'
import { PixelArt } from '../Pixel'
import { api } from '../api'

// 立体豆子：左上高光 + 底部暗影 + 外投影，白豆加描边和浅灰底色，避免和白色底板融合
const beadStyle = (hex: string) => ({
  background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,.75), rgba(255,255,255,0) 46%), ${hex.toUpperCase() === '#FFFFFF' ? 'linear-gradient(160deg, #FFFFFF, #E9E6E7)' : hex}`,
  boxShadow: `inset 0 -2px 3px rgba(0,0,0,.16), 0 1px 2px rgba(110,60,80,.28)${hex.toUpperCase() === '#FFFFFF' ? ', 0 0 0 1px rgba(0,0,0,.22)' : ''}`,
})

export default function Compare({ sprite, title, grid, go }: { sprite: string; title?: string; grid?: (string | null)[][]; go: (r: Route) => void }) {
  const templateGrid = useMemo(() => {
    if (grid) return grid
    const src = SPRITES[sprite]
    return src ? parse(src) : Array.from({ length: 14 }, () => Array(14).fill(null))
  }, [sprite, grid])
  const stats = useMemo(() => countColors(templateGrid), [templateGrid])
  const [focus, setFocus] = useState<string>(stats[0]?.[0] ?? '')
  const [highlight, setHighlight] = useState(true)
  const [lines, setLines] = useState(true)
  const [awake, setAwake] = useState(true)
  const [done, setDone] = useState<Set<string>>(new Set())
  const n = templateGrid[0].length
  const total = stats.reduce((a, b) => a + b[1], 0)
  const doneFor = (c: string) => [...done].filter((k) => { const [x, y] = k.split(',').map(Number); return templateGrid[y][x] === c }).length
  const focusTotal = stats.find((s) => s[0] === focus)?.[1] ?? 0
  const pct = total ? Math.round((done.size / total) * 100) : 0

  // 载入已保存进度
  const loaded = useRef(false)
  useEffect(() => {
    let alive = true
    api.getProgress(sprite).then((d: any) => { if (alive) { setDone(new Set(d.done || [])); loaded.current = true } }).catch(() => { loaded.current = true })
    return () => { alive = false }
  }, [sprite])

  // 进度变化后防抖保存
  useEffect(() => {
    if (!loaded.current) return
    const t = setTimeout(() => { api.saveProgress(sprite, [...done]).catch(() => {}) }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, sprite])

  // 进度从未满变为 100% 时弹出完成庆祝，并记录到「拼豆记录」
  const [celebrate, setCelebrate] = useState(false)
  const wasFull = useRef(false)
  useEffect(() => {
    const full = done.size === total
    if (full && !wasFull.current) {
      setCelebrate(true)
      api.addHistory({ sprite, title: title || '我的拼豆作品', minutes: Math.max(5, Math.round(total / 6)), total })
        .catch(() => {})
    }
    wasFull.current = full
  }, [done, total, sprite, title])

  const toggle = (x: number, y: number) => {
    if (!templateGrid[y][x]) return
    const k = `${x},${y}`; const s = new Set(done); s.has(k) ? s.delete(k) : s.add(k); setDone(s)
  }
  const fillFocus = () => {
    const s = new Set(done); templateGrid.forEach((r, y) => r.forEach((c, x) => c === focus && s.add(`${x},${y}`))); setDone(s)
  }

  const Toggle = ({ on, set, label, icon, className = 'flex-1' }: { on: boolean; set: (v: boolean) => void; label: string; icon: string; className?: string }) => (
    <button onClick={() => set(!on)} className={`${className} flex items-center gap-1.5 h-10 px-3 rounded-2xl text-xs font-bold transition ${on ? 'bg-blush text-pink-deep' : 'bg-line/60 text-sub'}`}>
      <Icon name={icon} size={16} />{label}
      <span className={`ml-auto w-7 h-4 rounded-full relative transition ${on ? 'bg-grad-pink' : 'bg-[#ddd]'}`}><i className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${on ? 'left-3.5' : 'left-0.5'}`} /></span>
    </button>
  )

  return (
    <div className="min-h-full bg-[#FFF8FA] pb-6">
      {celebrate && <Celebrate grid={templateGrid} total={total} colors={stats.length} onClose={() => setCelebrate(false)} onHistory={() => go({ name: 'me', path: 'history' })} onHome={() => go({ name: 'home' })} />}
      <header className="px-4 pt-12 pb-3 flex items-center gap-2">
        <button onClick={() => go({ name: 'editor', sprite: sprite === 'custom' ? undefined : sprite, grid: templateGrid })} className="w-9 h-9 rounded-full bg-white shadow-soft text-pink-deep flex items-center justify-center"><Icon name="back" size={18} /></button>
        <div className="flex-1"><p className="font-black">拼豆对照</p><p className="text-[11px] text-sub">点击格子标记已拼</p></div>
        {awake && <span className="flex items-center gap-1 text-[11px] font-bold text-[#3E9C74] bg-mint/60 rounded-full px-2.5 h-7"><Icon name="sun" size={13} />屏幕常亮中</span>}
      </header>

      <section className="mx-4 rounded-[20px] bg-white shadow-soft p-4">
        <div className="flex items-end justify-between">
          <div><p className="text-xs text-sub font-bold">总进度</p><p className="text-[28px] font-black leading-none mt-1">{done.size}<span className="text-sm text-sub font-bold"> / {total} 颗</span></p></div>
          <span className="text-2xl font-black text-pink-deep">{pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-blush mt-3 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-[#FFA6C1] via-pink to-[#FF8E7A] transition-all" style={{ width: `${pct}%` }} /></div>
      </section>

      <div className="flex gap-2 mx-4 mt-3">
        <Toggle on={highlight} set={setHighlight} label="单色高亮" icon="star" className="flex-1 min-w-0 whitespace-nowrap !gap-1 !px-2.5" />
        <Toggle on={lines} set={setLines} label="网格线" icon="grid" className="flex-1 min-w-0 whitespace-nowrap !gap-1 !px-2.5" />
        <Toggle on={awake} set={setAwake} label="常亮" icon="sun" className="flex-1 min-w-0 whitespace-nowrap !gap-1 !px-2.5" />
      </div>

      <div className="mx-4 mt-3 rounded-[20px] bg-white shadow-soft p-3">
        <div className="grid select-none" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {templateGrid.map((r, y) => r.map((c, x) => {
            const isDone = done.has(`${x},${y}`)
            const dim = highlight && c !== focus
            return (
              <button key={`${x}-${y}`} onClick={() => toggle(x, y)} className="aspect-square flex items-center justify-center relative" style={{ boxShadow: lines ? 'inset 0 0 0 .5px rgba(0,0,0,.07)' : undefined }}>
                {c && <span className="w-[86%] h-[86%] rounded-full flex items-center justify-center transition-opacity" style={{ ...beadStyle(bead(c).hex), opacity: dim ? 0.18 : 1 }}>
                  {isDone && !dim && <Icon name="check" size={12} strokeWidth={3.5} stroke={c === 'A01' ? '#EC5C86' : '#fff'} />}
                </span>}
              </button>
            )
          }))}
        </div>
      </div>

      <div className="mx-4 mt-3 flex items-center justify-between">
        <h3 className="font-black">选择颜色</h3>
        <button onClick={fillFocus} className="text-xs font-bold text-pink-deep">本色全部完成</button>
      </div>
      <div className="mx-4 mt-2 flex flex-col gap-2">
        {stats.map(([c, cnt]) => {
          const d = doneFor(c); const on = c === focus
          return (
            <button key={c} onClick={() => setFocus(c)} className={`flex items-center gap-3 p-3 rounded-2xl text-left transition ${on ? 'bg-white shadow-soft ring-2 ring-pink' : 'bg-white/70'}`}>
              <i className="w-8 h-8 rounded-full flex items-center justify-center" style={beadStyle(bead(c).hex)}></i>
              <div className="flex-1"><p className="text-sm font-black">{c} <span className="text-sub font-bold text-xs">{bead(c).name}</span></p>
                <div className="h-1.5 rounded-full bg-line mt-1.5 overflow-hidden"><div className="h-full bg-grad-pink rounded-full" style={{ width: `${(d / cnt) * 100}%` }} /></div></div>
              <span className="text-xs font-bold text-sub">{d}/{cnt}</span>
              {d === cnt && <span className="w-5 h-5 rounded-full bg-mint text-[#3E9C74] flex items-center justify-center"><Icon name="check" size={12} strokeWidth={3} /></span>}
            </button>
          )
        })}
      </div>
      <p className="text-center text-[11px] text-sub mt-4">当前聚焦 {focus} · 还剩 {focusTotal - doneFor(focus)} 颗</p>
    </div>
  )
}

const CONFETTI = ['#FF8FAE', '#FFD79D', '#B5E8FF', '#B5F2D8', '#D8C4FF', '#FFA36C']

function Celebrate({ grid, total, colors, onClose, onHistory, onHome }: { grid: (string | null)[][]; total: number; colors: number; onClose: () => void; onHistory: () => void; onHome: () => void }) {
  return (
    <div className="absolute inset-0 z-40 bg-ink/45 backdrop-blur-[2px] flex items-center justify-center px-7 animate-[fade_.2s_ease-out]" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full bg-white rounded-[28px] px-6 pt-8 pb-5 text-center shadow-lift animate-[pop_.35s_cubic-bezier(.2,1.4,.4,1)]">
        {CONFETTI.flatMap((c, i) => [0, 1].map((j) => (
          <i key={`${i}-${j}`} className="absolute rounded-full" style={{ background: c, width: 8 + ((i + j) % 3) * 3, height: 8 + ((i + j) % 3) * 3, top: j ? 14 + i * 9 : 70 + i * 7, [j ? 'right' : 'left']: 12 + ((i * 7) % 22) }} />
        )))}
        <div className="w-36 mx-auto bg-blush/60 rounded-[22px] p-3"><div className="bg-white rounded-2xl p-2.5 shadow-soft"><PixelArt grid={grid} /></div></div>
        <h2 className="mt-5 text-[22px] font-black text-grad-pink">太棒啦，拼完了！</h2>
        <p className="mt-1.5 text-sm text-sub font-bold">这次一共拼了 {total} 颗豆子 · {colors} 种颜色</p>
        <p className="mt-3 mx-auto w-fit flex items-center gap-1.5 rounded-full bg-mint/50 px-3 h-7 text-[11px] font-bold text-[#3E9C74]"><Icon name="check" size={13} strokeWidth={3} />已保存到「我的 - 拼豆记录」</p>
        <button onClick={onHistory} className="mt-5 w-full h-12 rounded-2xl bg-grad-pink text-white font-black shadow-lift">去拼豆记录看看</button>
        <div className="mt-2.5 flex gap-2.5">
          <button onClick={onClose} className="flex-1 h-11 rounded-2xl bg-blush text-pink-deep text-sm font-black">再欣赏一下</button>
          <button onClick={onHome} className="flex-1 h-11 rounded-2xl bg-line/70 text-sub text-sm font-black">回到首页</button>
        </div>
      </div>
    </div>
  )
}
