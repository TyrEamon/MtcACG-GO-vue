<template>
  <div class="detail-page" v-if="image">
    <div class="detail-container">
      <!-- ✅ 看图区包一层：让 prev/next 永远以“看图区”居中定位 -->
      <div class="viewer-wrap">
        <div class="left-viewer">
          <div v-if="imageLoading" class="image-loading">
            <div class="loading-container">
              <div class="loading-spinner"></div>
              <div class="loading-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
            <p class="loading-text">加载中<span class="loading-ellipsis"></span></p>
          </div>

          <div class="image-wrapper" :class="{ 'image-hidden': imageLoading }">
            <img
              :src="`/image/${currentImage.file_name}`"
              :alt="image.caption"
              @click="openLightbox"
              @load="onImageLoad"
              @error="onImageError"
              class="main-image"
              :style="imageFitStyle"
            />

          </div>
        </div>

        <!-- 导航按钮（定位参照：.viewer-wrap） -->
        <button
          v-if="siblings.length > 1"
          class="nav-btn prev"
          @click="prevImage"
          :disabled="currentIndex === 0"
          aria-label="Previous"
        >
          ❮
        </button>
        <button
          v-if="siblings.length > 1"
          class="nav-btn next"
          @click="nextImage"
          :disabled="currentIndex === siblings.length - 1"
          aria-label="Next"
        >
          ❯
        </button>
      </div>

      <!-- ✅ 右侧 6 卡片区（固定宽 400px） -->
      <div class="right-panel">
        <!-- ① 标题卡片：标题 + 分割线 + ID -->
        <div class="panel-card title-card">
          <h1 class="title">
            {{ cleanTitle }}
            <span v-if="siblings.length > 1" class="title-page">
              [P{{ currentIndex + 1 }}/{{ siblings.length }}]
            </span>
          </h1>
          <div class="divider"></div>
          <div class="id-row">ID: {{ image.id }}</div>
        </div>

        <!-- ② 画师卡片：人像 SVG + Artist(画师) + 🎨 -->
        <div class="panel-card artist-card" :class="{ disabled: !image.artist }">
          <router-link
            v-if="image.artist"
            :to="`/artist/${encodeURIComponent(image.artist)}`"
            class="row-link"
          >
            <span class="row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <div class="row-main">
              <div class="row-title">Artist(画师)：{{ image.artist }}</div>
              <div class="row-sub">点击进入画师页面</div>
            </div>
            <span class="row-tail" aria-hidden="true">🎨</span>
          </router-link>

          <div v-else class="row-link no-link">
            <span class="row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <div class="row-main">
              <div class="row-title">Artist(画师)：Unknown</div>
              <div class="row-sub">暂无画师信息</div>
            </div>
            <span class="row-tail" aria-hidden="true">🎨</span>
          </div>
        </div>

        <!-- ③ 上传平台卡片：云朵 SVG + 平台徽章 -->
        <div class="panel-card platform-card">
          <div class="row">
            <span class="row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.9A4 4 0 0 0 6 19h11.5z"/>
              </svg>
            </span>
            <div class="row-main">
              <div class="row-title">Platform</div>
              <div class="row-sub">上传来源 / 跳转链接</div>
            </div>
          </div>

          <div class="pill-wrap">
            <span
              v-for="b in platformBadges"
              :key="b.text"
              class="pill"
              :class="b.class"
              :title="b.text"
            >
             {{ b.text }}
            </span>
          </div>

        </div>

        <!-- ④ 尺寸卡片：图片 SVG + 1080×1920 -->
        <div class="panel-card size-card">
          <div class="row">
            <span class="row-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <path d="M8 13l2-2 4 4 3-3 3 3"/>
                <path d="M9 9h.01"/>
              </svg>
            </span>

            <div class="row-main">
              <div class="row-title">Size</div>
              <div class="row-sub"> {{ imageSizeText }} </div>
            </div>
          </div>
        </div>

        <!-- ⑤ 标签卡片：TAGS + 分割线 + 标签 -->
        <div class="panel-card tags-card" v-if="tags.length > 0">
          <div class="tags-head">
            <div class="tags-title">TAGS</div>
            <div class="divider"></div>
          </div>

          <div class="tags-scroll">
            <router-link
              v-for="tag in tags"
              :key="tag"
              :to="`/?q=${encodeURIComponent(tag)}`"
              class="tag"
            >
              #{{ tag }}
            </router-link>
          </div>
        </div>

        <!-- ⑥ 底部操作卡片：返回 / 下载 / 按画师搜索（简约 SVG） -->
        <div class="panel-card action-card">
          <button class="action-btn" type="button" @click="goBack" aria-label="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <a
            class="action-btn action-link"
            :href="`/image/${currentImage.origin_id || currentImage.file_name}?dl=jpg`"
            download
            aria-label="Download Original"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3v10" />
              <path d="M7 10l5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          </a>

          <router-link
            v-if="image.artist"
            class="action-btn action-link"
            :to="`/artist/${encodeURIComponent(image.artist)}`"
            aria-label="Search by Artist"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="5" width="18" height="14" rx="2"/>
              <path d="M8 13l2-2 4 4 3-3 3 3"/>
            </svg>
          </router-link>

          <button v-else class="action-btn" type="button" disabled aria-label="Search by Artist disabled">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="5" width="18" height="14" rx="2"/>
              <path d="M8 13l2-2 4 4 3-3 3 3"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 相关推荐 -->
    <div class="recommendations" v-if="relatedPosts.length > 0">
      <div class="rec-header">
        <h2 class="rec-title">{{ isRandomRecommendations ? '随机推荐' : '相关推荐' }}</h2>
        <button class="refresh-btn" @click="refreshRecommendations" :disabled="refreshing">
          <svg class="refresh-icon" :class="{ spinning: refreshing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          换一批
        </button>
      </div>

      <div class="rec-grid">
        <router-link
          v-for="post in displayedPosts"
          :key="post.id"
          :to="`/detail/${post.id}`"
          class="rec-item"
        >
          <img :src="`/image/${post.file_name}`" :alt="post.caption" loading="lazy">
          <div class="rec-overlay">
            <span class="rec-title-text">{{ cleanPostTitle(post.caption) }}</span>
          </div>
        </router-link>
      </div>
    </div>

    <!-- 灯箱 -->
    <transition name="lightbox-fade">
      <div v-if="showLightbox" class="lightbox" @click="closeLightbox">
        <img :src="`/image/${currentImage.file_name}`" @click.stop>
        <button class="lightbox-close" @click="closeLightbox">✕</button>
      </div>
    </transition>
  </div>

  <div v-else class="loading">
    <div class="spinner"></div>
    <p>加载中...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const goBack = () => router.back()

const setAppBackground = inject('setAppBackground', null)
const resetAppBackground = inject('resetAppBackground', null)

const image = ref(null)
const siblings = ref([])
const relatedPosts = ref([])
const randomPool = ref([])
const currentIndex = ref(0)
const showLightbox = ref(false)
const imageLoading = ref(true)
const isRandomRecommendations = ref(false)
const refreshing = ref(false)
const artistProfile = ref(null)

const isMobile = ref(false)
const updateIsMobile = () => {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth <= 768
}

const currentImage = computed(() => siblings.value[currentIndex.value] || image.value)

// 用于兜底：有些数据 width/height 可能为空，图片 load 后用 naturalWidth/Height 补上
const naturalSize = ref({ w: 0, h: 0 })

// 参考友站：portrait 用宽高比控制显示宽度，避免“大竖图”直接铺满
const imageFitStyle = computed(() => {
  const w =
    currentImage.value?.width ||
    image.value?.width ||
    naturalSize.value.w

  const h =
    currentImage.value?.height ||
    image.value?.height ||
    naturalSize.value.h

  if (!w || !h) return { width: '100%' }

  const ratio = w / h

  // 横图：全宽
  if (ratio >= 1) return { width: '100%' }

  // 竖图：按比例给宽度，并做个上下限，避免太窄/太宽
  const pct = Math.min(92, Math.max(45, ratio * 100))
  return { width: `${pct}%` }
})

const PLATFORM_ORDER = ['mtcacg', 'pixiv', 'yande', 'manual']

const platformBadges = computed(() => {
  const text = String(artistProfile.value?.platformText || '')
  const low = text.toLowerCase()

  // ✅ 直接扫关键词：哪怕是 "Pixiv / MtcACG"、"yande.re + mtcacg" 也能识别成多个
  const found = PLATFORM_ORDER.filter(k => low.includes(k))

  // ✅ 如果 profile 没拿到（或为空），用当前图的 id/origin_id 前缀兜底
  if (!found.length) {
    const origin =
      currentImage.value?.origin_id ||
      image.value?.origin_id ||
      image.value?.id ||
      ''
    const m = String(origin).toLowerCase().match(/^(mtcacg|pixiv|yande|manual)_/)
    if (m) found.push(m[1])
  }

  const keys = new Set(found)

  return PLATFORM_ORDER
    .filter(k => keys.has(k))
    .map(k => {
      if (k === 'pixiv') return { text: 'pixiv', class: 'pill-pixiv' }
      if (k === 'yande') return { text: 'yande', class: 'pill-yande' }
      if (k === 'mtcacg') return { text: 'mtcacg', class: 'pill-mtc' }
      if (k === 'manual') return { text: 'manual', class: 'pill-manual' }
      return { text: k, class: 'pill-other' }
    })
})


const tags = computed(() => {
  if (!image.value?.tags) return []
  return image.value.tags.trim().split(' ').filter(Boolean)
})

const cleanTitle = computed(() => {
  if (!image.value?.caption) return '无标题'
  let title = image.value.caption
  const match = title.match(/^.+?:\s*(.+?)\s+Artist:/i)
  if (match) title = match[1].trim()
  title = title.replace(/\s*\[P\d+\/\d+\]\s*$/i, '').trim()
  title = title.replace(/\s+Tags:.*$/i, '').trim()
  return title || '无标题'
})

const cleanPostTitle = (caption) => {
  if (!caption) return '无标题'
  let title = caption
  const match = title.match(/^.+?:\s*(.+?)\s+Artist:/i)
  if (match) title = match[1].trim()
  title = title.replace(/\s*\[P\d+\/\d+\]\s*$/i, '').trim()
  title = title.replace(/\s+Tags:.*$/i, '').trim()
  return (title || '无标题').substring(0, 30)
}

//徽章点击跳转资源平台，待后续完善。//
const extractPlatformKey = (raw) => {
  if (!raw) return null
  const m = String(raw).trim().match(/^(mtcacg|pixiv|yande|manual)_/i)
  return m ? m[1].toLowerCase() : null
}

const buildPlatformUrl = (key) => {
  const sourceUrl = image.value?.source || ''
  const origin = currentImage.value?.origin_id || image.value?.origin_id || ''

  const fromOrigin = (re) => {
    const mm = String(origin).match(re)
    return mm ? mm[1] : ''
  }

  if (key === 'pixiv') {
    const pid = image.value?.pixiv_id || fromOrigin(/^pixiv_(\d+)/i)
    return pid ? `https://www.pixiv.net/artworks/${pid}` : (sourceUrl || '#')
  }
  if (key === 'yande') {
    const yid = fromOrigin(/^yande_(\d+)/i)
    return yid ? `https://yande.re/post/show/${yid}` : (sourceUrl || '#')
  }
  if (key === 'manual') {
    return sourceUrl || '#'
  }
  return image.value?.artist
    ? `/artist/${encodeURIComponent(image.value.artist)}`
    : '/'
}
//这里结束//

const imageSizeText = computed(() => {
  const w = currentImage.value?.width || image.value?.width
  const h = currentImage.value?.height || image.value?.height
  return (w && h) ? `${w}×${h}` : 'Unknown'
})

const displayedPosts = computed(() => {
  const targetLimit = isMobile.value ? 8 : 14
  return relatedPosts.value.slice(0, targetLimit)
})

const applyDetailBackgroundOnce = () => {
  const file = image.value?.file_name
  if (!file) return
  if (typeof setAppBackground === 'function') {
    setAppBackground({
      url: `/image/${file}`,
      dim: 0.75
    })
  }
}

const onImageLoad = (e) => {
  const img = e.target
  naturalSize.value = { w: img.naturalWidth, h: img.naturalHeight }
  imageLoading.value = false
}

const onImageError = () => { imageLoading.value = false }

const loadDetail = async () => {
  try {
    const id = route.params.id
    const { data } = await axios.get(`/api/detail/${id}`)

    image.value = data.image
    siblings.value = data.siblings || [data.image]

    currentIndex.value = siblings.value.findIndex(x => x.id === image.value.id)
    if (currentIndex.value === -1) currentIndex.value = 0

    await loadArtistProfileForBadges()

    applyDetailBackgroundOnce()
    await loadRelatedPosts()
  } catch (error) {
    console.error('加载失败:', error)
  }
}

const loadArtistProfileForBadges = async () => {
  try {
    const name = image.value?.artist
    if (!name) {
      artistProfile.value = null
      return
    }

    // ✅ 跟 ArtistProfile 页面一致：page/limit
    const { data } = await axios.get(
      `/api/artist/${encodeURIComponent(name)}`,
      { params: { page: 1, limit: 30 } }
    )

    artistProfile.value = data?.profile || null
  } catch (e) {
    console.error('加载画师平台信息失败:', e)
    artistProfile.value = null
  }
}


const loadRandomPool = async () => {
  try {
    const { data } = await axios.get('/api/posts', { params: { limit: 50, sort: 'random' } })
    randomPool.value = data.filter(p => p.id !== image.value.id)
  } catch (error) {
    console.error('加载随机池失败:', error)
    randomPool.value = []
  }
}

const fillRecommendations = (posts, targetCount) => {
  if (posts.length >= targetCount) return posts.slice(0, targetCount)

  const needCount = targetCount - posts.length
  const existingIds = new Set([...posts.map(p => p.id), image.value.id])
  const fillers = randomPool.value
    .filter(p => !existingIds.has(p.id))
    .slice(0, needCount)

  return [...posts, ...fillers]
}

const loadRelatedPosts = async () => {
  try {
    const targetLimit = isMobile.value ? 8 : 14
    await loadRandomPool()

    if (tags.value.length) {
      const searchTag = tags.value[0]
      const { data } = await axios.get('/api/posts', { params: { q: searchTag, limit: 30 } })
      const filtered = data.filter(p => p.id !== image.value.id)

      if (filtered.length > 0) {
        relatedPosts.value = fillRecommendations(filtered, targetLimit)
        isRandomRecommendations.value = false
        return
      }
    }

    relatedPosts.value = randomPool.value.slice(0, targetLimit)
    isRandomRecommendations.value = true
  } catch (error) {
    console.error('加载相关推荐失败:', error)
    relatedPosts.value = []
  }
}

const refreshRecommendations = async () => {
  if (refreshing.value) return
  refreshing.value = true

  try {
    const targetLimit = isMobile.value ? 8 : 14
    await loadRandomPool()

    if (isRandomRecommendations.value) {
      relatedPosts.value = randomPool.value.slice(0, targetLimit)
    } else {
      if (tags.value.length) {
        const searchTag = tags.value[Math.floor(Math.random() * tags.value.length)]
        const { data } = await axios.get('/api/posts', { params: { q: searchTag, limit: 30 } })
        const filtered = data.filter(p =>
          p.id !== image.value.id && !relatedPosts.value.some(rp => rp.id === p.id)
        )

        if (filtered.length > 0) {
          relatedPosts.value = fillRecommendations(filtered, targetLimit)
        } else {
          relatedPosts.value = randomPool.value.slice(0, targetLimit)
          isRandomRecommendations.value = true
        }
      }
    }
  } catch (error) {
    console.error('刷新推荐失败:', error)
  } finally {
    setTimeout(() => { refreshing.value = false }, 500)
  }
}

const prevImage = () => {
  if (currentIndex.value > 0) {
    imageLoading.value = true
    currentIndex.value--
  }
}

const nextImage = () => {
  if (currentIndex.value < siblings.value.length - 1) {
    imageLoading.value = true
    currentIndex.value++
  }
}

const openLightbox = () => { showLightbox.value = true }
const closeLightbox = () => { showLightbox.value = false }

const handleKeydown = (e) => {
  if (showLightbox.value && e.key === 'Escape') closeLightbox()
  if (!showLightbox.value) {
    if (e.key === 'ArrowLeft') prevImage()
    if (e.key === 'ArrowRight') nextImage()
  }
}

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)

  loadDetail()
  window.addEventListener('keydown', handleKeydown)
})

watch(() => route.params.id, () => {
  imageLoading.value = true
  loadDetail()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', updateIsMobile)
  if (typeof resetAppBackground === 'function') resetAppBackground()
})
</script>

<style scoped>
.detail-page {
  position: relative;
  min-height: 100vh;
  padding-top: 8px;
  padding-bottom: 20px;
  color: var(--text-primary);
}

#app[data-theme="light"] .detail-page {
  --detail-stripe-a: #ff9acb;
  --detail-stripe-b: #bfe9ff;
  --detail-stripe-c: #ffffff;
}

#app[data-theme="dark"] .detail-page {
  --detail-stripe-a: #d45d9d;
  --detail-stripe-b: #5aa1d6;
  --detail-stripe-c: #2c2c35;
}

.detail-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 12px;
  display: flex;
  gap: 16px;
  height: calc(100vh - 90px);
  min-height: 600px;
  position: relative;
}

/* ✅ 看图区容器：prev/next 以它为参照居中 */
.viewer-wrap {
  flex: 1;
  min-width: 0;
  height: 100%;
  position: relative;
}

/* 左侧看图区（保持你之前“关掉大面积磨砂”的流畅策略） */
.left-viewer {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 16px;
  overscroll-behavior: contain;

  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);

  padding: 0;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  will-change: scroll-position;
  -webkit-overflow-scrolling: touch;
}

#app[data-theme="light"] .detail-page .viewer-wrap,
#app[data-theme="dark"] .detail-page .viewer-wrap,
#app[data-theme="light"] .detail-page .panel-card,
#app[data-theme="dark"] .detail-page .panel-card {
  position: relative;
}

#app[data-theme="light"] .detail-page .viewer-wrap::before,
#app[data-theme="dark"] .detail-page .viewer-wrap::before,
#app[data-theme="light"] .detail-page .panel-card::before,
#app[data-theme="dark"] .detail-page .panel-card::before {
  content: '';
  position: absolute;
  inset: -3px;
  padding: 4px;
  border-radius: 18px;
  background: repeating-linear-gradient(
    135deg,
    var(--detail-stripe-a) 0 14px,
    var(--detail-stripe-b) 14px 28px,
    var(--detail-stripe-c) 28px 42px
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 0;
}

#app[data-theme="light"] .detail-page .panel-card::before,
#app[data-theme="dark"] .detail-page .panel-card::before {
  border-radius: 19px;
}

#app[data-theme="light"] .detail-page .viewer-wrap > .left-viewer,
#app[data-theme="dark"] .detail-page .viewer-wrap > .left-viewer {
  z-index: 1;
}

#app[data-theme="light"] .detail-page .panel-card > *,
#app[data-theme="dark"] .detail-page .panel-card > * {
  position: relative;
  z-index: 1;
}

.left-viewer::-webkit-scrollbar { width: 8px; }
.left-viewer::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.image-loading {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--text-secondary);
  z-index: 10; gap: 20px;
}
.loading-container { position: relative; width: 80px; height: 80px; }
.loading-spinner {
  width: 60px; height: 60px;
  border: 5px solid rgba(255, 255, 255, 0.12);
  border-top: 5px solid #0096fa;
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  position: absolute; top: 10px; left: 10px;
  box-shadow: 0 0 20px rgba(0, 150, 250, 0.2);
}
.loading-dots {
  position: absolute; bottom: 0; left: 50%;
  transform: translateX(-50%); display: flex; gap: 6px;
}
.loading-dots span {
  width: 8px; height: 8px;
  background: #0096fa;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
  box-shadow: 0 0 10px rgba(0, 150, 250, 0.4);
}
.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
.loading-dots span:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.image-wrapper {
  display: flex;
  width: 100%;
  min-height: 100%;
  line-height: 0;
  opacity: 1;
  transition: opacity 0.25s;
  justify-content: center;
  align-items: flex-start;
}
.image-wrapper.image-hidden { opacity: 0; pointer-events: none; }

.main-image{
  display: block;
  max-width: 100%;
  height: auto;
}

/* 导航按钮（定位：.viewer-wrap） */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);

  width: 48px;
  height: 48px;

  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #fff;

  border-radius: 50%;
  font-size: 22px;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 40;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
}
.nav-btn.prev { left: 14px; }
.nav-btn.next { right: 14px; }
.nav-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.48);
  border-color: rgba(255, 255, 255, 0.32);
  transform: translateY(-50%) scale(1.06);
}
.nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* ✅ 右侧固定宽 400px */
.right-panel {
  flex: 0 0 400px;
  width: 400px;
  max-width: 400px;

  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  overflow: hidden;
}

/* ✅ 通用卡片：轻拟态（无大面积磨砂，保证流畅） */
.panel-card {
  background: rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.20);
  overflow: hidden;
  flex-shrink: 0;
}


/* 顶部标题卡 */
.title-card { padding: 18px 18px 14px; }
.title {
  font-size: 20px;
  margin: 0;
  line-height: 1.35;
  font-weight: 800;
  letter-spacing: 0.2px;
}
.title-page {
  color: var(--text-tertiary);
  font-size: 14px;
  font-weight: 600;
  margin-left: 8px;
}
.divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.25), rgba(255,255,255,0.10));
  margin: 12px 0 10px;
}
.id-row {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  color: var(--text-tertiary);
  font-size: 13px;
}

/* 行式内容（图标 + 文本 + 尾部） */
.row-link, .row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
}
.row-link {
  color: var(--text-primary);
  text-decoration: none;
}
.row-link:hover { background: rgba(255,255,255,0.04); }
.no-link { cursor: default; }
.row-icon {
  width: 34px; height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.10);
  flex-shrink: 0;
}
.row-icon svg { width: 18px; height: 18px; }
.row-main { flex: 1; min-width: 0; }
.row-title {
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.size-card .row-sub {
  color: var(--text-primary);
  opacity: 0.92;
  font-weight: 800;
}
.row-tail { opacity: 0.85; font-size: 16px; }

/* 画师卡 disabled */
.artist-card.disabled { opacity: 0.75; }

/* 平台徽章（调矮一点，给 TAGS 让位） */
.platform-card { padding-bottom: 8px; }
.platform-card .row { padding: 12px 16px; }
.platform-card .row-sub { display: none; } /* 平台说明行隐藏，立刻省高度 */
.pill-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 12px;
}
.pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;    /* 徽章高度略矮 */
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06);
  color: #fff;
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}
.pill:hover { transform: translateY(-1px); background: rgba(255,255,255,0.10); }

/* pixiv：p站蓝 */
.pill-pixiv {
  background: rgba(0, 150, 250, 0.12);
  border-color: rgba(0, 150, 250, 0.35);
  color: #0096fa;
}

/* yande：樱桃红 */
.pill-yande {
  background: rgba(255, 77, 109, 0.12);
  border-color: rgba(255, 77, 109, 0.35);
  color: #ff4d6d;
}

/* mtcacg：橙色 */
.pill-mtc {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.35);
  color: #f59e0b;
}

/* manual：粉色 */
.pill-manual {
  background: rgba(236, 72, 153, 0.12);
  border-color: rgba(236, 72, 153, 0.35);
  color: #ec4899;
}

.pill-other {
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.25);
  color: var(--text-secondary);
}

/* TAGS 卡片：让它“更愿意长高” */
.tags-card {
  display: flex;
  flex-direction: column;
  flex: 1 1 340px;  /* ✅ 关键：提高 basis，让 tags 默认更高 */
  min-height: 0;
}
.tags-head { padding: 14px 16px 0; }
.tags-title { font-size: 14px; font-weight: 800; letter-spacing: 0.12em; opacity: 0.9; }
.tags-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
  -webkit-overflow-scrolling: touch;
}
.tags-scroll::-webkit-scrollbar { width: 6px; }
.tags-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.16); border-radius: 3px; }

.tag {
  background: var(--input-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 13px;
  text-decoration: none;
  transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
}
.tag:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-color-hover);
  color: var(--accent-color);
  transform: translateY(-1px);
}


/* 底部操作卡片 */
.action-card {
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}
.action-btn {
  width: 46px;
  height: 46px;
  border-radius: 14px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.18);
  color: #fff;

  cursor: pointer;
  transition: background 0.18s, border-color 0.18s, transform 0.18s;
}
.action-btn svg {
  width: 20px;
  height: 20px;
  stroke-width: 2.2;
}
.action-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.10);
  border-color: rgba(255,255,255,0.22);
  transform: translateY(-1px);
}
.action-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.action-link { text-decoration: none; }

.action-card .action-btn:nth-child(1) {
  color: #ff8bc5;
  border-color: rgba(255, 139, 197, 0.65);
  background: rgba(255, 139, 197, 0.12);
}
.action-card .action-btn:nth-child(1):hover:not(:disabled) {
  background: rgba(255, 139, 197, 0.2);
  box-shadow: 0 8px 18px rgba(255, 139, 197, 0.32);
}

.action-card .action-btn:nth-child(2) {
  color: #7fd3ff;
  border-color: rgba(127, 211, 255, 0.65);
  background: rgba(127, 211, 255, 0.12);
}
.action-card .action-btn:nth-child(2):hover:not(:disabled) {
  background: rgba(127, 211, 255, 0.2);
  box-shadow: 0 8px 18px rgba(127, 211, 255, 0.32);
}

.action-card .action-btn:nth-child(3) {
  color: #b28cff;
  border-color: rgba(178, 140, 255, 0.65);
  background: rgba(178, 140, 255, 0.12);
}
.action-card .action-btn:nth-child(3):hover:not(:disabled) {
  background: rgba(178, 140, 255, 0.2);
  box-shadow: 0 8px 18px rgba(178, 140, 255, 0.32);
}

/* 推荐列表（保留你原来逻辑 + 去掉 hover transform 造成的“果冻感”已在你那边处理） */
.recommendations {
  max-width: 100%;
  margin: 30px auto 0;
  padding: 30px 12px 0;
  position: relative;
}
.recommendations::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 0;
  right: 0;
  height: 8px;
  border-radius: 999px;
  background: repeating-linear-gradient(
    135deg,
    var(--detail-stripe-a) 0,
    var(--detail-stripe-a) 14px,
    var(--detail-stripe-b) 14px,
    var(--detail-stripe-b) 28px,
    var(--detail-stripe-c) 28px,
    var(--detail-stripe-c) 42px
  );
  box-shadow: 0 6px 14px rgba(255, 154, 203, 0.25);
}
.rec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.rec-title { font-size: 20px; color: var(--text-primary); font-weight: 700; margin: 0; }

.refresh-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 16px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.refresh-btn:hover:not(:disabled) {
  background: var(--bg-card-hover);
  border-color: var(--accent-color);
  color: var(--accent-color);
  transform: none;
}
.refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.refresh-icon { width: 16px; height: 16px; transition: transform 0.5s ease; }
.refresh-icon.spinning { animation: rotate 0.8s linear infinite; }
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.rec-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 14px; }
.rec-item {
  aspect-ratio: 3/4;
  border-radius: 10px;
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  position: relative;
  text-decoration: none;
  transform: translate3d(0, 0, 0);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.rec-item:hover {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}
.rec-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.25s ease;
}
.rec-item:hover img { transform: scale(1.06); }
.rec-overlay {
  position: absolute; bottom: 0; left: 0; right: 0; padding: 10px;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.2s, transform 0.2s;
}
.rec-item:hover .rec-overlay { opacity: 1; transform: translateY(0); }
.rec-title-text {
  color: white; font-size: 12px; font-weight: 500; display: block;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.4;
}

/* Lightbox */
.lightbox {
  position: fixed; inset: 0; background: rgba(0,0,0,0.95);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; cursor: zoom-out;
}
.lightbox img {
  max-width: 95vw; max-height: 95vh; object-fit: contain;
  border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.8);
}
.lightbox-close {
  position: absolute; top: 20px; right: 20px;
  width: 50px; height: 50px;
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
  border-radius: 50%; color: white;
  font-size: 24px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s, background 0.2s;
}
.lightbox-close:hover { background: rgba(255,255,255,0.2); transform: rotate(90deg); }
.lightbox-fade-enter-active, .lightbox-fade-leave-active { transition: opacity 0.2s; }
.lightbox-fade-enter-from, .lightbox-fade-leave-to { opacity: 0; }

.loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 60vh; color: var(--text-secondary);
}
.spinner {
  width: 50px; height: 50px;
  border: 4px solid rgba(255,255,255,0.12);
  border-top: 4px solid #0096fa;
  border-radius: 50%; animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

/* 响应式 */
@media (max-width: 1400px) { .rec-grid { grid-template-columns: repeat(5, 1fr); } }

@media (max-width: 1023px) {
  .detail-container { flex-direction: column; height: auto; min-height: auto; gap: 16px; }
  .viewer-wrap { width: 100%; }
  .left-viewer { height: auto; min-height: 400px; }

  /* ✅ 小屏右侧改为 100% */
  .right-panel {
    flex: none;
    width: 100%;
    max-width: none;
    height: auto;
  }

  .tags-card { max-height: 300px; }
  .nav-btn { width: 42px; height: 42px; }
}

@media (max-width: 768px) {
  .rec-grid { grid-template-columns: repeat(3, 1fr); }
  .detail-page { padding-top: 5px; }

  .detail-container {
    padding: 0;
    gap: 0;
    height: auto;
    min-height: auto;
    flex-direction: column;
  }

  /* ✅ 手机端看图区给稳定高度：prev/next 不会随图片加载抖动 */
  .viewer-wrap {
    height: min(62svh, 520px);
    min-height: 280px;
  }

  .left-viewer {
    height: 100% !important;
    min-height: 0 !important;
    border-radius: 0;
    border-left: none;
    border-right: none;
    background: transparent;
    box-shadow: none;
  }

  .image-wrapper {
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .main-image {
    max-width: 98%;
    height: auto;
    object-fit: contain;
  }

  .nav-btn {
    width: 38px;
    height: 38px;
    font-size: 16px;
  }
  .nav-btn.prev { left: 10px; }
  .nav-btn.next { right: 10px; }
  .nav-btn:hover:not(:disabled) { transform: translateY(-50%); }

  .right-panel { padding: 10px; box-sizing: border-box; }

  .rec-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .refresh-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) { .rec-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
