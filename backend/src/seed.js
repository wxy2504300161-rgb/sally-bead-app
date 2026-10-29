// 初始种子数据：首次启动时写入 data/db.json
import { SPRITES, parse, fromSprite, blank } from './bead.js'

const now = Date.now()

// 灵感广场初始作品（与 figma 原型一致）
const WORK_SEED = [
  { id: 1, title: '樱花小兔杯垫', author: '豆豆酱', sprite: 'bunny', likes: 2384, tag: '杯垫', size: '29×29', tall: true },
  { id: 2, title: '草莓甜心挂件', author: '小鹿手作', sprite: 'strawberry', likes: 1569, tag: '挂件', size: '15×15' },
  { id: 3, title: '橘猫午睡', author: '喵星人Lab', sprite: 'cat', likes: 982, tag: '动物', size: '29×29' },
  { id: 4, title: '粉粉爱心钥匙扣', author: '拼拼乐', sprite: 'heart', likes: 3120, tag: '节日', size: '15×15', tall: true },
  { id: 5, title: '晴天小云朵', author: '云朵工坊', sprite: 'cloud', likes: 744, tag: '挂件', size: '34×34' },
  { id: 6, title: '呱呱小青蛙', author: '绿豆糕', sprite: 'frog', likes: 1206, tag: '动物', size: '29×29', tall: true },
  { id: 7, title: '森林蘑菇', author: '像素森', sprite: 'mushroom', likes: 865, tag: '杯垫', size: '29×29' },
  { id: 8, title: '万圣小幽灵', author: '紫薯球', sprite: 'ghost', likes: 1433, tag: '节日', size: '15×15' },
]

const INVENTORY_SEED = { A01: 420, A12: 160, B03: 38, B07: 12, C02: 210, C09: 90, D04: 0, D11: 75, E05: 130, E10: 8, F02: 260, F08: 54, G01: 110, G06: 300 }

const DRAFT_SEED = [
  { id: 1, name: '呱呱小青蛙 v2', sprite: 'frog', progress: 72, t: '1 天前', updatedAt: now - 86400000 },
  { id: 2, name: '晴天云朵', sprite: 'cloud', progress: 40, t: '2 天前', updatedAt: now - 2 * 86400000 },
  { id: 3, name: '紫色小幽灵', sprite: 'ghost', progress: 15, t: '3 天前', updatedAt: now - 3 * 86400000 },
]

const HISTORY_SEED = [
  { sprite: 'heart', title: '粉粉爱心钥匙扣', minutes: 25, createdAt: now - 5 * 86400000 },
  { sprite: 'strawberry', title: '草莓甜心挂件', minutes: 48, createdAt: now - 12 * 86400000 },
  { sprite: 'cat', title: '橘猫午睡', minutes: 62, createdAt: now - 20 * 86400000 },
  { sprite: 'mushroom', title: '森林蘑菇', minutes: 55, createdAt: now - 27 * 86400000 },
]

const EXPORT_SEED = [
  { id: 1, sprite: 'bunny', name: '樱花小兔杯垫', type: 'PDF 打印版', sizeLabel: '1.2 MB', createdAt: now - 3600000 },
  { id: 2, sprite: 'heart', name: '粉粉爱心钥匙扣', type: '带网格图纸', sizeLabel: '480 KB', createdAt: now - 86400000 },
  { id: 3, sprite: 'strawberry', name: '草莓甜心挂件', type: '用料清单', sizeLabel: '36 KB', createdAt: now - 30 * 86400000 },
  { id: 4, sprite: 'cat', name: '橘猫午睡', type: '色号标注图', sizeLabel: '760 KB', createdAt: now - 34 * 86400000 },
]

export function buildSeed() {
  const works = WORK_SEED.map((w) => ({
    ...w,
    authorId: 'u1',
    grid: parse(SPRITES[w.sprite]),
    likedBy: w.id === 1 ? ['u1'] : [],
    createdAt: now - (100 - w.id) * 86400000,
  }))

  const drafts = DRAFT_SEED.map((d) => ({
    id: d.id,
    name: d.name,
    sprite: d.sprite,
    grid: fromSprite(d.sprite, 15),
    size: 15,
    progress: d.progress,
    updatedAt: d.updatedAt,
  }))

  const history = HISTORY_SEED.map((h, i) => ({
    id: i + 1,
    sprite: h.sprite,
    title: h.title,
    minutes: h.minutes,
    total: parse(SPRITES[h.sprite]).flat().filter(Boolean).length,
    createdAt: h.createdAt,
  }))

  const exportsList = EXPORT_SEED.map((e) => ({
    id: e.id,
    sprite: e.sprite,
    name: e.name,
    type: e.type,
    sizeLabel: e.sizeLabel,
    createdAt: e.createdAt,
  }))

  return {
    users: {
      u1: {
        id: 'u1',
        phone: '13800006688',
        name: '豆豆酱',
        bio: '用一颗颗豆子拼出小确幸',
        avatar: 'bunny',
        city: '上海',
        brand: 'Artkal',
        level: 4,
        levelName: '拼豆达人',
        days: 128,
        createdAt: now - 128 * 86400000,
      },
    },
    works,
    inventory: { u1: { ...INVENTORY_SEED } },
    drafts: { u1: drafts },
    history: { u1: history },
    progress: { u1: {} },
    exports: { u1: exportsList },
    settings: {
      u1: {
        canvasSize: '29×29',
        beadSpec: '2.6mm',
        showGrid: true,
        boldEvery5: true,
        autoMirror: false,
        autoSave: true,
        privacy: { allowReplicate: true, showFavorites: false, allowStrangerDM: true, personalized: true },
        notify: { like: true, comment: true, follower: true, lowStock: true, weekly: false, activity: false },
      },
    },
    membership: { u1: { active: false, plan: null, since: null, expiresAt: null } },
    tokens: {},
    _seq: 1000,
  }
}
