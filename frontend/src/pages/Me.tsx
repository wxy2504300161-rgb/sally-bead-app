import { useEffect, useState } from 'react'
import { Icon } from '../Icons'
import { PixelArt } from '../Pixel'
import { SPRITES, parse } from '../data'
import { api } from '../api'
import type { Route } from '../App'
import MeSub from './MeSub'

const ROWS = [
  { icon: 'image', l: '我的作品', p: 'works' },
  { icon: 'check', l: '拼豆记录', p: 'history' },
  { icon: 'heart', l: '收藏图纸', p: 'favorites' }, { icon: 'download', l: '导出记录', p: 'exports' },
  { icon: 'gear', l: '设置', p: 'settings' },
]

export default function Me({ go, path }: { go: (r: Route) => void; path?: string }) {
  if (path) return <MeSub path={path} go={go} />
  const to = (p: string) => () => go({ name: 'me', path: p })

  const [user, setUser] = useState<any>(null)
  const [myWorks, setMyWorks] = useState<any[]>([])
  const [favList, setFavList] = useState<any[]>([])
  const [drafts, setDrafts] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [membership, setMembership] = useState<any>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const me: any = await api.me(); if (!alive) return
        setUser(me.user)
        const [works, fav, dr, hi, mem] = await Promise.all([
          api.listWorks({}), api.favorites(), api.listDrafts(), api.listHistory(), api.membership(),
        ])
        if (!alive) return
        const all: any[] = works.works || []
        setMyWorks(all.filter((w) => w.authorId === me.user.id))
        setFavList(fav.works || [])
        setDrafts(dr.drafts || [])
        setHistory(hi.history || [])
        setMembership(mem.membership)
      } catch (e) { /* 离线兜底 */ }
    })()
    return () => { alive = false }
  }, [])

  const totalLikes = myWorks.reduce((a, w) => a + (w.likes || 0), 0)
  const STATS = [
    { n: myWorks.length || 12, l: '作品', p: 'works' },
    { n: favList.length || 86, l: '收藏', p: 'favorites' },
    { n: (totalLikes / 1000).toFixed(1), l: '获赞(k)', p: 'works' },
  ]

  return (
    <div className="pb-6">
      <header className="bg-gradient-to-b from-[#FFCFDD] via-blush to-white px-5 pt-14 pb-5">
        <button onClick={to('profile')} className="w-full flex items-center gap-4 text-left">
          <div className="w-16 h-16 rounded-[20px] bg-white shadow-soft p-2"><PixelArt grid={parse(SPRITES[user?.avatar || 'bunny'])} /></div>
          <div><h1 className="text-xl font-black">{user?.name || '豆豆酱'}</h1><p className="text-xs text-sub font-bold">拼豆第 {user?.days || 128} 天 · Lv.{user?.level || 4} {user?.levelName || '拼豆达人'}</p></div>
          <span className="ml-auto flex items-center text-xs font-bold text-sub">编辑资料<Icon name="chevron" size={14} /></span>
        </button>
        <div className="grid grid-cols-3 mt-5 bg-white rounded-[20px] shadow-soft py-3">
          {STATS.map((s) => <button key={s.l} onClick={to(s.p)} className="text-center"><p className="text-lg font-black">{s.n}</p><p className="text-[11px] text-sub font-bold">{s.l}</p></button>)}
        </div>
      </header>
      <div className="mx-5 rounded-[20px] bg-gradient-to-r from-[#FFE2B0] to-butter p-4 flex items-center gap-3">
        <span className="w-10 h-10 rounded-2xl bg-white/70 text-[#A9762B] flex items-center justify-center"><Icon name="crown" size={20} /></span>
        <div className="flex-1"><p className="font-black text-[#7A5418]">{membership?.active ? '豆粒会员 · 已开通' : '开通豆粒会员'}</p><p className="text-[11px] text-[#A9762B] font-bold">102×102 画布 · 全品牌色卡 · 云端草稿</p></div>
        <button onClick={to('vip')} className="h-8 px-3.5 rounded-full bg-white text-[#A9762B] text-xs font-black">{membership?.active ? '管理' : '¥12/月'}</button>
      </div>
      <div className="px-5 mt-5 mb-2 flex items-center"><h3 className="font-black">最近草稿</h3><button onClick={to('drafts')} className="ml-auto text-xs font-bold text-sub flex items-center">全部<Icon name="chevron" size={14} /></button></div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-5">
        {(drafts.length ? drafts : [{ sprite: 'frog' }, { sprite: 'cloud' }, { sprite: 'ghost' }]).slice(0, 3).map((d: any, i) => (
          <button key={d.id ?? d.sprite} onClick={() => d.id ? go({ name: 'editor', draftId: d.id, grid: d.grid, title: d.name }) : go({ name: 'editor', sprite: d.sprite })} className={`shrink-0 w-28 rounded-[18px] p-3 ${['bg-mint/50', 'bg-sky/50', 'bg-lilac/50'][i]}`}><PixelArt grid={parse(SPRITES[d.sprite])} /><p className="text-[11px] font-bold text-sub mt-2">{d.name || `${i + 1} 天前编辑`}</p></button>
        ))}
      </div>
      <div className="mx-5 mt-5 bg-white rounded-[20px] border border-line overflow-hidden">
        {ROWS.map((r, i) => (
          <button key={r.l} onClick={to(r.p)} className={`w-full flex items-center gap-3 px-4 h-14 ${i ? 'border-t border-line' : ''}`}>
            <span className={`w-8 h-8 rounded-xl ${['bg-sky/50', 'bg-butter/50', 'bg-lilac/50', 'bg-mint/50', 'bg-line'][i]} flex items-center justify-center`}><Icon name={r.icon} size={17} /></span>
            <span className="text-sm font-bold">{r.l}</span>
            <span className="ml-auto text-xs text-sub">
              {r.p === 'works' ? myWorks.length || 12 : r.p === 'favorites' ? favList.length || 86 : r.p === 'history' ? `${history.length || 4} 件` : ''}
            </span>
            <Icon name="chevron" size={16} className="text-sub" />
          </button>
        ))}
      </div>
    </div>
  )
}
