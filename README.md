# MtcACG Vue 版

Vue 3 + Vite 重构的图像站前端，面向 Cloudflare Pages 部署。后端 API 运行在 Cloudflare Workers/D1，接口约定见本文与 `workers/BACKEND_GUIDE.md`。

## 技术栈
- 前端：Vue 3、Vue Router、Vite
- 后端：Cloudflare Workers、D1 Database
- 部署：Cloudflare Pages

## 目录结构
```
mtcacg-vue/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── _redirects          # SPA 路由支持
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/
│   │   └── index.js
│   ├── components/
│   │   ├── Sidebar.vue
│   │   └── FloatingActions.vue
│   └── views/
│       ├── Home.vue
│       ├── Detail.vue
│       ├── Artists.vue
│       ├── ArtistProfile.vue
│       ├── About.vue
│       └── R18.vue
└── workers/
    └── BACKEND_GUIDE.md    # 后端对接说明
```

## 快速开始
### 1) 安装依赖
```bash
npm install
```

### 2) 本地开发
```bash
npm run dev
```
访问 `http://localhost:5173`。

### 3) 构建生产版本
```bash
npm run build
```
输出在 `dist/`。

### 4) 本地预览构建结果（可选）
```bash
npm run preview
```

## 本地联调说明
默认代理在 `vite.config.js`：
```
/api    -> http://localhost:8787
/image  -> http://localhost:8787
```
如果你的 Workers 本地端口不同，请修改 `vite.config.js` 的 `server.proxy`。

## 部署到 Cloudflare Pages
### 方法 A：Dashboard
1. 登录 Cloudflare Dashboard
2. Pages → 新建项目，连接 Git 仓库
3. 构建设置：
   - 构建命令：`npm run build`
   - 输出目录：`dist`
   - Node 版本：18+
4. 保存并部署

### 方法 B：Wrangler CLI
```bash
npm install -g wrangler
wrangler login
npm run build
wrangler pages deploy dist --project-name=mtcacg
```

## 后端 API 说明
本仓库仅包含前端。后端改动与 API 约定请查看：
- `workers/BACKEND_GUIDE.md`

前端依赖的主要接口（示例）：
- `GET /api/posts`（支持 `q/page/limit/sort`）
- `GET /api/detail/:id`
- `GET /api/artists`（支持 `format=json/page/q`）
- `GET /api/artist/:name`（支持 `page/limit`）
- `GET /api/bg_safe?type=image`
- `GET /image/:file_name`

## 环境变量（Pages/Workers）
根据后端配置设置：
- `BOT_TOKEN`：Telegram Bot Token（图片代理）
- `DB`：D1 数据库绑定

## 常见问题
### 刷新后 404
确认 `public/_redirects` 存在且内容为：
```
/*    /index.html   200
```

### 本地 API 404
确认 Workers 已运行，并检查 `vite.config.js` 代理地址。

## 许可证
本项目仅供学习交流使用，图片版权归原作者所有。
