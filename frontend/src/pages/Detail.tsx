import { useEffect, useState } from 'react'
import { Icon } from '../Icons'
import { PixelArt } from '../Pixel'
import { SPRITES, parse, countColors, bead } from '../data'
import { api } from '../api'
import type { Route } from '../App'

const EXPORTS = [
  { k: '带网格图纸', icon: 'grid', bg: 'bg-blush' }, { k: '色号标注图', icon: 'star', bg: 'bg-butter/50' },
  { k: 'PDF 打印版', icon: 'draft', bg: 'bg-sky/50' }, { k: '用料清单', icon: 'copy', bg: 'bg-mint/50' },
]

export default function Detail({ id, go, back }: { id: number; go: (r: Route) => void; back?: Route }) {
  const [work, setWork] = useState<any>(null)
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 1600) }

  useEffect(() => {
    let alive = true
    setLoading(true)
    api.getWork(id)
      .then((d: any) => { if (alive) { setWork(d.work); setLiked(!!d.work.liked); setLikes(d.work.likes) } })
      .catch(() => { if (alive) flash('加载失败，请重试') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [id])

  if (loading || !work) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <span className="w-10 h-10 rounded-full border-4 border-pink/30 border-t-pink animate-spin" />
      </div>
    )
  }

  const g = work.grid || parse(SPRITES[work.sprite])
  const stats = countColors(g)
  const toggle = async () => {
    const next = !liked
    setLiked(next); setLikes((n) => n + (next ? 1 : -1))
    try { await api.toggleFavorite(id) } catch { setLiked(!next); setLikes((n) => n + (next ? -1 : 1)) }
  }
  const doExport = (e: any) => { flash(`已保存「${e.k}」到本地`); api.addExport({ sprite: work.sprite, name: work.title, type: e.k }).catch(() => {}) }

  return (
    <div className="min-h-full pb-28 relative">
      <div className="bg-grad-soft pt-12 pb-8 px-5 rounded-b-[32px]">
        <div className="flex justify-between">
          <button onClick={() => go(back ?? { name: 'home' })} className="w-9 h-9 rounded-full bg-white text-pink-deep flex items-center justify-center shadow-soft"><Icon name="back" size={18} /></button>
          <button onClick={() => flash('分享链接已复制')} className="w-9 h-9 rounded-full bg-white text-pink-deep flex items-center justify-center shadow-soft"><Icon name="share" size={17} /></button>
        </div>
        <div className="w-60 mx-auto mt-4 bg-white rounded-[24px] p-5 shadow-lift"><PixelArt grid={g} /></div>
      </div>
      <div className="px-5 mt-5">
        <div className="flex items-start justify-between gap-3">
          <div><h1 className="text-xl font-black">{work.title}</h1><p className="text-xs text-sub mt-1">@{work.author} · {work.size} · {stats.length} 色 · {g.flat().filter(Boolean).length} 颗</p></div>
          <button onClick={toggle} className={`shrink-0 flex flex-col items-center text-[11px] font-bold ${liked ? 'text-pink-deep' : 'text-sub'}`}><Icon name="heart" size={24} fill={liked ? '#EC5C86' : 'none'} />{likes}</button>
        </div>
        <h3 className="font-black mt-5 mb-2">用料清单</h3>
        <div className="grid grid-cols-2 gap-2">
          {stats.map(([c, n]) => (
            <div key={c} className="flex items-center gap-2 bg-white border border-line rounded-2xl p-2.5"><i className="w-6 h-6 rounded-full border border-black/5" style={{ background: bead(c).hex }} /><span className="text-xs font-black">{c}</span><span className="text-xs text-sub">{bead(c).name}</span><span className="ml-auto text-xs font-bold">×{n}</span></div>
          ))}
        </div>
        <h3 className="font-black mt-5 mb-2">导出</h3>
        <div className="grid grid-cols-4 gap-2">
          {EXPORTS.map((e) => (
            <button key={e.k} onClick={() => doExport(e)} className="flex flex-col items-center gap-1.5">
              <span className={`w-14 h-14 rounded-[18px] ${e.bg} flex items-center justify-center text-ink`}><Icon name={e.icon} size={22} /></span>
              <span className="text-[11px] font-bold text-sub">{e.k}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 bg-butter/40 rounded-2xl p-3 text-xs font-bold text-[#A9762B]"><Icon name="crown" size={18} />会员解锁无水印、批量导出与 102×102 超大画布</div>
      </div>
      <div className="absolute bottom-0 inset-x-0 bg-white border-t border-line p-4 pb-6 flex gap-3">
        <button onClick={() => go({ name: 'compare', sprite: work.sprite, title: work.title })} className="flex-1 h-12 rounded-2xl bg-blush text-pink-deep font-black">开始拼豆</button>
        <button onClick={() => go({ name: 'editor', sprite: work.sprite, grid: g, title: work.title })} className="flex-[1.4] h-12 rounded-2xl bg-grad-pink text-white font-black shadow-lift flex items-center justify-center gap-1.5"><Icon name="copy" size={18} />一键复刻</button>
      </div>
      {msg && <div className="absolute left-1/2 -translate-x-1/2 bottom-28 bg-ink/90 text-white text-sm font-bold px-4 py-2.5 rounded-2xl whitespace-nowrap">{msg}</div>}
    </div>
  )
}
