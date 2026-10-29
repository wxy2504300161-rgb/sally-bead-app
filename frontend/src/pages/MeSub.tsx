import { useEffect, useState, type ReactNode } from 'react'
import { Icon } from '../Icons'
import { PixelArt } from '../Pixel'
import { SPRITES, parse, countColors, PALETTE } from '../data'
import { api } from '../api'
import type { Route } from '../App'

type Go = (r: Route) => void
const BGS = ['bg-blush', 'bg-mint/50', 'bg-sky/50', 'bg-lilac/50', 'bg-butter/50']

/* ---------- 通用组件 ---------- */
function Bar({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 bg-white/90 backdrop-blur px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 flex items-center">
      <button onClick={onBack} className="relative z-10 w-9 h-9 rounded-full bg-blush text-pink-deep flex items-center justify-center"><Icon name="back" size={18} /></button>
      <h1 className="absolute inset-x-14 bottom-4 text-center font-black text-[17px] whitespace-nowrap pointer-events-none">{title}</h1>
      <div className="relative z-10 min-w-9 ml-auto flex justify-end">{right}</div>
    </header>
  )
}
function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mx-5 mt-4">
      {title && <h3 className="text-xs font-black text-sub mb-2 px-1">{title}</h3>}
      <div className="bg-white rounded-[20px] border border-line overflow-hidden divide-y divide-line">{children}</div>
    </section>
  )
}
function Row({ icon, bg = 'bg-blush', label, value, onClick, danger }: { icon?: string; bg?: string; label: string; value?: ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 h-14 text-left active:bg-blush/40 transition">
      {icon && <span className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}><Icon name={icon} size={17} /></span>}
      <span className={`text-sm font-bold ${danger ? 'text-pink-deep' : ''}`}>{label}</span>
      <span className="ml-auto text-xs text-sub truncate max-w-[45%]">{value}</span>
      {onClick && !danger && <Icon name="chevron" size={16} className="text-sub shrink-0" />}
    </button>
  )
}
function Switch({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <span role="switch" aria-checked={on} onClick={(e) => { e.stopPropagation(); onChange(!on) }}
      className={`w-11 h-6 rounded-full p-0.5 transition cursor-pointer ${on ? 'bg-grad-pink' : 'bg-line'}`}>
      <span className={`block w-5 h-5 rounded-full bg-white shadow-soft transition ${on ? 'translate-x-5' : ''}`} />
    </span>
  )
}
function ToggleRow({ label, desc, init = false, onChange }: { label: string; desc?: string; init?: boolean; onChange?: (v: boolean) => void }) {
  const [on, set] = useState(init)
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex-1"><p className="text-sm font-bold">{label}</p>{desc && <p className="text-[11px] text-sub mt-0.5">{desc}</p>}</div>
      <Switch on={on} onChange={(v) => { set(v); onChange?.(v) }} />
    </div>
  )
}
function Segment<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex bg-blush/60 rounded-full p-1">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`flex-1 h-8 rounded-full text-xs font-black transition ${value === o ? 'bg-white text-pink-deep shadow-soft' : 'text-sub'}`}>{o}</button>
      ))}
    </div>
  )
}
function Empty({ text }: { text: string }) {
  return <div className="py-16 text-center text-sm text-sub font-bold"><div className="w-16 h-16 mx-auto mb-3 rounded-[22px] bg-blush flex items-center justify-center text-pink-deep"><Icon name="star" size={26} /></div>{text}</div>
}
function useFlash() {
  const [msg, setMsg] = useState('')
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 1600) }
  return { msg, flash }
}
function fmtTime(ts?: number) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = Math.floor((now.getTime() - ts) / 86400000)
  if (diff <= 0) return '今天 ' + d.toTimeString().slice(0, 5)
  if (diff === 1) return '昨天'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/* ---------- 二级：编辑资料 ---------- */
function Profile({ back, flash }: { back: () => void; flash: (m: string) => void }) {
  const avatars = ['bunny', 'cat', 'frog', 'ghost', 'strawberry']
  const [av, setAv] = useState('bunny'); const [name, setName] = useState('豆豆酱'); const [bio, setBio] = useState('用一颗颗豆子拼出小确幸')
  useEffect(() => { api.me().then((d: any) => { const u = d.user; setAv(u.avatar || 'bunny'); setName(u.name); setBio(u.bio) }).catch(() => {}) }, [])
  const save = async () => {
    try { await api.updateMe({ name, bio, avatar: av }); flash('资料已保存'); back() }
    catch (e: any) { flash(e?.message || '保存失败') }
  }
  return (
    <>
      <Bar title="编辑资料" onBack={back} right={<button onClick={save} className="text-sm font-black text-pink-deep">保存</button>} />
      <div className="flex flex-col items-center mt-2">
        <div className="w-24 h-24 rounded-[28px] bg-white shadow-lift p-3"><PixelArt grid={parse(SPRITES[av])} /></div>
        <p className="text-xs text-sub font-bold mt-3">选择一个像素头像</p>
        <div className="flex gap-2 mt-3">
          {avatars.map((a) => <button key={a} onClick={() => setAv(a)} className={`w-12 h-12 rounded-2xl p-1.5 bg-white border-2 transition ${av === a ? 'border-pink' : 'border-line'}`}><PixelArt grid={parse(SPRITES[a])} /></button>)}
        </div>
      </div>
      <div className="mx-5 mt-6 space-y-3">
        <label className="block"><span className="text-xs font-black text-sub px-1">昵称</span>
          <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full h-12 px-4 rounded-2xl bg-blush/50 font-bold text-sm outline-none focus:ring-2 ring-pink" /></label>
        <label className="block"><span className="text-xs font-black text-sub px-1">个性签名</span>
          <textarea value={bio} maxLength={40} rows={3} onChange={(e) => setBio(e.target.value)} className="mt-1.5 w-full p-4 rounded-2xl bg-blush/50 font-bold text-sm outline-none resize-none focus:ring-2 ring-pink" />
          <span className="block text-right text-[11px] text-sub">{bio.length}/40</span></label>
      </div>
      <Group title="手作信息"><Row label="常用拼豆品牌" value="Artkal 2.6mm" /><Row label="所在城市" value="上海" /><Row label="开始拼豆" value="2024 年 3 月" /></Group>
    </>
  )
}

/* ---------- 二级：作品网格（我的作品 / 收藏） ---------- */
function WorkGrid({ title, kind, go, self, removable, flash }: { title: string; kind: 'works' | 'favorites'; go: Go; self: string; removable?: boolean; flash: (m: string) => void }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true; setLoading(true)
    ;(async () => {
      try {
        const me: any = await api.me()
        const src: any = kind === 'favorites' ? await api.favorites() : await api.listWorks({})
        const list: any[] = kind === 'favorites' ? (src.works || []) : (src.works || []).filter((w: any) => w.authorId === me.user.id)
        if (alive) setItems(list)
      } catch { if (alive) setItems([]) } finally { if (alive) setLoading(false) }
    })()
    return () => { alive = false }
  }, [kind])

  const tags = ['全部', ...Array.from(new Set(items.map((w) => w.tag)))]
  const [tag, setTag] = useState('全部')
  const shown = items.filter((w) => tag === '全部' || w.tag === tag)
  const removeFav = async (id: number) => { try { await api.toggleFavorite(id) } catch { /* ignore */ } setItems(items.filter((x) => x.id !== id)); flash('已取消收藏') }
  return (
    <>
      <Bar title={title} onBack={() => go({ name: 'me' })} right={<span className="text-xs font-bold text-sub">{items.length}</span>} />
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 pb-1">
        {tags.map((t) => <button key={t} onClick={() => setTag(t)} className={`shrink-0 h-8 px-3.5 rounded-full text-xs font-black transition ${tag === t ? 'bg-grad-pink text-white' : 'bg-blush/60 text-sub'}`}>{t}</button>)}
      </div>
      {loading ? <div className="py-20 flex justify-center"><span className="w-9 h-9 rounded-full border-4 border-pink/30 border-t-pink animate-spin" /></div>
        : shown.length === 0 ? <Empty text="这里还空空的" /> : (
          <div className="grid grid-cols-2 gap-3 px-5 mt-3">
            {shown.map((w, i) => (
              <div key={w.id} className="relative bg-white rounded-[20px] border border-line overflow-hidden">
                <button onClick={() => go({ name: 'detail', id: w.id, back: { name: 'me', path: self } })} className="block w-full text-left">
                  <div className={`${BGS[i % BGS.length]} p-4`}><PixelArt grid={w.grid || parse(SPRITES[w.sprite])} /></div>
                  <div className="p-3"><p className="text-sm font-black truncate">{w.title}</p>
                    <p className="text-[11px] text-sub mt-0.5 flex items-center gap-1">{w.size}<span className="ml-auto flex items-center gap-0.5"><Icon name="heart" size={12} />{w.likes}</span></p></div>
                </button>
                {removable && <button onClick={() => removeFav(w.id)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-pink-deep flex items-center justify-center shadow-soft"><Icon name="heart" size={14} fill="#EC5C86" /></button>}
              </div>
            ))}
          </div>
        )}
    </>
  )
}

/* ---------- 二级：草稿管理 ---------- */
function Drafts({ go, flash }: { go: Go; flash: (m: string) => void }) {
  const [list, setList] = useState<any[]>([])
  const [edit, setEdit] = useState(false); const [sel, setSel] = useState<number[]>([])
  useEffect(() => { api.listDrafts().then((d: any) => setList(d.drafts || [])).catch(() => {}) }, [])
  const toggle = (id: number) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id])
  return (
    <div className="min-h-full pb-28 relative">
      <Bar title="草稿管理" onBack={() => go({ name: 'me' })} right={list.length > 0 && <button onClick={() => { setEdit(!edit); setSel([]) }} className="text-sm font-black text-pink-deep">{edit ? '完成' : '管理'}</button>} />
      <div className="mx-5 rounded-2xl bg-sky/30 p-3 text-[11px] font-bold text-[#4A7FA8] flex items-center gap-2"><Icon name="alert" size={16} />草稿仅保存在本机，开通会员可云端同步</div>
      {list.length === 0 ? <Empty text="还没有草稿，去创作吧" /> : (
        <div className="px-5 mt-3 space-y-3">
          {list.map((d, i) => (
            <button key={d.id} onClick={() => edit ? toggle(d.id) : go({ name: 'editor', draftId: d.id, grid: d.grid, title: d.name })} className="w-full flex items-center gap-3 bg-white rounded-[20px] border border-line p-3 text-left">
              {edit && <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sel.includes(d.id) ? 'bg-grad-pink border-pink text-white' : 'border-line'}`}>{sel.includes(d.id) && <Icon name="check" size={12} />}</span>}
              <div className={`w-16 h-16 rounded-2xl p-2 ${BGS[(i + 1) % BGS.length]}`}><PixelArt grid={d.grid || parse(SPRITES[d.sprite])} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate">{d.name}</p><p className="text-[11px] text-sub mt-0.5">{fmtTime(d.updatedAt)}编辑 · {d.size}×{d.size}</p>
                <div className="mt-2 h-1.5 rounded-full bg-blush overflow-hidden"><div className="h-full bg-grad-pink rounded-full" style={{ width: `${d.progress || 0}%` }} /></div>
              </div>
              {!edit && <span className="text-xs font-black text-pink-deep">{d.progress || 0}%</span>}
            </button>
          ))}
        </div>
      )}
      {edit && (
        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-line p-4 pb-6 flex gap-3">
          <button onClick={() => setSel(sel.length === list.length ? [] : list.map((d) => d.id))} className="flex-1 h-12 rounded-2xl bg-blush text-pink-deep font-black">{sel.length === list.length ? '取消全选' : '全选'}</button>
          <button disabled={!sel.length} onClick={async () => { try { await Promise.all(sel.map((id) => api.deleteDraft(id))) } catch { /* ignore */ } setList(list.filter((d) => !sel.includes(d.id))); flash(`已删除 ${sel.length} 份草稿`); setSel([]); setEdit(false) }} className="flex-[1.4] h-12 rounded-2xl bg-grad-pink text-white font-black shadow-lift disabled:opacity-40">删除{sel.length ? `（${sel.length}）` : ''}</button>
        </div>
      )}
    </div>
  )
}

/* ---------- 二级/三级：导出记录 ---------- */
function Exports({ go }: { go: Go }) {
  const [list, setList] = useState<any[]>([])
  useEffect(() => { api.listExports().then((d: any) => setList(d.exports || [])).catch(() => {}) }, [])
  return (
    <>
      <Bar title="导出记录" onBack={() => go({ name: 'me' })} />
      <div className="px-5 space-y-3">
        {list.length === 0 ? <Empty text="还没有导出记录" /> : list.map((e, i) => (
          <button key={e.id} onClick={() => go({ name: 'me', path: `exports/${e.id}` })} className="w-full flex items-center gap-3 bg-white rounded-[20px] border border-line p-3 text-left">
            <div className={`w-14 h-14 rounded-2xl p-2 ${BGS[i % BGS.length]}`}><PixelArt grid={parse(SPRITES[e.sprite])} /></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-black truncate">{e.name}</p><p className="text-[11px] text-sub mt-0.5">{e.type} · {e.sizeLabel}</p></div>
            <span className="text-[11px] text-sub">{fmtTime(e.createdAt)}</span><Icon name="chevron" size={16} className="text-sub" />
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] text-sub mt-6">仅展示最近 30 天的导出记录</p>
    </>
  )
}
function ExportDetail({ id, go, flash }: { id: number; go: Go; flash: (m: string) => void }) {
  const [e, setE] = useState<any>(null)
  useEffect(() => { api.listExports().then((d: any) => setE((d.exports || []).find((x: any) => x.id === id) || null)).catch(() => {}) }, [id])
  if (!e) return <div className="py-20 flex justify-center"><span className="w-9 h-9 rounded-full border-4 border-pink/30 border-t-pink animate-spin" /></div>
  const g = parse(SPRITES[e.sprite]); const stats = countColors(g)
  return (
    <div className="min-h-full pb-28 relative">
      <Bar title="导出详情" onBack={() => go({ name: 'me', path: 'exports' })} />
      <div className="mx-5 bg-blush rounded-[24px] p-6"><div className="w-44 mx-auto bg-white rounded-[20px] p-4 shadow-lift"><PixelArt grid={g} /></div></div>
      <Group>
        <Row label="作品" value={e.name} /><Row label="导出格式" value={e.type} /><Row label="文件大小" value={e.sizeLabel} />
        <Row label="导出时间" value={fmtTime(e.createdAt)} /><Row label="尺寸 / 用色" value={`${g.length}×${g.length} · ${stats.length} 色`} /><Row label="水印" value="已添加（会员可去除）" />
      </Group>
      <div className="absolute bottom-0 inset-x-0 bg-white border-t border-line p-4 pb-6 flex gap-3">
        <button onClick={() => flash('分享链接已复制')} className="flex-1 h-12 rounded-2xl bg-blush text-pink-deep font-black flex items-center justify-center gap-1.5"><Icon name="share" size={17} />分享</button>
        <button onClick={() => flash('已重新保存到相册')} className="flex-[1.4] h-12 rounded-2xl bg-grad-pink text-white font-black shadow-lift flex items-center justify-center gap-1.5"><Icon name="download" size={18} />重新下载</button>
      </div>
    </div>
  )
}

/* ---------- 二级：拼豆记录 ---------- */
function History({ go }: { go: Go }) {
  const [list, setList] = useState<any[]>([])
  useEffect(() => { api.listHistory().then((d: any) => setList(d.history || [])).catch(() => {}) }, [])
  const beads = list.reduce((a, h) => a + (h.total || 0), 0)
  const minutes = list.reduce((a, h) => a + (h.minutes || 0), 0)
  return (
    <>
      <Bar title="拼豆记录" onBack={() => go({ name: 'me' })} />
      <div className="mx-5 grid grid-cols-3 rounded-[20px] bg-grad-soft py-3.5">
        {[{ n: list.length, l: '完成作品' }, { n: beads, l: '累计用豆' }, { n: minutes, l: '投入分钟' }].map((s) => (
          <div key={s.l} className="text-center"><p className="text-lg font-black text-pink-deep">{s.n}</p><p className="text-[11px] text-sub font-bold">{s.l}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 mt-4">
        {list.length === 0 ? <div className="col-span-2"><Empty text="还没有拼豆记录，去拼一个吧" /></div> : list.map((h, i) => (
          <div key={h.id} className="relative bg-white rounded-[20px] overflow-hidden border border-line">
            <div className={`${BGS[i % BGS.length]} p-4`}><PixelArt grid={parse(SPRITES[h.sprite])} /></div>
            <div className="p-3"><p className="text-sm font-black truncate">{h.title}</p><p className="text-[11px] text-sub mt-0.5">{fmtTime(h.createdAt)} · 用时 {h.minutes} 分钟</p></div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------- 二级：会员 ---------- */
const PLANS_FALLBACK = [
  { k: 'month', l: '连续包月', p: 12, o: 18, d: '次月 ¥12 自动续费' },
  { k: 'year', l: '年卡', p: 98, o: 216, d: '低至 ¥8.2/月', hot: true },
  { k: 'life', l: '永久会员', p: 198, o: 398, d: '一次买断' },
]
const PERKS = [
  { icon: 'canvas', l: '超大画布', d: '102×102' }, { icon: 'palette', l: '全品牌色卡', d: '600+ 色号' },
  { icon: 'cloud', l: '云端草稿', d: '多端同步' }, { icon: 'clean', l: '无水印导出', d: '高清原图' },
  { icon: 'magic', l: '智能配色', d: '一键优化' }, { icon: 'batch', l: '批量导出', d: '打包下载' },
]
const COMPARE = [['画布尺寸', '58×58', '102×102'], ['品牌色卡', '1 个', '全部'], ['草稿数量', '3 份', '无限'], ['导出水印', '有', '无']]
function PerkIcon({ name }: { name: string }) {
  const W = { stroke: '#fff', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  const art: Record<string, ReactNode> = {
    canvas: <><rect x="3" y="3" width="18" height="18" rx="5" fill="url(#vg)" /><path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17" {...W} strokeWidth={1.2} opacity=".85" /><rect x="9" y="9" width="6" height="6" fill="#fff" opacity=".9" /></>,
    palette: <><path d="M12 3a9 9 0 0 0 0 18c1.4 0 2-1 1.6-2.1-.5-1.3.3-2.4 1.7-2.4H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3z" fill="url(#vg)" /><circle cx="7.5" cy="11" r="1.5" fill="#fff" /><circle cx="10.5" cy="7.3" r="1.5" fill="#fff" /><circle cx="15" cy="7.8" r="1.5" fill="#fff" /></>,
    cloud: <><path d="M7 19a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.5a4.8 4.8 0 0 1-.5 9.5z" fill="url(#vg)" /><path d="M12 16v-5M9.8 13l2.2-2.2 2.2 2.2" {...W} /></>,
    clean: <><path d="M12 2.8l7 2.7v5.6c0 4.6-3 8.2-7 10.1-4-1.9-7-5.5-7-10.1V5.5z" fill="url(#vg)" /><path d="M8.8 12l2.2 2.2 4.4-4.6" {...W} strokeWidth={1.9} /></>,
    magic: <><path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6z" fill="url(#vg)" /><path d="M17.5 13l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" fill="url(#vg)" /><circle cx="18" cy="5" r="1.3" fill="url(#vg)" /></>,
    batch: <><rect x="6.5" y="3" width="14.5" height="12" rx="3.5" fill="url(#vg)" opacity=".45" /><rect x="3" y="7.5" width="14.5" height="13" rx="3.5" fill="url(#vg)" /><path d="M10.2 11v6M7.6 14.6l2.6 2.6 2.6-2.6" {...W} /></>,
  }
  return (
    <svg width="26" height="26" viewBox="0 0 24 24">
      <defs><linearGradient id="vg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F9D78C" /><stop offset=".55" stopColor="#E9B04F" /><stop offset="1" stopColor="#D08A2E" /></linearGradient></defs>
      {art[name]}
    </svg>
  )
}
function Vip({ go, flash }: { go: Go; flash: (m: string) => void }) {
  const [plans, setPlans] = useState<any[]>(PLANS_FALLBACK)
  const [membership, setMembership] = useState<any>(null)
  const [plan, setPlan] = useState('year'); const [sheet, setSheet] = useState(false); const [agree, setAgree] = useState(true)
  useEffect(() => { api.plans().then((d: any) => setPlans(d.plans || PLANS_FALLBACK)).catch(() => {}); api.membership().then((d: any) => setMembership(d.membership || null)).catch(() => {}) }, [])
  const cur = plans.find((p) => p.k === plan) || plans[0]
  const subscribe = async () => {
    try { const r: any = await api.subscribe(plan); setMembership(r.membership); setSheet(false); flash('会员已开通（演示支付）') }
    catch (e: any) { flash(e?.message || '开通失败') }
  }
  return (
    <div className="min-h-full pb-36 relative bg-[#FFFAF2]">
      <Bar title="豆粒会员" onBack={() => go({ name: 'me' })} />
      <div className="mx-5 relative overflow-hidden rounded-[24px] p-5 text-[#6B4512] shadow-[0_12px_28px_rgba(208,138,46,.28)]" style={{ background: 'linear-gradient(135deg, #FFF1D2 0%, #F7D28C 48%, #E9B35A 100%)' }}>
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/25" />
        <div className="absolute right-6 bottom-[-30px] w-24 h-24 rounded-full bg-white/20" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/80 p-1.5 shadow-soft"><PixelArt grid={parse(SPRITES.bunny)} /></div>
          <div><p className="font-black">豆豆酱</p><p className="text-[11px] font-bold opacity-70">{membership?.active ? '会员生效中 · 6 项特权已解锁' : '尚未开通 · 开通后立享 6 项特权'}</p></div>
        </div>
        <div className="relative mt-6 flex items-end justify-between">
          <div><p className="text-[11px] font-black tracking-[.3em] opacity-60">BEAN PLUS</p><p className="text-2xl font-black mt-0.5 flex items-center gap-1.5"><Icon name="crown" size={22} />豆粒会员</p></div>
          <span className="text-[11px] font-black bg-white/60 rounded-full px-2.5 h-6 flex items-center">已有 2.3 万人开通</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2.5 px-5 mt-6">
        {plans.map((p) => {
          const on = plan === p.k
          return (
            <button key={p.k} onClick={() => setPlan(p.k)} className={`relative rounded-[20px] pt-5 pb-3.5 text-center transition border-2 ${on ? 'border-[#E9B04F] bg-gradient-to-b from-[#FFF4DC] to-white shadow-[0_8px_18px_rgba(233,176,79,.25)]' : 'border-transparent bg-white shadow-soft'}`}>
              {p.hot && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-grad-pink text-white text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap">最受欢迎</span>}
              <p className="text-xs font-black text-sub">{p.l}</p>
              <p className={`text-[26px] font-black mt-1 leading-none ${on ? 'text-[#B9781F]' : ''}`}><span className="text-sm">¥</span>{p.p}</p>
              <p className="text-[11px] text-sub line-through mt-1">¥{p.o}</p>
              <p className={`mx-2 mt-2 rounded-full text-[10px] font-black py-0.5 ${on ? 'bg-[#FBE7BE] text-[#B9781F]' : 'bg-line/70 text-sub'}`}>{p.d}</p>
            </button>
          )
        })}
      </div>
      <div className="mx-5 mt-6 flex items-center gap-2"><span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E9C98E]" /><h3 className="font-black text-[#7A5418]">会员专属特权</h3><span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E9C98E]" /></div>
      <div className="mx-5 mt-3 grid grid-cols-3 gap-2.5">
        {PERKS.map((p) => (
          <div key={p.l} className="bg-white rounded-[20px] py-4 flex flex-col items-center shadow-soft">
            <span className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-b from-[#FFF6E2] to-[#FDE9C2] ring-1 ring-[#F5DBA6]"><PerkIcon name={p.icon} /></span>
            <span className="text-xs font-black mt-2">{p.l}</span><span className="text-[10px] text-sub font-bold mt-0.5">{p.d}</span>
          </div>
        ))}
      </div>
      <div className="mx-5 mt-5 bg-white rounded-[20px] shadow-soft overflow-hidden text-xs">
        <div className="grid grid-cols-3 h-10 items-center font-black text-sub bg-[#FFF6E5]"><span className="pl-4">权益对比</span><span className="text-center">免费版</span><span className="text-center text-[#B9781F]">会员</span></div>
        {COMPARE.map(([k, a, v]) => (
          <div key={k} className="grid grid-cols-3 h-11 items-center border-t border-line"><span className="pl-4 font-bold">{k}</span><span className="text-center text-sub">{a}</span><span className="text-center font-black text-[#B9781F]">{v}</span></div>
        ))}
      </div>
      <div className="fixed z-20 bottom-0 left-1/2 -translate-x-1/2 w-full sm:w-[390px] bg-white/95 backdrop-blur border-t border-line px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:rounded-b-[36px] shadow-[0_-8px_24px_rgba(100,70,30,.08)]">
        {membership?.active ? (
          <button onClick={() => go({ name: 'me' })} className="w-full h-12 rounded-2xl bg-grad-pink text-white font-black shadow-lift">会员已开通</button>
        ) : (
          <>
            <button onClick={() => agree ? setSheet(true) : flash('请先阅读并同意会员协议')} className="w-full h-12 rounded-2xl text-[#5A3A0E] font-black shadow-[0_8px_20px_rgba(208,138,46,.35)] flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #FBE0A0, #EBB656 60%, #DC9A3C)' }}>
              立即开通 · ¥{cur?.p}<span className="text-xs font-bold opacity-60 line-through">¥{cur?.o}</span>
            </button>
            <button onClick={() => setAgree(!agree)} className="mt-2.5 mx-auto flex items-center gap-1.5 text-[11px] text-sub font-bold">
              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${agree ? 'bg-[#E9B04F] text-white' : 'border border-sub/50'}`}>{agree && <Icon name="check" size={9} strokeWidth={3.5} />}</span>
              已阅读并同意《会员服务协议》《自动续费协议》
            </button>
          </>
        )}
      </div>
      {sheet && (
        <div className="absolute inset-0 bg-ink/40 flex items-end z-20 animate-[fade_.2s_ease-out]" onClick={() => setSheet(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full bg-white rounded-t-[28px] p-5 pb-8">
            <div className="w-10 h-1 rounded-full bg-line mx-auto mb-4" />
            <h3 className="font-black text-center">确认支付</h3><p className="text-center text-3xl font-black mt-3 text-[#B9781F]"><span className="text-base">¥</span>{cur.p}</p>
            <p className="text-center text-xs text-sub mt-1">豆粒会员 · {cur.l}</p>
            <div className="mt-4 rounded-2xl border border-line divide-y divide-line">
              {['微信支付', '支付宝'].map((m, i) => <div key={m} className="flex items-center px-4 h-12 text-sm font-bold">{m}<span className={`ml-auto w-5 h-5 rounded-full border-2 ${i === 0 ? 'border-[#E9B04F] bg-[#E9B04F]' : 'border-line'}`} /></div>)}
            </div>
            <button onClick={subscribe} className="mt-4 w-full h-12 rounded-2xl text-[#5A3A0E] font-black" style={{ background: 'linear-gradient(135deg, #FBE0A0, #EBB656 60%, #DC9A3C)' }}>确认支付</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- 二级：设置 ---------- */
function Settings({ go, flash }: { go: Go; flash: (m: string) => void }) {
  const [cache, setCache] = useState('23.6 MB'); const to = (p: string) => () => go({ name: 'me', path: `settings/${p}` })
  const [settings, setSettings] = useState<any>(null)
  useEffect(() => { api.getSettings().then((d: any) => setSettings(d.settings || {})).catch(() => {}) }, [])
  return (
    <div className="pb-8">
      <Bar title="设置" onBack={() => go({ name: 'me' })} />
      <Group title="账号"><Row icon="user" label="账号与安全" value="138****6688" onClick={to('account')} /><Row icon="lock" bg="bg-lilac/50" label="隐私设置" onClick={to('privacy')} /></Group>
      <Group title="创作"><Row icon="grid" bg="bg-sky/50" label="画布偏好" value={settings?.canvasSize || '29×29'} onClick={to('canvas')} /><Row icon="star" bg="bg-butter/50" label="拼豆品牌与色卡" value={settings?.brand || 'Artkal'} onClick={to('brand')} /></Group>
      <Group title="通用">
        <Row icon="alert" bg="bg-mint/50" label="消息通知" onClick={to('notify')} />
        <Row icon="box" bg="bg-line" label="清除缓存" value={cache} onClick={() => { setCache('0 B'); flash('缓存已清除') }} />
        <Row icon="heart" label="关于小豆像素" value="v0.3.0" onClick={to('about')} />
      </Group>
      <Group><Row label="退出登录" danger onClick={() => flash('原型演示：已模拟退出')} /></Group>
    </div>
  )
}

/* ---------- 三级：设置子页 ---------- */
function Account({ back, flash }: { back: () => void; flash: (m: string) => void }) {
  const [phone, setPhone] = useState('138****6688')
  useEffect(() => { api.me().then((d: any) => { setPhone(d.user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')) }).catch(() => {}) }, [])
  return (<><Bar title="账号与安全" onBack={back} />
    <Group><Row label="手机号" value={phone} onClick={() => flash('原型演示：换绑手机')} /><Row label="登录密码" value="已设置" onClick={() => flash('原型演示：修改密码') } /></Group>
    <Group title="第三方绑定"><Row label="微信" value="已绑定" /><Row label="QQ" value="未绑定" onClick={() => flash('原型演示：绑定 QQ')} /><Row label="Apple ID" value="未绑定" onClick={() => flash('原型演示：绑定 Apple')} /></Group>
    <Group><Row label="注销账号" danger onClick={() => flash('注销需人工审核，请联系客服')} /></Group></>)
}
function Privacy({ back }: { back: () => void }) {
  const [s, setS] = useState<any>({})
  useEffect(() => { api.getSettings().then((d: any) => setS(d.settings?.privacy || {})).catch(() => {}) }, [])
  const set = (k: string, v: boolean) => { const next = { ...s, [k]: v }; setS(next); api.updateSettings({ privacy: next }).catch(() => {}) }
  return (<><Bar title="隐私设置" onBack={back} />
    <Group title="社区"><ToggleRow label="作品允许被复刻" desc="他人可一键复刻你公开的图纸" init={s.allowReplicate ?? true} onChange={(v) => set('allowReplicate', v)} /><ToggleRow label="展示我的收藏" desc="在个人主页公开收藏列表" init={s.showFavorites ?? false} onChange={(v) => set('showFavorites', v)} /><ToggleRow label="允许陌生人私信" init={s.allowStrangerDM ?? true} onChange={(v) => set('allowStrangerDM', v)} /></Group>
    <Group title="个性化"><ToggleRow label="个性化推荐" desc="根据你的创作偏好推荐灵感" init={s.personalized ?? true} onChange={(v) => set('personalized', v)} /></Group></>)
}
function Canvas({ back }: { back: () => void }) {
  const [size, setSize] = useState<'15×15' | '29×29' | '58×58'>('29×29'); const [bead, setBead] = useState<'2.6mm' | '5mm'>('2.6mm')
  useEffect(() => { api.getSettings().then((d: any) => { const s = d.settings || {}; if (s.canvasSize) setSize(s.canvasSize); if (s.beadSpec) setBead(s.beadSpec) }).catch(() => {}) }, [])
  const persist = (patch: any) => api.updateSettings(patch).catch(() => {})
  return (<><Bar title="画布偏好" onBack={back} />
    <section className="mx-5 mt-2 bg-white rounded-[20px] border border-line p-4 space-y-4">
      <div><p className="text-sm font-black mb-2">默认画布尺寸</p><Segment options={['15×15', '29×29', '58×58'] as any} value={size} onChange={(v) => { setSize(v as any); persist({ canvasSize: v }) }} /></div>
      <div><p className="text-sm font-black mb-2">豆子规格</p><Segment options={['2.6mm', '5mm'] as any} value={bead} onChange={(v) => { setBead(v as any); persist({ beadSpec: v }) }} /></div>
      <div className="flex items-center justify-between rounded-2xl bg-butter/40 px-3 py-2.5 text-xs font-bold text-[#A9762B]"><span className="flex items-center gap-1.5"><Icon name="crown" size={15} />102×102 超大画布</span><span>会员专享</span></div>
    </section>
    <Group title="编辑器"><ToggleRow label="默认显示网格线" init onChange={() => {}} /><ToggleRow label="每 5 格加粗分隔" init onChange={() => {}} /><ToggleRow label="自动镜像对称" onChange={() => {}} /><ToggleRow label="退出时自动保存草稿" init onChange={() => {}} /></Group></>)
}
function Brand({ back, flash }: { back: () => void; flash: (m: string) => void }) {
  const brands = [{ k: 'Artkal', d: '国产 · 2.6mm / 5mm', n: 204 }, { k: 'Perler', d: '美国 · 5mm', n: 98 }, { k: 'Hama', d: '丹麦 · 2.5mm / 5mm', n: 72 }, { k: 'MARD', d: '国产 · 2.6mm', n: 221, vip: true }]
  const [sel, setSel] = useState('Artkal')
  useEffect(() => { api.getSettings().then((d: any) => { if (d.settings?.brand) setSel(d.settings.brand) }).catch(() => {}) }, [])
  return (<><Bar title="拼豆品牌与色卡" onBack={back} />
    <div className="px-5 space-y-2.5">
      {brands.map((b) => (
        <button key={b.k} onClick={() => b.vip ? flash('该色卡为会员专享') : (setSel(b.k), api.updateSettings({ brand: b.k }).catch(() => {}))} className={`w-full flex items-center gap-3 rounded-[20px] border-2 p-3.5 text-left transition ${sel === b.k ? 'border-pink bg-blush/40' : 'border-line bg-white'}`}>
          <div className="flex-1"><p className="text-sm font-black flex items-center gap-1.5">{b.k}{b.vip && <span className="text-[10px] bg-butter text-[#A9762B] px-1.5 rounded-full">会员</span>}</p><p className="text-[11px] text-sub mt-0.5">{b.d} · {b.n} 色</p></div>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center ${sel === b.k ? 'bg-grad-pink text-white' : 'border-2 border-line'}`}>{sel === b.k && <Icon name="check" size={12} />}</span>
        </button>
      ))}
    </div>
    <h3 className="px-5 mt-5 mb-2 text-xs font-black text-sub">{sel} 色卡预览</h3>
    <div className="mx-5 grid grid-cols-7 gap-2 bg-white rounded-[20px] border border-line p-4">
      {PALETTE.map((c) => <div key={c.code} className="flex flex-col items-center gap-1"><i className="w-8 h-8 rounded-full border border-black/5" style={{ background: c.hex }} /><span className="text-[9px] font-bold text-sub">{c.code}</span></div>)}
    </div></>)
}
function Notify({ back }: { back: () => void }) {
  const [s, setS] = useState<any>({})
  useEffect(() => { api.getSettings().then((d: any) => setS(d.settings?.notify || {})).catch(() => {}) }, [])
  const set = (k: string, v: boolean) => { const next = { ...s, [k]: v }; setS(next); api.updateSettings({ notify: next }).catch(() => {}) }
  return (<><Bar title="消息通知" onBack={back} />
    <Group title="互动"><ToggleRow label="点赞与收藏" init={s.like ?? true} onChange={(v) => set('like', v)} /><ToggleRow label="评论与回复" init={s.comment ?? true} onChange={(v) => set('comment', v)} /><ToggleRow label="新粉丝" init={s.follower ?? true} onChange={(v) => set('follower', v)} /></Group>
    <Group title="提醒"><ToggleRow label="豆子库存不足提醒" desc="库存低于预警值时通知你" init={s.lowStock ?? true} onChange={(v) => set('lowStock', v)} /><ToggleRow label="每周灵感精选" init={s.weekly ?? false} onChange={(v) => set('weekly', v)} /><ToggleRow label="活动与福利" init={s.activity ?? false} onChange={(v) => set('activity', v)} /></Group></>)
}
function About({ back, flash }: { back: () => void; flash: (m: string) => void }) {
  return (<><Bar title="关于小豆像素" onBack={back} />
    <div className="flex flex-col items-center mt-4">
      <div className="w-20 h-20 rounded-[24px] bg-blush p-3 shadow-lift"><PixelArt grid={parse(SPRITES.heart)} /></div>
      <p className="font-black text-lg mt-3">小豆像素</p><p className="text-xs text-sub font-bold">v0.3.0 · 一颗豆子一份快乐</p>
    </div>
    <Group><Row label="检查更新" value="已是最新" onClick={() => flash('已是最新版本')} /><Row label="帮助与反馈" onClick={() => flash('原型演示：反馈入口')} /><Row label="给我们评分" onClick={() => flash('谢谢你的喜欢')} /><Row label="用户协议" onClick={() => flash('原型演示：用户协议')} /><Row label="隐私政策" onClick={() => flash('原型演示：隐私政策')} /></Group></>)
}

/* ---------- 路由分发 ---------- */
export default function MeSub({ path, go }: { path: string; go: Go }) {
  const { msg, flash } = useFlash()
  const [a, b] = path.split('/')
  const toMe = () => go({ name: 'me' }); const toSettings = () => go({ name: 'me', path: 'settings' })
  let body: ReactNode
  switch (a) {
    case 'profile': body = <Profile back={toMe} flash={flash} />; break
    case 'drafts': body = <Drafts go={go} flash={flash} />; break
    case 'works': body = <WorkGrid title="我的作品" kind="works" self="works" go={go} flash={flash} />; break
    case 'favorites': body = <WorkGrid title="收藏图纸" kind="favorites" self="favorites" removable go={go} flash={flash} />; break
    case 'exports': body = b ? <ExportDetail id={+b} go={go} flash={flash} /> : <Exports go={go} />; break
    case 'history': body = <History go={go} />; break
    case 'vip': body = <Vip go={go} flash={flash} />; break
    case 'settings': {
      const p = { back: toSettings, flash }
      body = b === 'account' ? <Account {...p} /> : b === 'privacy' ? <Privacy back={toSettings} />
        : b === 'canvas' ? <Canvas back={toSettings} /> : b === 'brand' ? <Brand {...p} />
        : b === 'notify' ? <Notify back={toSettings} /> : b === 'about' ? <About {...p} />
        : <Settings go={go} flash={flash} />
      break
    }
    default: body = <Settings go={go} flash={flash} />
  }
  return (
    <div className="min-h-full pb-6 relative">
      {body}
      {msg && <div className="fixed sm:absolute left-1/2 -translate-x-1/2 bottom-28 z-30 bg-ink/90 text-white text-sm font-bold px-4 py-2.5 rounded-2xl whitespace-nowrap">{msg}</div>}
    </div>
  )
}
