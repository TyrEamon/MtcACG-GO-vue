<template>
  <div class="about">
    <div class="about-container">
      <div class="about-header">
        <h1>关于 MtcACG</h1>
        <p class="tagline">在互联网异世界里的秘密基地</p>
      </div>

      <section>
        <h2>✨ 这是什么？</h2>
        <p>MtcACG 是一个二次元图库网站，收录来自 Pixiv、Yande.re 等平台的精美插画。</p>
        <p>这里没有算法裹挟，只有站长的私人品味。每一张图，都是从时间里切下的碎片，安放于此，建成一座只属于我的数字花园。</p>
        <p>想怎么玩都行！跟着 <code>#标签</code> 寻找同好，或在瀑布流里无限滑行。</p>
      </section>

      <section>
        <h2>🔑 API 接口</h2>
        <p>想把这里的风景带回你的世界？和你定下一个数据契约吧：</p>
        <div class="api-list">
          <div class="api-item">
            <code>GET /api/posts?q=random</code>
            <p>随机获取一张图片（不含 R-18）</p>
          </div>
          <div class="api-item">
            <code>GET /api/bg_safe?type=image</code>
            <p>随机背景图（安全版）- 直接返回图片</p>
          </div>
          <div class="api-item">
            <code>GET /api/bg_all?type=image</code>
            <p>随机背景图（含 R-18）- 直接返回图片</p>
          </div>
          <div class="api-item">
            <code>GET /api/posts?q=少女+白发</code>
            <p>搜索标签（多个标签用空格分隔）</p>
          </div>
        </div>
      </section>

      <section>
        <h2>🎨 技术栈</h2>
        <div class="tech-stack">
          <span class="tech-tag">Vue 3</span>
          <span class="tech-tag">Vite</span>
          <span class="tech-tag">Cloudflare Pages</span>
          <span class="tech-tag">Cloudflare Workers</span>
          <span class="tech-tag">D1 Database</span>
        </div>
      </section>

      <section>
        <h2>📮 联系方式</h2>
        <p>有任何建议或想投稿？欢迎通过 Telegram 联系我们。</p>
        <p>现在的 MtcACG 还在长身体的阶段呢，很多想收录的美图还在排队等着"入驻"。</p>
      </section>

      <section>
        <h2>⚠️ 版权声明</h2>
        <p>本站所有图片版权归原作者所有，仅供学习交流使用。</p>
        <p>如有侵权，请联系删除。</p>
      </section>

      <div class="footer-quote">
        <p>"愿你在这里，捕获到最让你心动的那一抹色彩."</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: calc(100vh - 4rem);
}

.about-container {
  background: white;
  border-radius: 16px;
  padding: 3rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.1);
}

.about-header {
  text-align: center;
  margin-bottom: 3rem;
}

.about-header h1 {
  color: #ff69b4;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

.tagline {
  color: #999;
  font-style: italic;
}

section {
  margin: 2.5rem 0;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eee;
}

section:last-of-type {
  border-bottom: none;
}

section h2 {
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.5rem;
}

section p {
  line-height: 1.8;
  color: #666;
  margin: 0.8rem 0;
}

section code {
  background: #f5f5f5;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-family: 'Consolas', monospace;
  color: #ff69b4;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.api-item {
  background: #f8f8f8;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #ff69b4;
}

.api-item code {
  display: block;
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 0.8rem 1rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-family: 'Consolas', monospace;
  overflow-x: auto;
}

.api-item p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1rem;
}

.tech-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.footer-quote {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
  text-align: center;
}

.footer-quote p {
  color: #999;
  font-style: italic;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .about {
    padding: 1rem;
  }
  .about-container {
    padding: 2rem 1.5rem;
  }
  .about-header h1 {
    font-size: 2rem;
  }
}
</style>
