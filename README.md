# 小豆像素 · Pixel Art DIY App

拼豆（像素拼豆 / fuse-bead）创作 App。原本是 Figma Make 导出的纯前端原型，**本仓库在保留全部 UI 的基础上，接上了真实后端接口**：灵感广场、作品发布、点赞收藏、草稿、豆仓库存、拼豆记录、对照进度、会员、设置、AI 图片转图纸（演示）等，全部改为调用后端 API，数据持久化到本地 JSON 文件。

## 目录结构

```
Sally的APP/
├── frontend/        # React + Vite + Tailwind 前端（来自 Figma 导出，已改写）
│   └── src/
│       ├── api.ts        # 后端接口客户端（统一封装 fetch）
│       ├── data.ts       # 色卡 / 图案 / 网格解析（引用 shared 数据源）
│       ├── App.tsx       # 路由 + 自动登录
│       └── pages/        # Home / Editor / Compare / Inventory / Me / MeSub / Detail
├── backend/         # Node 后端（零依赖，仅用标准库 http，无需 npm install）
│   ├── src/
│   │   ├── server.js     # 入口
│   │   ├── mini.js       # 极简 Express 兼容层（自研，零三方依赖）
│   │   ├── db.js         # JSON 文件存储（原子落盘）
│   │   ├── bead.js       # 色卡/图案工具
│   │   ├── seed.js       # 初始种子数据
│   │   ├── middleware.js # 鉴权
│   │   └── routes/       # 各业务路由
│   └── data/db.json  # 运行时自动生成的数据文件（可删除重置）
├── shared/
│   └── bead-data.json  # 色卡 + 图案 单一数据源（前端/后端共用）
├── dev.js            # 一键同时启动前后端
└── README.md
```

## 快速开始

```bash
# 1. 安装前端依赖（后端零依赖，无需安装）
cd frontend && npm install

# 2. 一键启动（前端 5173 + 后端 8787）
cd ..           # 回到 Sally的APP
node dev.js
```

或者分别启动：

```bash
# 终端 A
cd backend && npm run dev        # http://localhost:8787（node src/server.js，无需 npm install）

# 终端 B
cd frontend && npm run dev       # http://localhost:5173
```

前端通过 Vite 代理把 `/api` 转发到后端（见 `frontend/vite.config.ts`），无需处理跨域。

## 已接通的接口

| 模块 | 接口 |
| --- | --- |
| 账号 | `POST /api/auth/login` · `GET/PUT /api/auth/me` |
| 灵感广场 / 作品 | `GET /api/works` · `GET /api/works/:id` · `POST /api/works` · `POST /api/works/:id/favorite` · `GET /api/favorites` |
| 草稿 | `GET/POST /api/drafts` · `PUT/DELETE /api/drafts/:id` |
| 豆仓库存 | `GET /api/inventory` · `POST /api/inventory/set` · `/adjust` · `/deduct` · `/shortage` |
| 拼豆记录 | `GET/POST /api/history` |
| 对照进度 | `GET/PUT /api/progress/:sprite` |
| 导出记录 | `GET/POST /api/exports` |
| 会员 | `GET /api/membership/plans` · `GET /api/membership` · `POST /api/membership/subscribe` · `/cancel` |
| 设置 | `GET/PUT /api/settings` |
| AI 图片转图纸 | `POST /api/convert`（真实：前端 canvas 降采样上传像素矩阵，后端按色卡做最近色匹配，离线兜底） |

## 说明

- 后端**零三方依赖**：用 Node 标准库 `http` 自研了一个极简 Express 兼容层（`src/mini.js`），因此 `backend` 目录**不需要 `npm install`**，直接 `node src/server.js` 即可运行；后续要换成真正的 Express + 数据库也很平滑（路由写法不变）。
- 登录为**演示模式**：首次打开前端会自动用 `13800006688 / 123456` 登录，拿到 token 后所有接口即可用。
- 数据保存在 `backend/data/db.json`，删除该文件即重置为初始种子数据。
- **持久化保证**：后端每次写入都原子落盘（`db.js` 临时文件 + rename），进程退出（SIGINT/SIGTERM）时也会再 flush 一次；前端登录态（token）存 `localStorage`，编辑器画布在刷新/关闭瞬间用 `keepalive` 请求立即落库。因此**刷新、关闭、重启后端后数据都不丢失**。
- 后端使用轻量 JSON 文件存储，单机 / 原型足够；上线可平滑替换为 SQLite / 数据库（接口不变）。
- 真实的「微信/支付宝支付」「AI 图片降色」为占位实现，接口契约已稳定，替换内部逻辑即可。

## 测试

```bash
# 后端持久化测试：启动→写数据→杀进程→重启→读回，验证数据不丢（零依赖）
cd backend && npm test

# 前端单元测试（需先 npm install）：Me 页面、登录态持久化、编辑器卸载落库
cd frontend && npm test
```

后端持久化测试会自动备份 / 还原 `backend/data/db.json`，不会污染开发数据。

## 部署到云端（完整功能）

前端（H5 静态包）可托管到 **Cloudflare Pages**，后端（零依赖 Node）可托管到 **Railway / Render**。

> ⚠️ **关键：前后端都引用仓库根的 `shared/bead-data.json`**，因此两类平台都**从「整个仓库根目录」部署**（不要只选 `frontend/` 或 `backend/` 子目录），否则构建/启动会因找不到色卡数据而失败。

### 后端（Railway / Render）

仓库根已提供 `package.json`（`start` → `node backend/src/server.js`）、`railway.json`、`render.yaml`、`Procfile`：

1. **Railway**：New Project → Deploy from GitHub Repo，选中本仓库（根目录）。Railway 读根 `package.json` 自动 `npm install` + `npm start`，并按 `railway.json` 配置 `/api/health` 健康检查。`PORT` 由平台注入。
2. **Render**：New → Blueprint，连接本仓库，会自动读取根 `render.yaml` 建好免费 Web 服务（`NODE_VERSION=22`、`/api/health` 健康检查）。`PORT` 由平台注入。
3. 部署后拿到后端地址，例如 `https://sally-bead-backend.up.railway.app`。

### 前端（Cloudflare Pages）

- **方式 A · 直接上传（当前已用）**：本地 `cd frontend && npm run build`，把生成的 `dist/` 拖到 Cloudflare 的 Direct Upload 页面即可（已上线 `https://sally-bead.pages.dev`）。
- **方式 B · 连 Git 自动部署**：在 Cloudflare Pages 连 GitHub 时，**Root directory 填仓库根（留空 / 根）**，构建命令 `cd frontend && npm install && npm run build`，输出目录 `frontend/dist`，环境变量 `NODE_VERSION=22`。

### 让前端连上后端（启用完整功能）

在 Cloudflare Pages 的 **构建环境变量** 里加 `VITE_API_BASE=https://你的后端地址`（`frontend/src/api.ts` 已支持；Vite 在**构建时**注入，改完后需重新构建并部署前端）。后端默认 `CORS_ORIGIN=*` 放行所有来源；上线后建议改为前端域名（如 `https://sally-bead.pages.dev`）提升安全性（后端环境变量 `CORS_ORIGIN`）。

> ⚠️ **数据持久性说明**：后端用 JSON 文件存储（`DATA_DIR` 环境变量指定目录，默认 Railway 上写 `/data`，本地写 `backend/data`）。
> - **Railway**：容器磁盘默认临时，重启会重置；若要**永久保存**，在 Railway 面板给服务加一个 **Volume 挂载到 `/data`** 即可（代码已支持，无需改配置），数据即落在该持久磁盘。
> - **Render**：免费版无持久磁盘，数据重启会重置；长期保存需升级或用外部数据库。
> - 原型 / Demo 阶段可不挂磁盘，直接体验完整功能。

- **移动端 / H5**：已按手机网页优化 —— `index.html` 含移动端 viewport（`user-scalable=no, viewport-fit=cover`）、`theme-color`、字体走 `<link>` 预连接；`index.css` 处理了禁止双击缩放、回弹、`-webkit-tap-highlight` 与刘海屏/底部安全区（`.safe-top` / `.safe-bottom`）。页面在手机宽度下自动全屏铺满（桌面下显示为居中手机框，方便预览）。`frontend/dist/` 为可直接托管的 H5 静态包（`npm run build` 生成）。
