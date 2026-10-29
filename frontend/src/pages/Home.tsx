import { useEffect, useRef, useState } from 'react'
import { Icon } from '../Icons'
import { PixelArt } from '../Pixel'
import { SPRITES, parse, countColors, type Grid } from '../data'
import { api } from '../api'
import { fileToPixels, fileToGrid } from '../imageToGrid'
import type { Route } from '../App'

const CATS = ['推荐', '杯垫', '挂件', '动物', 'IP', '国风', '节日', '文字']
const TINTS = ['bg-blush', 'bg-sky/50', 'bg-butter/50', 'bg-lilac/50', 'bg-mint/50']

export type Work = {
  id: number; title: string; author: string; sprite: string; likes: number
  tag: string; size: string; tall?: boolean; liked: boolean; grid: (string | null)[][]
}

export default function Home({ go }: { go: (r: Route) => void }) {
  const [cat, setCat] = useState('推荐')
  const [sort, setSort] = useState<'hot' | 'new'>('hot')
  const [q, setQ] = useState('')
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)

  // 图片转图纸：本地选图 -> 选尺寸 -> 转换 -> 进入编辑器
  const [conv, setConv] = useState<{ url: string; file: File } | null>(null)
  const [convSize, setConvSize] = useState(29)
  const [convBusy, setConvBusy] = useState(false)
  const [convErr, setConvErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const CONV_SIZES = [15, 29, 34]
  const closeConv = () => {
    if (conv) URL.revokeObjectURL(conv.url)
    setConv(null); setConvErr('')
  }
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = '' // 允许再次选择同一文件
    if (!f) return
    if (!f.type.startsWith('image/')) { setConvErr('请选择图片文件'); return }
    setConvErr('')
    setConvSize(29)
    setConv({ url: URL.createObjectURL(f), file: f })
  }
  const doConvert = async () => {
    if (!conv) return
    setConvBusy(true); setConvErr('')
    try {
      const pixels = await fileToPixels(conv.file, convSize)
      let grid: Grid
      try {
        const r: any = await api.convert({ size: convSize, pixels })
        grid = r.grid
      } catch {
        // 后端不可用时，前端本地兜底降色，保证离线也能出图
        grid = await fileToGrid(conv.file, convSize)
      }
      closeConv()
      go({ name: 'editor', grid, title: '图片转图纸', gridId: Date.now() })
    } catch (e: any) {
      setConvErr(e?.message || '转换失败，请重试')
      setConvBusy(false)
    }
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    api.listWorks({ cat, sort, q })
      .then((d: any) => { if (alive) setWorks(d.works || []) })
      .catch(() => { if (alive) setWorks([]) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [cat, sort, q])

  const toggleFav = (w: Work) => {
    // 乐观更新
    setWorks((list) => list.map((x) => x.id === w.id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x))
    api.toggleFavorite(w.id).catch(() => {
      // 失败回滚
      setWorks((list) => list.map((x) => x.id === w.id ? { ...x, liked: w.liked, likes: w.likes } : x))
    })
  }

  const list = works
  const cols = [list.filter((_, i) => i % 2 === 0), list.filter((_, i) => i % 2 === 1)]

  return (
    <div className="pb-4">
      <header className="px-5 pt-12 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-sub font-bold">下午好，今天拼点什么？</p>
            <h1 className="text-[26px] font-black tracking-tight flex items-center gap-1.5">
              小豆像素
              <span className="flex gap-0.5">{['#FFB6C8', '#FFD79D', '#B5E8FF', '#B5F2D8'].map((c) => <i key={c} className="w-2 h-2 rounded-full" style={{ background: c }} />)}</span>
            </h1>
          </div>
          <div className="w-11 h-11 rounded-full bg-blush overflow-hidden p-1.5"><PixelArt grid={parse(SPRITES.bunny)} /></div>
        </div>
        <label className="flex items-center gap-2 h-11 px-4 rounded-2xl bg-line/70 text-sub">
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索图纸、作者、色号" className="flex-1 bg-transparent outline-none text-sm text-ink placeholder:text-sub" />
        </label>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-1">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`shrink-0 px-4 h-8 rounded-full text-[13px] font-bold transition ${cat === c ? 'bg-grad-pink text-white shadow-soft' : 'bg-white border border-line text-sub'}`}>{c}</button>
        ))}
      </div>

      <section className="px-5 mt-4">
        <div className="relative rounded-[22px] bg-gradient-to-br from-[#FF7FA6] via-[#FF9EBB] to-[#FFB59A] p-5 overflow-hidden shadow-lift">
          <div className="absolute -right-4 -top-3 w-36 opacity-95 rotate-6"><PixelArt grid={parse(SPRITES.strawberry)} /></div>
          <p className="text-white/90 text-xs font-bold">AI 智能降色 · 自动匹配色号</p>
          <h2 className="text-white text-[22px] font-black leading-tight mt-1">照片一键<br />变拼豆图纸</h2>
          <div className="flex gap-2.5 mt-4">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 h-11 px-4 rounded-2xl bg-white text-pink-deep font-black text-sm shadow-soft active:scale-95 transition">
              <Icon name="image" size={18} />图片转图纸
            </button>
            <button onClick={() => go({ name: 'editor' })} className="flex items-center gap-1.5 h-11 px-4 rounded-2xl bg-white/25 text-white font-black text-sm border border-white/50 active:scale-95 transition">
              <Icon name="plus" size={18} />空白新建
            </button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
      </section>

      <div className="flex items-center justify-between px-5 mt-6 mb-3">
        <h3 className="text-lg font-black">灵感广场</h3>
        <div className="flex bg-line/70 rounded-full p-0.5 text-xs font-bold">
          {(['hot', 'new'] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)} className={`px-3 h-7 rounded-full ${sort === s ? 'bg-white text-pink-deep shadow-soft' : 'text-sub'}`}>{s === 'hot' ? '热门' : '最新'}</button>
          ))}
        </div>
      </div>

      {loading && works.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3 text-pink-deep">
          <span className="w-9 h-9 rounded-full border-4 border-pink/30 border-t-pink animate-spin" />
          <p className="text-sm font-bold">加载灵感中…</p>
        </div>
      ) : (
        <div className="px-5 grid grid-cols-2 gap-3 items-start">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-3">
              {col.map((w) => {
                const g = w.grid || parse(SPRITES[w.sprite])
                const on = w.liked
                return (
                  <article key={w.id} onClick={() => go({ name: 'detail', id: w.id })} className="rounded-[18px] bg-white shadow-soft border border-blush overflow-hidden cursor-pointer active:scale-[.98] transition">
                    <div className={`${TINTS[w.id % TINTS.length]} ${w.tall ? 'p-5 pb-8' : 'p-4'} relative`}>
                      <PixelArt grid={g} />
                      <span className="absolute left-2 bottom-2 text-[10px] font-bold bg-white/80 rounded-full px-2 py-0.5 text-sub">{countColors(g).length} 色 · {w.size}</span>
                    </div>
                    <div className="p-3">
                      <p className="text-[13px] font-extrabold truncate">{w.title}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[11px] text-sub truncate">@{w.author}</span>
                        <button onClick={(e) => { e.stopPropagation(); toggleFav(w) }} className={`flex items-center gap-0.5 text-[11px] font-bold ${on ? 'text-pink-deep' : 'text-sub'}`}>
                          <Icon name="heart" size={15} fill={on ? '#EC5C86' : 'none'} />{w.likes}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ))}
          {works.length === 0 && <p className="col-span-2 text-center text-sub text-sm py-10 font-bold">没有找到相关图纸</p>}
        </div>
      )}

      {conv && (
        <div className="fixed sm:absolute inset-0 z-30 bg-ink/40 flex items-end sm:items-center justify-center" onClick={closeConv}>
          <div className="w-full sm:w-[360px] bg-white rounded-t-[26px] sm:rounded-[26px] p-5 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black">图片转图纸</h3>
              <button onClick={closeConv} className="w-8 h-8 rounded-full bg-line/70 flex items-center justify-center text-sub"><Icon name="close" size={16} /></button>
            </div>
            <div className="rounded-2xl bg-line/50 overflow-hidden flex items-center justify-center" style={{ aspectRatio: '1 / 1' }}>
              <img src={conv.url} alt="预览" className="max-w-full max-h-[260px] object-contain" />
            </div>
            <p className="text-xs text-sub font-bold mt-3 mb-1.5">选择图纸尺寸（格子越大越精细）</p>
            <div className="flex gap-2">
              {CONV_SIZES.map((n) => (
                <button key={n} onClick={() => setConvSize(n)} className={`flex-1 h-10 rounded-2xl text-sm font-black ${convSize === n ? 'bg-grad-pink text-white shadow-soft' : 'bg-line/70 text-sub'}`}>{n}×{n}</button>
              ))}
            </div>
            {convErr && <p className="text-xs text-red-500 font-bold mt-2">{convErr}</p>}
            <button onClick={doConvert} disabled={convBusy} className="mt-4 w-full h-12 rounded-2xl bg-grad-pink text-white font-black shadow-lift disabled:opacity-60 flex items-center justify-center gap-2">
              {convBusy ? <><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />转换中…</> : '生成拼豆图纸'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
