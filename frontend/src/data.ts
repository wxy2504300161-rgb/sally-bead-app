// 拼豆基础数据：色卡 / 图案 / 网格解析
// 与 backend + shared/bead-data.json 同源，避免颜色与模板漂移
import beadData from '../../shared/bead-data.json'

export type Bead = { code: string; name: string; hex: string }

export const PALETTE: Bead[] = beadData.palette as Bead[]
const KEY: Record<string, string> = beadData.key as Record<string, string>
export const SPRITES: Record<string, string[]> = beadData.sprites as Record<string, string[]>

export type Grid = (string | null)[][]
export const parse = (rows: string[]): Grid =>
  rows.map((r) => [...r].map((ch) => (ch === '.' ? null : KEY[ch])))

// 灵感广场初始作品（离线兜底；线上以接口返回为准）
export const WORKS = [
  { id: 1, title: '樱花小兔杯垫', author: '豆豆酱', sprite: 'bunny', likes: 2384, tag: '杯垫', size: '29×29', tall: true },
  { id: 2, title: '草莓甜心挂件', author: '小鹿手作', sprite: 'strawberry', likes: 1569, tag: '挂件', size: '15×15' },
  { id: 3, title: '橘猫午睡', author: '喵星人Lab', sprite: 'cat', likes: 982, tag: '动物', size: '29×29' },
  { id: 4, title: '粉粉爱心钥匙扣', author: '拼拼乐', sprite: 'heart', likes: 3120, tag: '节日', size: '15×15', tall: true },
  { id: 5, title: '晴天小云朵', author: '云朵工坊', sprite: 'cloud', likes: 744, tag: '挂件', size: '34×34' },
  { id: 6, title: '呱呱小青蛙', author: '绿豆糕', sprite: 'frog', likes: 1206, tag: '动物', size: '29×29', tall: true },
  { id: 7, title: '森林蘑菇', author: '像素森', sprite: 'mushroom', likes: 865, tag: '杯垫', size: '29×29' },
  { id: 8, title: '万圣小幽灵', author: '紫薯球', sprite: 'ghost', likes: 1433, tag: '节日', size: '15×15' },
]

export const countColors = (g: Grid) => {
  const m = new Map<string, number>()
  g.flat().forEach((c) => c && m.set(c, (m.get(c) || 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}
export const bead = (code: string) => PALETTE.find((p) => p.code === code)!
