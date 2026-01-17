<template>
  <!-- ✅ template 完全不变 -->
  <div class="artist-page" v-if="artistData">
    <div class="artist-header">
      <div class="profile-card">
        <div class="profile-main">
          <div class="avatar" :style="{ backgroundImage: `url(/image/${artistData.cover1})` }"></div>

          <div class="profile-info">
            <div class="name-row">
              <h1>{{ artistData.artist }}</h1>
            </div>

            <div class="badge-row">
              <span
                v-for="badge in platformBadges"
                :key="badge.text"
                class="platform-badge"
                :class="badge.class"
              >
                {{ badge.icon }} {{ badge.text }}
              </span>
              <span class="meta-tag">MtcACG</span>
            </div>

            <div class="stat-grid">
              <div class="stat-item">
                <div class="stat-label"><span class="dot dot-green"></span>Total</div>
                <div class="stat-value">{{ artistData.count }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label"><span class="dot dot-blue"></span>Last Update</div>
                <div class="stat-value">{{ artistData.updateTime }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label"><span class="dot dot-purple"></span>Platform</div>
                <div class="stat-value stat-platform">{{ artistData.platformText }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="gallery-header">
        <div class="gallery-title-left">
          <div class="accent-bar"></div>
          <div>
            <h2>Gallery</h2>
            <span class="subtitle">Selected Works</span>
          </div>
        </div>
        <div class="gallery-title-right">
          <span class="gallery-count">{{ artistData.count }} ITEMS</span>
        </div>
      </div>

      <div class="masonry-wrap">
        <div v-for="(col, cIndex) in columns" :key="cIndex" class="masonry-col">
          <a
            v-for="post in col"
            :key="post.id"
            class="img-card"
            @click.prevent="router.push(`/detail/${post.id}`)"
          >
           <img
             :src="`/image/${post.file_name}?dl=jpg`"
             loading="lazy" 
             :width="post.width"
             :height="post.height"
             :style="{ aspectRatio: post.width && post.height ? `${post.width} / ${post.height}` : undefined }"
             @load="handleImgLoad"
           />

            <div class="meta">
              <div class="title">{{ post.caption?.split('\n')[0] }}</div>
            </div>
          </a>
        </div>
      </div>

      <div v-if="loading && hasMore" class="loading-bottom">
        <div class="spinner-small"></div>
      </div>

      <div v-if="tipText" class="tip">{{ tipText }}</div>

      <!-- 无限滚动哨兵 -->
      <div ref="scrollSentinel"></div>
    </div>
  </div>

  <div v-else class="loading-full">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useMasonry } from '../composables/useMasonry'

const route = useRoute()
const router = useRouter()

/* ========= App.vue 背景控制 ========= */
const setAppBackground = inject('setAppBackground')
const resetAppBackground = inject('resetAppBackground')

/* ========= Masonry（和 Home.vue 完全一致） ========= */

const getColumnCount = () => {
  const w = window.innerWidth
  if (w < 768) return 2
  if (w < 1200) return 4
  return 5
}

const columnCount = ref(getColumnCount())
const { columns, addItems, reset } = useMasonry(columnCount)

/* ========= 状态 ========= */

const artistData = ref(null)
const posts = ref([])

const page = ref(1)
const limit = 30
const loading = ref(false)
const hasMore = ref(true)
const tipText = ref('')

const scrollSentinel = ref(null)
let observer = null

/* ========= API ========= */

const loadArtist = async () => {
  const artistName = decodeURIComponent(route.params.name)

  const { data } = await axios.get(
    `/api/artist/${encodeURIComponent(artistName)}`,
    { params: { page: 1, limit } }
  )

  artistData.value = data.profile
  posts.value = data.posts || []
  page.value = 1

  reset()
  addItems(posts.value)

  hasMore.value = posts.value.length < Number(artistData.value?.count || 0)
  tipText.value = hasMore.value ? '' : 'End of Gallery'

  await nextTick()
  if (setAppBackground && posts.value.length) {
    setAppBackground({
      url: `/image/${posts.value[0].file_name}?dl=jpg`,
      dim: 0.6
    })
  }
}

const loadMore = async () => {
  if (loading.value || !hasMore.value) return
  loading.value = true

  try {
    const artistName = decodeURIComponent(route.params.name)
    const nextPage = page.value + 1

    const { data } = await axios.get(
      `/api/artist/${encodeURIComponent(artistName)}`,
      { params: { page: nextPage, limit } }
    )

    const newPosts = data.posts || []
    if (!newPosts.length) {
      hasMore.value = false
      tipText.value = 'End of Gallery'
      return
    }

    page.value = nextPage
    posts.value.push(...newPosts)
    addItems(newPosts)

    // ✅ 补这两行：用总数判断是否还有更多
    hasMore.value = posts.value.length < Number(artistData.value?.count || 0)
    if (!hasMore.value) tipText.value = 'End of Gallery'
  } finally {
    loading.value = false
  }
}


/* ========= 无限滚动（Home 同款） ========= */

onMounted(async () => {
  await loadArtist()

  observer = new IntersectionObserver(
    ([entry]) => entry.isIntersecting && loadMore(),
    { rootMargin: '600px' }
  )

  scrollSentinel.value && observer.observe(scrollSentinel.value)

  window.addEventListener('resize', () => {
    const newCount = getColumnCount()
    if (newCount !== columnCount.value) {
      columnCount.value = newCount
      reset()
      addItems(posts.value)
    }
  })
})

onUnmounted(() => {
  observer?.disconnect()
  resetAppBackground && resetAppBackground()
})

watch(() => route.params.name, loadArtist)

const handleImgLoad = (e) => {
  e.target.classList.add('loaded')
}

/* ========= ✅ 你喜欢的 platformBadges（原样保留） ========= */

const platformBadges = computed(() => {
  if (!artistData.value) return []
  const platforms = artistData.value.platformText
    ?.split(',')
    ?.map(p => p.trim())
    ?.filter(Boolean) || []

  return platforms.map(p => {
    if (p.includes('Pixiv')) return { text: p, icon: '🅿️', class: 'badge-pixiv' }
    else if (p.includes('Yande')) return { text: p, icon: '🍒', class: 'badge-yande' }
    else if (p.includes('MtcACG')) return { text: p, icon: '🌟', class: 'badge-mtc' }
    else if (p.includes('Twitter')) return { text: p, icon: '🐦', class: 'badge-twitter' }
    return { text: p, icon: '🎨', class: 'badge-other' }
  })
})
</script>

<style scoped>
.artist-page {
  min-height: 100vh;
  padding: 80px 1rem 40px;
  max-width: 1200px;
  margin: 0 auto;
  color: #fff;
}

.artist-header {
  margin-bottom: 32px;
}

/* =========================================
   ✅ 问题1：画师信息卡片 - Soft Glass 轻拟态
   ========================================= */
.profile-card {
  position: relative;
  border-radius: 24px;
  padding: 32px 24px;
  
  /* Soft Glass 核心样式：微白透 + 强磨砂 + 阴影 */
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.profile-main {
  display: flex;
  gap: 24px;
  align-items: center;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 24px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
}

.profile-info {
  flex: 1;
}

.name-row {
  margin-bottom: 16px;
}

.name-row h1 {
  font-size: 2.2rem;
  margin-bottom: 8px;
  text-shadow: 0 3px 8px rgba(0, 0, 0, 0.6);
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid;
  backdrop-filter: blur(4px);
  transition: transform 0.2s;
}

.platform-badge:hover {
  transform: translateY(-2px);
}

/* 各种平台徽章颜色 */
.badge-pixiv { background: rgba(0, 150, 250, 0.2); color: #0096fa; border-color: rgba(0, 150, 250, 0.3); }
.badge-yande { background: rgba(255, 77, 77, 0.2); color: #ff4d4d; border-color: rgba(255, 77, 77, 0.3); }
.badge-mtc { background: rgba(168, 85, 247, 0.2); color: #a855f7; border-color: rgba(168, 85, 247, 0.3); }
.badge-twitter { background: rgba(29, 161, 242, 0.2); color: #1da1f2; border-color: rgba(29, 161, 242, 0.3); }
.badge-other { background: rgba(148, 163, 184, 0.2); color: #e5e7eb; border-color: rgba(148, 163, 184, 0.3); }

.meta-tag {
  margin-left: 6px;
  padding-left: 10px;
  border-left: 1px solid rgba(255, 255, 255, 0.25);
  font-size: 12px;
  opacity: 0.8;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.stat-item {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 16px;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  backdrop-filter: blur(10px);
}

.stat-label {
  font-size: 12px;
  color: #e5e7eb;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.stat-platform {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dot { width: 8px; height: 8px; border-radius: 999px; box-shadow: 0 0 8px currentColor; }
.dot-green { color: #4ade80; background: #4ade80; }
.dot-blue { color: #60a5fa; background: #60a5fa; }
.dot-purple { color: #c084fc; background: #c084fc; }

/* Gallery */
.gallery-header {
  margin-top: 32px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.4);
  padding-bottom: 12px;
}

.gallery-title-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.accent-bar {
  width: 6px;
  height: 32px;
  border-radius: 999px;
  background: #ec4899;
  box-shadow: 0 0 12px #ec4899;
}

.gallery-title-left h2 {
  font-size: 1.6rem;
  font-weight: 700;
}

.subtitle {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: #9ca3af;
}

.gallery-count {
  font-family: monospace;
  font-size: 13px;
  color: #9ca3af;
}

.masonry-wrap {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.masonry-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.img-card {
  display: block;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #111827;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.img-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.5);
}

.img-card img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s;
}

.img-card img.loaded { opacity: 1; }

.meta {
  position: absolute;
  inset-inline: 0;
  bottom: 0;
  padding: 60px 12px 10px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.6), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.img-card:hover .meta { opacity: 1; }

.title {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tip {
  text-align: center;
  padding: 16px 0 32px;
  font-size: 13px;
  color: #9ca3af;
}

.loading-full {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.loading-bottom {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ec4899;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.spinner-small {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255,255,255,0.2);
  border-top: 3px solid #ec4899;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .artist-page { padding: 72px 0.75rem 24px; }
  .profile-main { flex-direction: column; align-items: flex-start; gap: 16px; }
  .avatar { border-radius: 16px; }
  .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .masonry-wrap { gap: 10px; }
}
</style>





