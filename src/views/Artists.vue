<template>
  <div class="artists-page">
    <!-- ❌ 删除了 .bg-layer，直接用 App.vue 的全局背景 -->

    <!-- 瀑布流 -->
    <div class="masonry-wrap">
      <div v-for="(col, i) in columns" :key="i" class="masonry-col">
        <div v-for="item in col" :key="item.artist" class="artist-card">
          <div class="cover-area" @click="openLightbox(`/image/${item.cover}?dl=jpg`)">
            <div class="placeholder" :style="{ paddingBottom: getPadding(item) }"></div>
            <img
              class="card-img"
              :class="{ loaded: loadedCovers.has(item.cover) }"
              :src="`/image/${item.cover}?dl=jpg`"
              loading="lazy"
              @load="onCoverLoaded(item.cover)"
            />
            <div class="zoom-hint">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M21 21l-4.35-4.35a7.95 7.95 0 001.35-4.65C18 7.58 14.42 4 10 4S2 7.58 2 12s3.58 8 8 8c1.77 0 3.4-.55 4.65-1.35L19 23l2-2zM10 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"
                />
              </svg>
            </div>
          </div>

          <div class="info-bar">
            <div class="info-top">
              <div class="artist-name" :title="item.artist">{{ item.artist }}</div>
            </div>
            <div class="info-bottom">
              <div class="count-badge">{{ item.count }} 作品</div>
              <router-link class="view-btn" :to="`/artist/${encodeURIComponent(item.artist)}`">
                查看作品 <span class="arrow">→</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 哨兵 -->
    <div ref="scrollSentinel" class="scroll-sentinel"></div>

    <!-- tip -->
    <div class="loading-tip" :style="{ opacity: tipOpacity }">{{ tipText }}</div>

    <!-- Lightbox -->
    <div class="lightbox" :class="{ active: lightboxOpen }" @click="closeLightbox">
      <div class="lb-close">×</div>
      <img class="lb-img" :src="lightboxUrl" alt="Preview" @click.stop />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, nextTick, watch, inject } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useMasonry } from '../composables/useMasonry'

const route = useRoute()

// ✅ 注入 App.vue 提供的背景控制函数
// 注意：你的 App.vue 里 provide 的名字是 'setAppBackground' 和 'resetAppBackground'
const setAppBackground = inject('setAppBackground')
const resetAppBackground = inject('resetAppBackground')

/** 数据 */
const artists = ref([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)

const tipOpacity = ref(0)
const tipText = ref('加载中...')

/** 路由 q */
const q = computed(() => (route.query.q || '').toString().trim())

/** 列数 */
const getColumnCount = () => {
  const w = window.innerWidth
  if (w < 640) return 2
  if (w < 1024) return 3
  if (w < 1400) return 4
  return 5
}

const columnCount = ref(getColumnCount())
const { columns, addItems, reset } = useMasonry(columnCount)

/** 图片加载 */
const loadedCovers = ref(new Set())
const onCoverLoaded = (cover) => loadedCovers.value.add(cover)

const getPadding = (item) => {
  const w = item.width || 3
  const h = item.height || 4
  return `${(h / w) * 100}%`
}

/** tip */
const showTip = (text, duration = 1500) => {
  tipText.value = text
  tipOpacity.value = 1
  if (duration > 0) setTimeout(() => (tipOpacity.value = 0), duration)
}

/** 拉取 */
const loadArtists = async (append = false) => {
  if (loading.value || !hasMore.value) return
  loading.value = true
  if (append) showTip('加载中...', 0)

  try {
    const { data } = await axios.get('/api/artists', {
      params: { format: 'json', page: page.value, q: q.value }
    })

    if (!data || data.length === 0) {
      hasMore.value = false
      showTip('没有更多了', 1800)
      return
    }

    // 仅在第一页且无搜索关键词时更新背景
    if (page.value === 1 && q.value === '' && data.length > 0) {
      if (setAppBackground) {
        // 🎲 随机算法：从当前获取的列表(data)中随机选一个索引
        const randomIndex = Math.floor(Math.random() * data.length)
        const randomArtist = data[randomIndex]

        setAppBackground({
          url: `/image/${randomArtist.cover}`, // 使用随机画师的封面
          dim: 0.6 // 遮罩浓度
        })
      }
    }

    if (append) {
      artists.value.push(...data)
      addItems(data)
    } else {
      artists.value = data
      reset()
      addItems(data)
    }

    hasMore.value = data.length === 50
    page.value += 1
    tipOpacity.value = 0
  } catch (e) {
    console.error(e)
    showTip('加载失败', 2000)
  } finally {
    loading.value = false
  }
}

const resetState = () => {
  page.value = 1
  hasMore.value = true
  artists.value = []
  loadedCovers.value = new Set()
  // 重置时如果不希望清除背景，这行可以删掉；或者调用 resetAppBackground
  reset()
  loadArtists(false)
}

/** IO */
const scrollSentinel = ref(null)
let observer = null

const setupObserver = async () => {
  await nextTick()
  if (!scrollSentinel.value) return
  if (observer) observer.disconnect()
  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) loadArtists(true)
  }, { rootMargin: '1000px' })
  observer.observe(scrollSentinel.value)
}

const handleResize = () => {
  const newCount = getColumnCount()
  if (newCount !== columnCount.value) {
    columnCount.value = newCount
    const all = artists.value.slice()
    reset()
    addItems(all)
  }
}

/** Lightbox */
const lightboxOpen = ref(false)
const lightboxUrl = ref('')
const openLightbox = (url) => {
  lightboxUrl.value = url
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}
const closeLightbox = () => {
  lightboxOpen.value = false
  setTimeout(() => {
    lightboxUrl.value = ''
    document.body.style.overflow = 'auto'
  }, 200)
}
const onKeydown = (e) => {
  if (e.key === 'Escape') closeLightbox()
}

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  document.addEventListener('keydown', onKeydown)
  resetState()
  await setupObserver()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('keydown', onKeydown)
  if (observer) observer.disconnect()
  
  // ✅ 离开页面时恢复默认背景
  if (resetAppBackground) {
    resetAppBackground()
  }
})

watch(() => q.value, () => resetState())
</script>

<style scoped>
/* 友站同款：隐藏滚动条 */
::-webkit-scrollbar { width: 0px; background: transparent; }
html { -ms-overflow-style: none; scrollbar-width: none; }

/* 页面 */
.artists-page {
  min-height: 100vh;
  /* 背景透明，透出 App.vue 的背景 */
  background: transparent;
  color: var(--text-primary);
  overflow-x: hidden;
  transition: color 0.3s ease;
}

/* ❌ 已删除 .bg-layer 相关样式 */

/* 瀑布流容器 */
.masonry-wrap {
  display: flex;
  gap: 12px;
  padding: 16px;
  padding-top: 12px; /* 兼容 App.vue 顶栏 */
  align-items: flex-start;
}
@media(min-width: 768px) {
  .masonry-wrap {
    padding: 30px;
    padding-top: 40px;
    gap: 18px;
    max-width: 1800px;
    margin: 0 auto;
  }
}
.masonry-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
@media(min-width: 768px) { .masonry-col { gap: 18px; } }

/* 卡片 */
.artist-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s, background-color 0.3s, border-color 0.3s;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
}
.artist-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  z-index: 10;
  background: var(--bg-card-hover);
  border-color: var(--border-color-hover);
}

.cover-area { position: relative; width: 100%; cursor: zoom-in; }
.placeholder { 
  width: 100%; 
  background: var(--bg-secondary);
  transition: background-color 0.3s;
}
.card-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.4s;
}
.card-img.loaded { opacity: 1; }

.zoom-hint {
  position: absolute;
  top: 10px; right: 10px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border-radius: 50%;
  width: 32px; height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}
.cover-area:hover .zoom-hint { opacity: 1; }

.info-bar {
  padding: 12px 14px;
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--border-color);
  transition: background-color 0.3s, border-color 0.3s;
}
.artist-card:hover .info-bar {
  background: var(--bg-card-hover);
  border-color: var(--border-color-hover);
}

.artist-name {
  font-weight: 700;
  font-size: 15px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  transition: color 0.3s;
}

.info-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.count-badge {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--input-bg);
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.3s, color 0.3s;
}

.view-btn {
  background: var(--accent-color);
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 99px;
  text-decoration: none;
  transition: background-color 0.2s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.view-btn:hover { background: var(--accent-color-hover); }
.view-btn:active { transform: scale(0.95); }
.arrow { font-size: 14px; }

/* 哨兵 */
.scroll-sentinel { height: 1px; margin: 20px 0; }

/* tip */
.loading-tip {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--overlay-bg);
  color: var(--text-primary);
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 12px;
  box-shadow: var(--shadow-md);
  opacity: 0;
  transition: opacity 0.2s, background-color 0.3s, color 0.3s;
  pointer-events: none;
  z-index: 60;
}

/* Lightbox */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0,0,0,0.95);
  display: none;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s;
}
.lightbox.active { display: flex; opacity: 1; }
.lb-img {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 4px;
  box-shadow: 0 0 30px rgba(0,0,0,0.5);
  object-fit: contain;
  transform: scale(0.95);
  transition: transform 0.3s;
}
.lightbox.active .lb-img { transform: scale(1); }
.lb-close {
  position: absolute;
  top: 18px;
  right: 20px;
  color: #fff;
  font-size: 34px;
  cursor: pointer;
  opacity: 0.7;
  user-select: none;
}
.lb-close:hover { opacity: 1; }
</style>



