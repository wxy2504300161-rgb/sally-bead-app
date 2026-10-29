import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icons'
import { PALETTE, countColors } from '../data'
import { api } from '../api'

export default function Inventory() {
  const [stock, setStock] = useState<Record<string, number>>({})
  const [works, setWorks] = useState<any[]>([])
  const [workId, setWorkId] = useState<number>(1)
  const [toast, setToast] = useState('')
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1800) }

  useEffect(() => {
    api.getInventory().then((d: any) => setStock(d.stock || {})).catch(() => {})
    api.listWorks({}).then((d: any) => setWorks(d.works || [])).catch(() => {})
  }, [])

  const w = works.find((x) => x.id === workId) || works[0]
  const need = useMemo(() => (w ? Object.fromEntries(countColors(w.grid || [])) : {}), [w])
  const short = Object.entries(need).filter(([c, n]) => (stock[c] ?? 0) < n)

  const deduct = async () => {
    if (short.length) return flash('库存不足，先补货再扣减哦')
    try {
      const r: any = await api.deductInventory(need)
      if (r.ok) { setStock(r.stock); flash('已扣减本图纸用量') }
      else flash('库存不足，先补货再扣减哦')
    } catch (e) { flash('扣减失败，请重试') }
  }

  const adjust = async (code: string, delta: number) => {
    try {
      const r: any = await api.adjustInventory(code, delta)
      setStock(r.stock)
    } catch { flash('操作失败') }
  }
  const setQty = async (code: string, q: number) => {
    const v = Math.max(0, q)
    setStock((s) => ({ ...s, [code]: v }))
    try { const r: any = await api.setInventory(code, v); setStock(r.stock) } catch { /* ignore */ }
  }

  const purchaseShort = short.length
    ? `已导出采购清单（${short.length} 色）`
    : '库存充足，无需补货'

  return (
    <div className="pb-6 relative">
      <header className="px-5 pt-12 pb-3 flex items-center justify-between">
        <div><h1 className="text-[26px] font-black">豆仓</h1><p className="text-xs text-sub font-bold">MARD 色卡 · 共 {Object.values(stock).reduce((a, b) => a + b, 0)} 颗</p></div>
        <button onClick={() => flash(purchaseShort)} className="h-10 px-4 rounded-2xl bg-grad-pink text-white text-sm font-black shadow-soft flex items-center gap-1.5"><Icon name="cart" size={17} />采购清单</button>
      </header>

      <section className="mx-5 rounded-[20px] bg-gradient-to-br from-lilac/70 to-sky/60 p-4">
        <p className="text-xs font-black text-[#5B4A8A]">导入图纸对比库存</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-2.5">
          {works.slice(0, 6).map((x) => (
            <button key={x.id} onClick={() => setWorkId(x.id)} className={`shrink-0 px-3 h-8 rounded-full text-xs font-bold ${workId === x.id ? 'bg-white text-ink shadow-soft' : 'bg-white/40 text-[#5B4A8A]'}`}>{x.title}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 bg-white/80 rounded-2xl p-3">
          {short.length ? (
            <><span className="w-9 h-9 rounded-full bg-[#FFE1E1] text-[#E5484D] flex items-center justify-center"><Icon name="alert" size={18} /></span>
              <div className="flex-1"><p className="text-sm font-black text-[#E5484D]">缺 {short.length} 种颜色</p><p className="text-[11px] text-sub">{short.map(([c]) => c).join('、')} 库存不足</p></div></>
          ) : (
            <><span className="w-9 h-9 rounded-full bg-mint text-[#3E9C74] flex items-center justify-center"><Icon name="check" size={18} /></span>
              <div className="flex-1"><p className="text-sm font-black">库存充足，可以开拼</p><p className="text-[11px] text-sub">共需 {Object.values(need).reduce((a, b) => a + b, 0)} 颗</p></div></>
          )}
          <button onClick={deduct} className="h-8 px-3 rounded-xl bg-ink text-white text-xs font-bold">拼完扣减</button>
        </div>
      </section>

      <div className="px-5 mt-5 mb-2 flex items-center justify-between"><h3 className="font-black">色卡库存</h3><span className="text-[11px] text-sub">红色 = 本图纸缺色</span></div>
      <div className="px-5 flex flex-col gap-2">
        {PALETTE.map((p) => {
          const q = stock[p.code] ?? 0; const n = need[p.code]; const lack = n && q < n
          return (
            <div key={p.code} className={`flex items-center gap-3 p-3 rounded-[18px] border transition ${lack ? 'bg-[#FFF2F2] border-[#FFC9C9]' : 'bg-white border-line'}`}>
              <span className="w-11 h-11 rounded-[14px] border border-black/5 flex items-center justify-center" style={{ background: p.hex }}><i className="w-3 h-3 rounded-full bg-white/70" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black">{p.code} <span className="text-xs text-sub font-bold">{p.name}</span></p>
                <p className={`text-[11px] font-bold ${lack ? 'text-[#E5484D]' : 'text-sub'}`}>{n ? (lack ? `需 ${n} 颗 · 缺 ${n - q}` : `本图需 ${n} 颗`) : q === 0 ? '已用完' : '　'}</p>
              </div>
              <div className="flex items-center bg-line/70 rounded-xl h-9">
                <button onClick={() => adjust(p.code, -10)} className="w-8 h-9 flex items-center justify-center text-sub"><Icon name="minus" size={14} /></button>
                <input value={q} inputMode="numeric" onChange={(e) => setQty(p.code, Number(e.target.value.replace(/\D/g, '')) || 0)} className={`w-11 bg-transparent text-center text-sm font-black outline-none ${lack ? 'text-[#E5484D]' : ''}`} />
                <button onClick={() => adjust(p.code, 10)} className="w-8 h-9 flex items-center justify-center text-sub"><Icon name="plus" size={14} /></button>
              </div>
            </div>
          )
        })}
      </div>
      {toast && <div className="fixed sm:absolute left-1/2 -translate-x-1/2 bottom-28 bg-ink/90 text-white text-sm font-bold px-4 py-2.5 rounded-2xl">{toast}</div>}
    </div>
  )
}
