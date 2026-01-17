# MtcACG Vue 版本 - 完整部署指南

## 📦 项目简介

这是 MtcACG 图库网站的 Vue 3 重构版本，使用现代前端技术栈构建，提供更流畅的用户体验。

### 技术栈
- **前端**: Vue 3 + Vue Router + Vite
- **后端**: Cloudflare Workers + D1 Database
- **部署**: Cloudflare Pages

## 📁 项目结构

```
mtcacg-vue/
├── index.html              # 入口 HTML
├── package.json            # 依赖配置
├── vite.config.js          # Vite 构建配置
├── public/
│   └── _redirects          # Cloudflare Pages 路由配置
├── src/
│   ├── main.js            # Vue 应用入口
│   ├── App.vue            # 根组件
│   ├── router/
│   │   └── index.js       # 路由配置
│   ├── components/
│   │   └── Sidebar.vue    # 侧边栏组件
│   └── views/
│       ├── Home.vue       # 首页瀑布流
│       ├── Detail.vue     # 图片详情页
│       ├── Artists.vue    # 画师列表
│       ├── ArtistProfile.vue  # 画师详情
│       ├── About.vue      # 关于页面
│       └── R18.vue        # R18 内容页
└── workers/
    ├── index.js           # Workers 主入口（需修改）
    ├── logic.js           # 业务逻辑（需修改）
    └── wrangler.toml      # Workers 配置
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发

```bash
npm run dev
```

访问 http://localhost:5173

### 3. 构建生产版本

```bash
npm run build
```

构建结果在 `dist/` 目录

## 📤 部署到 Cloudflare Pages

### 方法 A: 通过 Dashboard（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Pages** → **创建项目**
3. 连接 GitHub 仓库
4. 配置构建设置:
   - **构建命令**: `npm run build`
   - **输出目录**: `dist`
   - **Node 版本**: 18 或更高
5. 点击保存并部署

### 方法 B: 通过 Wrangler CLI

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录
wrangler login

# 构建并部署
npm run build
wrangler pages deploy dist --project-name=mtcacg
```

## 🔧 后端 API 修改说明

原有的 Cloudflare Workers 后端需要做以下修改以支持 Vue 前端的 API 调用：

### 修改 1: `logic.js` - 添加 JSON 格式支持

在 `handleDetail` 函数中添加 JSON 返回格式：

```javascript
export async function handleDetail(id, env, url = null) {
  // ... 原有的查询代码 ...

  // 新增：检查是否需要返回 JSON
  if (url && url.searchParams.get('format') === 'json') {
    return new Response(JSON.stringify({
      image: img,
      siblings: items,
      randomPosts
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      }
    });
  }

  // 原有的 HTML 返回逻辑
  const html = htmlDetail({...});
  return new Response(html, {...});
}
```

同样，修改 `handleArtistProfile` 函数：

```javascript
export async function handleArtistProfile(artistName, url, env) {
  // ... 原有代码 ...

  // 新增：JSON 格式返回
  const format = url.searchParams.get('format');
  if (format === 'json' && !url.pathname.includes('/api/')) {
    // 这是分页加载请求
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = 15;
    const offset = (page - 1) * pageSize;
    const postsSql = `SELECT * FROM images WHERE artist = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    const { results } = await env.DB.prepare(postsSql).bind(artist, pageSize, offset).all();
    return new Response(JSON.stringify(results), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  // ... 原有代码 ...
}
```

### 修改 2: `index.js` - 添加新的 API 路由

在 `fetch` 函数中添加以下路由：

```javascript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ... 原有路由 ...

    // 新增：详情页 API
    if (path.startsWith('/api/detail/')) {
      const id = path.replace('/api/detail/', '');
      return await handleDetail(id, env, url);
    }

    // 新增：画师 API
    if (path.startsWith('/api/artist/')) {
      const artistName = path.replace('/api/artist/', '');
      // 需要在 logic.js 中新建一个专门的 API 函数
      return await handleArtistProfileAPI(artistName, env);
    }

    // 修改详情页路由，传入 url 参数
    const detailMatch = path.match(/^\/detail\/(.+)$/);
    if (detailMatch) {
      return await handleDetail(detailMatch[1], env, url);
    }

    // 修改画师路由，传入 url 参数
    const artistMatch = path.match(/^\/artist\/(.+)$/);
    if (artistMatch) {
      return await handleArtistProfile(artistMatch[1], url, env);
    }

    // ... 其他路由 ...
  }
};
```

### 修改 3: `logic.js` - 新增画师 API 专用函数

```javascript
export async function handleArtistProfileAPI(artistName, env) {
  const artist = decodeURIComponent(artistName);

  // 获取基础统计
  const metaSql = `SELECT COUNT(*) as count, MAX(created_at) as last_update FROM images WHERE artist = ?`;
  const meta = await env.DB.prepare(metaSql).bind(artist).first();

  if (!meta || meta.count === 0) {
    return new Response(JSON.stringify({ error: 'Artist not found' }), { status: 404 });
  }

  // 获取封面图
  const coverSql = `SELECT file_name FROM images WHERE artist = ? ORDER BY created_at DESC LIMIT 2`;
  const { results: covers } = await env.DB.prepare(coverSql).bind(artist).all();
  const cover1 = covers[0]?.file_name;
  const cover2 = covers[1]?.file_name || cover1;

  // 分析平台来源
  const platformSql = `SELECT id FROM images WHERE artist = ? LIMIT 20`;
  const { results: sampleIds } = await env.DB.prepare(platformSql).bind(artist).all();
  let platforms = new Set();
  sampleIds.forEach(row => {
    if (row.id.startsWith('pixiv_')) platforms.add('Pixiv');
    else if (row.id.startsWith('yande')) platforms.add('Yande.re');
    else if (row.id.startsWith('mtcacg')) platforms.add('MtcACG');
    else if (row.id.startsWith('twitter')) platforms.add('Twitter');
    else platforms.add('Other');
  });
  const platformText = Array.from(platforms).join('、');

  // 获取作品列表
  const postsSql = `SELECT * FROM images WHERE artist = ? ORDER BY created_at DESC LIMIT 15`;
  const { results: posts } = await env.DB.prepare(postsSql).bind(artist).all();

  // 格式化更新时间
  let updateTime = '未知';
  if (meta.last_update) {
    const ts = meta.last_update.toString().length === 10 ? meta.last_update * 1000 : meta.last_update;
    const d = new Date(ts);
    updateTime = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  }

  return new Response(JSON.stringify({
    profile: {
      artist,
      count: meta.count,
      updateTime,
      cover1,
      cover2,
      platformText
    },
    posts
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## ⚙️ 环境变量配置

在 Cloudflare Pages 设置中添加以下环境变量：

- `BOT_TOKEN`: Telegram Bot Token（用于图片代理）
- `DB`: D1 数据库绑定

## 🌐 SPA 路由支持

项目已包含 `public/_redirects` 文件，内容如下：

```
/*    /index.html   200
```

这确保 Cloudflare Pages 正确处理 Vue Router 的客户端路由。

## 🎯 功能特性

- ✅ 响应式瀑布流布局
- ✅ 标签搜索
- ✅ 画师分类浏览
- ✅ 图片详情页（支持多图切换）
- ✅ R18 内容年龄验证
- ✅ 流畅的页面切换（无刷新）
- ✅ 懒加载优化
- ✅ 移动端适配

## 📱 移动端支持

所有页面已针对移动设备优化，包括：
- 响应式网格布局
- 触摸友好的交互
- 优化的字体大小和间距

## 🐛 常见问题

### Q: 部署后页面刷新出现 404?
**A**: 确保 `public/_redirects` 文件存在且内容正确。

### Q: API 请求失败?
**A**: 检查后端 Workers 是否已部署，环境变量是否配置正确。

### Q: 图片加载慢?
**A**: Cloudflare 自动提供 CDN 加速，首次访问后会缓存，后续会更快。

### Q: 本地开发时 API 404?
**A**: 确保 `vite.config.js` 中的 proxy 配置指向正确的 Workers 开发地址。

## 📝 开发建议

- 使用 Vue DevTools 浏览器扩展进行调试
- 遵循 Vue 3 Composition API 风格
- 组件尽量保持单一职责
- 合理使用 computed 和 watch

## 📄 许可证

本项目仅供学习交流使用，图片版权归原作者所有。

---

✨ 享受 Vue 带来的流畅体验吧！
