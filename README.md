# MtcACG Vue

二次元图像站前端（Vue 3 + Vite），后端采用 Cloudflare Workers/D1。  
推荐“同仓库、分开部署”：前端用 Pages，后端用 Workers，各自独立发布。

## 目录结构（同仓库推荐）
```
vue框架完善（1.17）/
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/
│  └─ _redirects
├─ src/
│  ├─ App.vue
│  ├─ main.js
│  ├─ components/
│  └─ views/
└─ workers/                 # 后端 worker 放这里（同仓库方式）
   ├─ wrangler.toml
   ├─ src/
   └─ BACKEND_GUIDE.md
```

如果你当前后端在 `C:\Users\Tyr.Eamon\Desktop\mtccg-vue-后端worker`，  
建议复制/移动到本项目的 `workers/` 目录里统一管理（部署仍然分开）。

## 本地开发

### 1) 前端启动
```bash
npm install
npm run dev
```
访问 `http://localhost:5173`。

### 2) 后端本地（可选）
进入 `workers/` 后运行：
```bash
npm install
npm run dev
# 或
wrangler dev
```
若端口不是 `8787`，请同步修改 `vite.config.js` 里的代理配置。

## Cloudflare 部署

### 1) 前端：Cloudflare Pages
1. Cloudflare Dashboard → Pages → Create a project  
2. 连接此仓库  
3. 构建设置  
   - Build command: `npm run build`  
   - Output directory: `dist`  
   - Node version: 18+  
4. 部署完成后得到一个 Pages 域名

### 2) 后端：Cloudflare Workers
进入 `workers/` 目录执行：
```bash
npm install
npx wrangler login
npx wrangler deploy
```

如果需要 D1：
```bash
npx wrangler d1 create <db-name>
npx wrangler d1 migrations apply <db-name>
```
并在 `wrangler.toml` 中绑定 `DB`。

### 3) 绑定同域路由（推荐）
为了让前端直接访问 `/api`、`/image`：
1. 在 Workers → Routes 添加  
   - `https://你的-pages域名/api/*`  
   - `https://你的-pages域名/image/*`
2. 前端代码保持使用相对路径 `/api`、`/image`，无需改动。

## 环境变量（Workers）
按后端需要配置（示例）：
- `BOT_TOKEN`：Telegram Bot Token（图片代理）
- `DB`：D1 数据库绑定名

## 常见问题

### 1) 刷新后 404
确认 `public/_redirects` 内容为：
```
/*    /index.html   200
```

### 2) 本地 API 404
确认 Worker 正在运行，并检查 `vite.config.js` 的 `server.proxy`。

## 后端接口说明
详细接口与字段说明见：`workers/BACKEND_GUIDE.md`
