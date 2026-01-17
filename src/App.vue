<template>
  <div id="app" :data-theme="theme">
    <!-- ✅ 全局背景层（清晰图） -->
    <div class="app-bg" :style="bgStyle"></div>
    <!-- ✅ 全局遮罩层（压暗/提亮） -->
    <div class="app-bg-overlay" :style="overlayStyle"></div>

    <header class="header">
      <!-- 左侧区域 -->
      <div class="header-left">
        <button class="menu-btn" @click="sidebarOpen = true" title="菜单">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <router-link to="/artists" class="artists-btn" title="画师名人堂">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
        </router-link>

        <button
          class="theme-toggle-btn"
          @click="toggleTheme"
          :title="theme === 'dark' ? '切换到日间模式' : '切换到夜间模式'"
        >
          <svg v-if="theme === 'light'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </div>

      <div class="header-right">
        <div class="search-inline" :class="{ expanded: searchExpanded }">
          <input
            type="text"
            v-model="searchQuery"
            @keyup.enter="handleSearch"
            @blur="handleBlur"
            placeholder="搜索标签或画师"
            ref="searchInput"
            class="search-input"
          >
        </div>

        <button
          class="search-toggle-btn"
          @click="toggleSearch"
          :class="{ active: searchExpanded }"
          title="搜索"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>

        <router-link to="/" class="logo">
          MtcACG
        </router-link>
      </div>
    </header>

    <Sidebar v-if="sidebarOpen" @close="sidebarOpen = false" />

    <main class="main-content">
      <router-view />
    </main>

    <FloatingActions />
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, provide, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import FloatingActions from './components/FloatingActions.vue'

const router = useRouter()
const route = useRoute()

const sidebarOpen = ref(false)
const searchExpanded = ref(false)
const searchQuery = ref('')
const searchInput = ref(null)

// ✅ 主题状态
const theme = ref('dark')

// ✅ 全局背景：默认用你后端的安全随机背景（先不动首页逻辑也能有背景）
const defaultBgUrl = '/api/bg_safe?type=image'

// 当前背景 url / 遮罩强度
const bgUrl = ref(defaultBgUrl)
// dim：0~1，越大越暗（dark主题用黑遮罩，light主题用白遮罩）
const bgDim = ref(0.65)

const bgStyle = computed(() => ({
  backgroundImage: bgUrl.value ? `url("${bgUrl.value}")` : 'none',
  backgroundColor: theme.value === 'dark' ? '#0b0b0b' : '#f5f5f5'
}))

const overlayStyle = computed(() => {
  const d = Math.min(0.9, Math.max(0, bgDim.value))
  if (theme.value === 'dark') {
    return {
      background: `linear-gradient(180deg,
        rgba(0,0,0,${Math.max(0.45, d - 0.15)}) 0%,
        rgba(0,0,0,${d}) 45%,
        rgba(0,0,0,${Math.min(0.92, d + 0.15)}) 100%)`
    }
  }
  return {
    background: `linear-gradient(180deg,
      rgba(255,255,255,${Math.min(0.35, d)}) 0%,
      rgba(255,255,255,${Math.min(0.6, d + 0.15)}) 100%)`
  }
})

const overlayColor = computed(() => {
  const d = Math.min(0.9, Math.max(0, bgDim.value))
  return theme.value === 'dark' ? `rgba(0,0,0,${d})` : `rgba(255,255,255,${Math.min(0.6, d)})`
})

// ✅ 提供给子页面：设置/重置背景
const setAppBackground = ({ url, dim } = {}) => {
  if (typeof url === 'string' && url.trim()) bgUrl.value = url
  if (typeof dim === 'number') bgDim.value = dim
}
const resetAppBackground = () => {
  bgUrl.value = defaultBgUrl
  bgDim.value = theme.value === 'dark' ? 0.65 : 0.35
}

provide('setAppBackground', setAppBackground)
provide('resetAppBackground', resetAppBackground)

// ✅ 初始化主题
onMounted(() => {
  const savedTheme = localStorage.getItem('mtcacg_theme') || 'dark'
  theme.value = savedTheme
  // 主题初始化后也同步一下默认遮罩
  resetAppBackground()
})

// ✅ 切换主题
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('mtcacg_theme', theme.value)
}

watch(theme, () => {
  // 主题切换时不抢页面 url，但给 dim 一个更适配的默认范围
  if (bgUrl.value === defaultBgUrl) {
    resetAppBackground()
  } else {
    // 页面自定义背景时，只柔性调整 dim（不改 url）
    bgDim.value = theme.value === 'dark'
      ? Math.max(bgDim.value, 0.55)
      : Math.min(bgDim.value, 0.45)
  }
})
// ✅ 提供主题给子组件使用（可选）
provide('theme', theme)

const toggleSearch = async () => {
  if (searchExpanded.value && searchQuery.value.trim()) {
    handleSearch()
  } else {
    searchExpanded.value = !searchExpanded.value
    if (searchExpanded.value) {
      await nextTick()
      searchInput.value?.focus()
    }
  }
}

const handleSearch = () => {
  const keyword = searchQuery.value.trim()
  if (!keyword) return

  const isArtistContext =
    route.path.startsWith('/artists') || route.path.startsWith('/artist')

  if (isArtistContext) {
    router.replace({ path: '/artists', query: { q: keyword } })
  } else {
    router.replace({ path: '/', query: { q: keyword } })
  }

  searchQuery.value = ''
  searchExpanded.value = false
}

const handleBlur = () => {
  if (!searchQuery.value.trim()) {
    setTimeout(() => {
      searchExpanded.value = false
    }, 200)
  }
}
</script>

<style>
::-webkit-scrollbar {
  width: 0px !important;
  height: 0px !important;
  background: transparent !important;
}

html {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

body {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ✅ 背景层：固定在视口，不用 body background-attachment（移动端更稳） */
.app-bg {
  position: fixed;
  inset: 0;
  z-index: -2;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;

  /* ✅ 稳定合成层，减少移动端“错动” */
  transform: translate3d(0, 0, 0);
  will-change: transform;
  pointer-events: none;
}

.app-bg-overlay {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;

  transform: translate3d(0, 0, 0);
  will-change: transform;
}
.app-bg,
.app-bg-overlay {
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

/* ============================================ */
/* ✅ CSS 变量定义（昼夜模式）                    */
/* ============================================ */

#app[data-theme="dark"] {
  --bg-primary: #121212;
  --bg-secondary: rgba(0, 0, 0, 0.6);
  --bg-card: #1a1a1a;
  --bg-card-hover: #2a2a2a;

  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-tertiary: rgba(255, 255, 255, 0.5);

  --border-color: rgba(255, 255, 255, 0.1);
  --border-color-hover: rgba(255, 255, 255, 0.3);

  --accent-color: #ff69b4;
  --accent-color-hover: #ff1493;
  --accent-bg: rgba(255, 105, 180, 0.1);
  --accent-border: rgba(255, 105, 180, 0.3);

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);

  --overlay-bg: rgba(0, 0, 0, 0.9);
  --input-bg: rgba(255, 255, 255, 0.05);
  --input-bg-focus: rgba(255, 255, 255, 0.08);

  --header-bg: var(--bg-secondary);
  --header-border: var(--border-color);
  --header-text: var(--text-primary);
  --header-text-muted: var(--text-secondary);
  --header-input-bg: var(--input-bg);
  --header-input-border: var(--border-color);
  --header-input-focus: var(--input-bg-focus);
  --header-input-placeholder: var(--text-tertiary);

  --sidebar-bg: #1a1a1a;
  --sidebar-border: rgba(255, 255, 255, 0.1);
  --sidebar-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  --sidebar-overlay: rgba(0, 0, 0, 0.6);
  --sidebar-text-strong: rgba(255, 255, 255, 0.95);
  --sidebar-text: rgba(255, 255, 255, 0.78);
  --sidebar-text-muted: rgba(255, 255, 255, 0.6);
  --sidebar-text-faint: rgba(255, 255, 255, 0.38);
  --sidebar-hover-bg: rgba(255, 255, 255, 0.1);
  --sidebar-section-bg: rgba(255, 255, 255, 0.04);
  --sidebar-switch-track: rgba(255, 255, 255, 0.25);
}

#app[data-theme="light"] {
  --bg-primary: #f5f5f5;
  --bg-secondary: rgba(255, 255, 255, 0.8);
  --bg-card: #ffffff;
  --bg-card-hover: #f0f0f0;

  --text-primary: rgba(0, 0, 0, 0.87);
  --text-secondary: rgba(0, 0, 0, 0.6);
  --text-tertiary: rgba(0, 0, 0, 0.4);

  --border-color: rgba(0, 0, 0, 0.08);
  --border-color-hover: rgba(0, 0, 0, 0.2);

  --accent-color: #e91e63;
  --accent-color-hover: #c2185b;
  --accent-bg: rgba(233, 30, 99, 0.08);
  --accent-border: rgba(233, 30, 99, 0.3);

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.16);

  --overlay-bg: rgba(255, 255, 255, 0.95);
  --input-bg: rgba(0, 0, 0, 0.04);
  --input-bg-focus: rgba(0, 0, 0, 0.08);

  --header-bg: #ff69b4;
  --header-border: rgba(255, 255, 255, 0.35);
  --header-text: rgba(255, 255, 255, 0.95);
  --header-text-muted: rgba(255, 255, 255, 0.8);
  --header-input-bg: rgba(255, 255, 255, 0.2);
  --header-input-border: rgba(255, 255, 255, 0.45);
  --header-input-focus: rgba(255, 255, 255, 0.3);
  --header-input-placeholder: rgba(255, 255, 255, 0.75);

  --sidebar-bg: #ffffff;
  --sidebar-border: rgba(0, 0, 0, 0.08);
  --sidebar-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  --sidebar-overlay: rgba(0, 0, 0, 0.35);
  --sidebar-text-strong: rgba(0, 0, 0, 0.9);
  --sidebar-text: rgba(0, 0, 0, 0.78);
  --sidebar-text-muted: rgba(0, 0, 0, 0.55);
  --sidebar-text-faint: rgba(0, 0, 0, 0.38);
  --sidebar-hover-bg: rgba(0, 0, 0, 0.06);
  --sidebar-section-bg: rgba(0, 0, 0, 0.04);
  --sidebar-switch-track: rgba(0, 0, 0, 0.25);
}

html {
  width: 100%;
  min-height: 100%;
  background: var(--bg-primary);
  transition: background 0.3s ease;
}

body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  background: transparent;
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  overflow-x: hidden;
  overflow-y: hidden;
  transition: color 0.3s ease;
}

#app {
  min-height: 100vh;
  background: transparent;
  position: relative;
  z-index: 0;
  transition: all 0.3s ease;
}
</style>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--header-bg);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--header-border);
  padding: 0.8rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--header-text);
  transition: all 0.3s ease;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
}

/* ✅ 统一按钮样式（使用 CSS 变量） */
.menu-btn,
.artists-btn,
.search-toggle-btn,
.theme-toggle-btn {
  background: transparent;
  border: 1px solid var(--header-border);
  color: var(--header-text-muted);
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.menu-btn::before,
.artists-btn::before,
.search-toggle-btn::before,
.theme-toggle-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent-bg);
  opacity: 0;
  transform: scale(0);
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.menu-btn:hover::before,
.artists-btn:hover::before,
.search-toggle-btn:hover::before,
.theme-toggle-btn:hover::before {
  opacity: 1;
  transform: scale(1);
}

.menu-btn svg,
.search-toggle-btn svg,
.theme-toggle-btn svg {
  width: 20px;
  height: 20px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 1;
}

.menu-btn:hover,
.artists-btn:hover,
.search-toggle-btn:hover,
.theme-toggle-btn:hover {
  border-color: var(--header-border);
  color: var(--header-text);
  background: var(--header-input-bg);
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-sm);
}

.menu-btn:hover svg {
  transform: scale(1.1) rotate(90deg);
}

.artists-btn:hover svg {
  transform: scale(1.15);
}

.search-toggle-btn:hover svg {
  transform: scale(1.1) rotate(-10deg);
}

/* ✅ 主题切换按钮特效 */
.theme-toggle-btn:hover svg {
  transform: scale(1.1) rotate(180deg);
}

.search-toggle-btn.active {
  border-color: var(--accent-border);
  color: var(--accent-color);
  background: var(--accent-bg);
  transform: scale(1.05);
  box-shadow: 0 4px 16px var(--accent-bg);
}

.search-toggle-btn.active svg {
  transform: scale(1.1);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1.1);
  }
  50% {
    transform: scale(1.2);
  }
}

.menu-btn:active,
.artists-btn:active,
.search-toggle-btn:active,
.theme-toggle-btn:active {
  transform: translateY(0) scale(0.95);
}

.artists-btn {
  text-decoration: none;
}

.artists-btn svg {
  width: 22px;
  height: 22px;
}

.logo {
  color: var(--header-text);
  text-decoration: none;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 1px;
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  position: relative;
}

.logo::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-color-hover));
  transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.logo:hover {
  color: var(--accent-color);
  letter-spacing: 2px;
  transform: translateY(-2px);
  text-shadow: 0 0 20px var(--accent-bg);
}

.logo:hover::after {
  width: 100%;
}

.search-inline {
  width: 0;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  order: -1;
}

.search-inline.expanded {
  width: 280px;
}

.search-input {
  width: 100%;
  background: var(--header-input-bg);
  border: 1px solid var(--header-input-border);
  border-radius: 8px;
  color: var(--header-text);
  font-size: 0.9rem;
  padding: 0.6rem 1rem;
  outline: none;
  transition: all 0.3s;
}

.search-input:focus {
  background: var(--header-input-focus);
  border-color: var(--header-border);
  box-shadow: 0 0 0 3px var(--header-input-bg);
}

.search-input::placeholder {
  color: var(--header-input-placeholder);
}

.main-content {
  padding-top: 60px;
  height: 100dvh;              /* ⭐ 用 dvh，防止手机地址栏抖动 */
  overflow-y: auto;            /* ⭐ 页面唯一滚动源 */
  -webkit-overflow-scrolling: touch;
  background: transparent;
  position: relative;
  overscroll-behavior-y: none;
}

@media (max-width: 768px) {
  .header {
    padding: 0.7rem 1rem;
  }

  .header-left,
  .header-right {
    gap: 0.6rem;
  }

  .menu-btn,
  .artists-btn,
  .search-toggle-btn,
  .theme-toggle-btn {
    width: 36px;
    height: 36px;
  }

  .menu-btn svg,
  .search-toggle-btn svg,
  .theme-toggle-btn svg {
    width: 18px;
    height: 18px;
  }

  .artists-btn svg {
    width: 20px;
    height: 20px;
  }

  .logo {
    font-size: 1.1rem;
  }

  .search-inline.expanded {
    width: 180px;
  }
}

@media (max-width: 480px) {
  .menu-btn,
  .artists-btn,
  .search-toggle-btn,
  .theme-toggle-btn {
    width: 34px;
    height: 34px;
  }

  .logo {
    font-size: 1rem;
    letter-spacing: 0.5px;
  }

  .search-inline.expanded {
    width: 140px;
  }

  .search-input {
    font-size: 0.85rem;
    padding: 0.5rem 0.8rem;
  }
}
</style>





