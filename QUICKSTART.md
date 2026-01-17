# 🚀 快速开始指南

## 5分钟快速部署

### 步骤 1: 安装依赖
```bash
cd mtcacg-vue
npm install
```

### 步骤 2: 本地预览
```bash
npm run dev
```
访问 http://localhost:5173

### 步骤 3: 构建项目
```bash
npm run build
```

### 步骤 4: 部署到 Cloudflare Pages
```bash
# 安装 Wrangler (首次需要)
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler pages deploy dist --project-name=mtcacg
```

## 🔧 后端配置

**重要**: 前端部署后，需要修改后端 Workers 代码才能正常工作。

详细步骤请查看: `workers/BACKEND_GUIDE.md`

简要步骤:
1. 修改 `logic.js` 添加 JSON API 支持
2. 修改 `index.js` 添加 API 路由
3. 部署 Workers: `wrangler deploy`

## 📝 环境变量

在 Cloudflare Pages Dashboard 中设置:
- `BOT_TOKEN`: 你的 Telegram Bot Token
- `DB`: 绑定你的 D1 数据库

## ✅ 验证部署成功

访问以下 URL 测试:
- `https://your-domain.com/` → 首页
- `https://your-domain.com/artists` → 画师列表
- `https://your-domain.com/api/posts?q=random` → API 测试

---

遇到问题？查看完整文档: `README.md`
