<template>
  <!-- Overlay -->
  <div class="overlay" @click="$emit('close')"></div>

  <!-- Sidebar -->
  <aside class="sidebar" @click.stop>
    <div class="header">
      <h2 class="brand">MtcACG</h2>
      <button class="close" @click="$emit('close')" aria-label="close">&times;</button>
    </div>

    <nav class="nav">
      <router-link to="/" class="item" @click="$emit('close')">
        <span class="ico">
          <!-- Home -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 11.5L12 4l9 7.5M5 10.5V20h5v-5h4v5h5v-9.5"/>
          </svg>
        </span>
        <span>首页</span>
      </router-link>

      <router-link to="/artists" class="item" @click="$emit('close')">
        <span class="ico">
          <!-- Users -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </span>
        <span>画师名人堂</span>
      </router-link>

      <button class="item" type="button" @click="randomImage">
        <span class="ico">
          <!-- Random -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 6h4l3 6 3-6h4M4 18h4l3-6 3 6h4"/>
          </svg>
        </span>
        <span>随机抽图看看0w0</span>
      </button>

      <router-link to="/r18" class="item danger" @click="$emit('close')">
        <span class="ico">
          <!-- Warning -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </span>
        <span>里世界 · 纯R18|慎</span>
      </router-link>

      <router-link to="/about" class="item" @click="$emit('close')">
        <span class="ico">
          <!-- Info -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 8.5v.01M11 11h1v5h1"/>
          </svg>
        </span>
        <span>关于</span>
      </router-link>

      <div class="section">
        <div class="row">
          <span class="label">
            <span class="ico">
              <!-- Warning (for R18 label) -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </span>
            R18 哒咩~（默认过滤）
          </span>

          <!-- ✅ 开关：true = 过滤R18（隐藏） -->
          <label class="switch">
            <input type="checkbox" v-model="hideR18" @change="toggleR18" />
            <span class="track"></span>
            <span class="thumb"></span>
          </label>
        </div>
        <p class="hint">开启后将隐藏敏感内容（默认开启）</p>
      </div>
    </nav>

    <div class="friends">
      <p class="friends-title">Friends</p>
      <a class="friend-link" href="https://github.com/TyrEamon/MtcACG-GO" target="_blank" rel="noreferrer">
        <span class="ico">
          <!-- GitHub -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
        </span>
        <span>GitHub</span>
      </a>
    </div>

    <div class="footer">© 2025 MtcACG Gallery</div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

defineEmits(['close'])

const router = useRouter()

// ✅ 默认开启过滤（隐藏 R18）
const hideR18 = ref(true)

onMounted(() => {
  const saved = localStorage.getItem('hide_r18')
  // 默认：true（过滤开启）
  hideR18.value = saved === null ? true : saved === 'true'
  if (saved === null) localStorage.setItem('hide_r18', 'true')
})

const toggleR18 = () => {
  localStorage.setItem('hide_r18', String(hideR18.value))
  window.location.reload()
}

const randomImage = async () => {
  try {
    const res = await fetch('/api/posts?q=random')
    const data = await res.json()
    if (Array.isArray(data) && data.length) {
      router.push('/detail/' + data[0].id)
    }
  } finally {
    // 无论成功与否都关侧边栏（体验更像友站）
    // eslint-disable-next-line vue/custom-event-name-casing
    // 这里直接 emit
  }
}
</script>

<style scoped>
/* 简约暗色 + 友站风：遮罩层 + 左侧滑入 */
.overlay {
  position: fixed;
  inset: 0;
  background: var(--sidebar-overlay);
  z-index: 200;
  animation: fade .2s ease-out;
}

@keyframes fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 288px;
  height: 100vh;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  z-index: 201;
  display: flex;
  flex-direction: column;
  box-shadow: var(--sidebar-shadow);
  animation: slide .28s ease-out;
}

@keyframes slide {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

.header {
  padding: 18px 18px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--sidebar-border);
}

.brand {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: .3px;
  background: linear-gradient(90deg, #ec4899, #a855f7);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.close {
  background: transparent;
  border: none;
  color: var(--sidebar-text-muted);
  font-size: 28px;
  cursor: pointer;
  line-height: 1;
  padding: 2px 8px;
}
.close:hover { color: var(--sidebar-text-strong); }

.nav {
  padding: 12px;
  flex: 1;
  overflow-y: auto;
}
/* ✅ 轻滑入 + 字体略大（只动 .item 相关） */
.item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  margin: 6px 0;
  border-radius: 10px;
  color: var(--sidebar-text);
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background .18s ease, color .18s ease, transform .18s ease;
  text-align: left;

  /* ✅ 字体稍微加大一点 */
  font-size: 15px;

  /* ✅ 为“滑入指示条”准备 */
  position: relative;
  overflow: hidden;
}

/* ✅ 左侧“灵动”指示条：hover 时轻滑入 */
.item::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 50%;
  width: 3px;
  height: 14px;
  border-radius: 999px;
  background: rgba(236,72,153,0.95);
  transform: translate(-10px, -50%);
  opacity: 0;
  transition: transform .18s ease, opacity .18s ease;
}

.item:hover {
  background: var(--sidebar-hover-bg);
  color: var(--sidebar-text-strong);

  /* ✅ 轻滑入（幅度更明显但不夸张） */
  transform: translateX(6px);
}

.item:hover::before {
  opacity: 1;
  transform: translate(0, -50%);
}

/* ✅ 图标也跟着“轻滑”一点点（不改 SVG 本身） */
.ico svg {
  transition: transform .18s ease;
}
.item:hover .ico svg {
  transform: translateX(2px);
}

/* danger 保持原逻辑，但指示条变红更协调（不影响你原来的 danger hover 颜色） */
.item.danger::before {
  background: rgba(239,68,68,0.95);
}

.ico { width: 20px; display: inline-flex; justify-content: center; }

.section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--sidebar-border);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 10px;
  background: var(--sidebar-section-bg);
}

.label {
  color: var(--sidebar-text);
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.hint {
  margin: 8px 0 0;
  padding: 0 10px;
  color: var(--sidebar-text-faint);
  font-size: 12px;
}

/* Switch：true=过滤开启（隐藏R18） */
.switch {
  position: relative;
  width: 44px;
  height: 24px;
  display: inline-block;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.track {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: var(--sidebar-switch-track);
  transition: .2s;
}
.thumb {
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  border-radius: 999px;
  background: #fff;
  transition: .2s;
}

/* ✅ checked 表示 hideR18=true（过滤开启） => 用粉色高亮 */
.switch input:checked ~ .track {
  background: #ec4899;
}
.switch input:checked ~ .thumb {
  transform: translateX(20px);
}

.friends {
  padding: 12px;
  border-top: 1px solid var(--sidebar-border);
}
.friends-title {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .12em;
  color: var(--sidebar-text-faint);
  text-transform: uppercase;
}
.friend-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 10px;
  color: var(--sidebar-text-muted);
  text-decoration: none;
  transition: background .15s ease, color .15s ease;
}
.friend-link:hover {
  background: var(--sidebar-hover-bg);
  color: var(--sidebar-text-strong);
}

.footer {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--sidebar-text-faint);
  border-top: 1px solid var(--sidebar-border);
}
</style>

