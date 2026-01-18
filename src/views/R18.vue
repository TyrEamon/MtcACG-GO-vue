<template>
  <div class="r18">
    <!-- 动态背景（取第一张命中的 R18 图） -->
    <div
      class="hero-bg"
      v-if="filteredPosts.length > 0"
      :style="{ backgroundImage: `url(/image/${filteredPosts[0].file_name})` }"
    ></div>

    <!-- 年龄确认遮罩 -->
    <div class="warning-overlay" v-if="!confirmed">
      <div class="warning-box" @click.stop>
        <h1>🔞 成人内容警告</h1>
        <p>你即将进入包含 R-18 内容的区域</p>
        <p>请确认你已年满 18 周岁</p>
        <div class="warning-actions">
          <button @click="confirmAge" class="btn-confirm">我已满 18 岁</button>
          <button @click="$router.push('/')" class="btn-cancel">返回首页</button>
        </div>
      </div>
    </div>

    <div v-if="confirmed" class="r18-content">
      <div class="content-header">
        <h1>🔞 里世界</h1>
        <p>但还是要保持绅士风度哦 (/ω＼)</p>
      </div>

      <!-- 首页同款瀑布流 -->
      <div class="masonry-container" v-if="filteredPosts.length > 0">
        <div class="masonry-grid">
          <div v-for="(column, index) in columns" :key="index" class="masonry-column">
            <div
              v-for="post in column"
              :key="post.id"
              class="masonry-item"
              @click="$router.push(`/detail/${post.id}`)"
            >
              <div class="image-wrapper" :style="{ paddingBottom: getAspectRatio(post) }">
                <div :class="['skeleton', isLowEndDevice ? 'skeleton-simple' : 'skeleton-fancy']"></div>
                <img
                  :src="`/image/${post.file_name}`"
                  :alt="post.caption || '无标题'"
                  loading="lazy"
                  @load="handleImageLoad"
                />
              </div>

              <div class="overlay">
                <p class="caption">{{ (post.caption || '无标题').split('\n')[0] }}</p>
                <p class="artist" v-if="post.artist">👤 {{ post.artist }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 滚动哨兵 -->
      <div ref="scrollSentinel" class="scroll-sentinel"></div>

      <!-- 加载提示 -->
      <div class="loading-tip" :style="{ opacity: tipOpacity }">
        {{ tipText }}
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && filteredPosts.length === 0" class="empty">
        <p>😢</p>
        <p>暂无 R18 内容</p>
      </div>
    </div>
  </div>
</template>    

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useMasonry } from '../composables/useMasonry'

const route = useRoute()

const confirmed = ref(false)
const posts = ref([])
const loading = ref(false)

const page = ref(1)
const hasMore = ref(true)

const tipOpacity = ref(0)
const tipText = ref('加载中...')
const scrollSentinel = ref(null)

const isLowEndDevice = ref(false)

const showTip = (text, duration = 2000) => {
  tipText.value = text
  tipOpacity.value = 1
  if (duration > 0) {
    setTimeout(() => {
      tipOpacity.value = 0
    }, duration)
  }
}

// 设备性能检测
const detectDevicePerformance = () => {
  const cores = navigator.hardwareConcurrency || 2
  const memory = navigator.deviceMemory || 4
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  const effectiveType = connection?.effectiveType || '4g'

  if (
    cores < 4 ||
    memory < 4 ||
    (isMobile && effectiveType === 'slow-2g') ||
    effectiveType === '2g' ||
    effectiveType === '3g'
  ) {
    isLowEndDevice.value = true
    console.log('🐌 检测到低端设备，启用轻量模式')
  } else {
    console.log('🚀 检测到高性能设备，启用高级动画')
  }
}

// ✅ R18 关键词：里世界“只看命中词”的依据
const R18_KEYWORDS = [
  'R-18', 'R18', 'NSFW', 'Hentai',
  '性爱', '性交', '乱伦', '裸胸', '露点', '调教',
  '触手', '高潮', '喷水', '阿黑颜', '颜射', '后宫', '痴汉',
  'NTR', '3P', 'Boobs', 'Tits', 'Nipples', 'Breast',
  '乳房', '乳头', '胸部', '巨乳', '爆乳',
  'Creampie', 'Cum', 'Bukkake', 'Sex', 'Fuck', 'Blowjob',
  '射精', 'Handjob', 'Paizuri',
  '乳交', 'Cunnilingus', 'Fellatio', 'Masturbation',
  'Pussy', 'Vagina', 'Penis', 'Dick', 'Cock', 'Genitals', 'Pubic',
  '阴部', '生殖器', '阴茎', '阴道', '私处', '下体',
  'Breast', 'Nude', 'Topless', 'Ahegao', '潮吹',
  'X-ray', '透视', 'Mind Break', '精神崩溃',
  '洗脑', '堕落', 'Futa', '扶她', '双性',
  'Tentacle', 'BDSM', 'Bondage', '捆绑', '束缚',
  'Scat', 'Pregnant', '怀孕', '孕妇',
  '丝袜', '内衣', '泳装', '比基尼',
  'School Swimsuit', '死库水', 'Maid', 'Swimsuit', 'Ass',
  '臀部', '屁股', 'Pantyhose', 'Garter', '吊带袜',
  'Lingerie', 'Panty', 'Stockings', '丁字裤',
  '内裤', '胖次', '情趣内衣', '透视装',
  'naked', 'nipples', 'anus', '肛门', '菊花'
]

const isR18Content = (post) => {
  const text = `${post.caption || ''} ${post.tags || ''}`.toLowerCase()
  return R18_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()))
}

// 里世界：只展示命中关键词的内容
const filteredPosts = computed(() => posts.value.filter(isR18Content))

// 瀑布流列数
const getColumnCount = () => {
  const width = window.innerWidth
  if (width < 768) return 2
  if (width < 1200) return 4
  return 5
}

const columnCount = ref(getColumnCount())
const { columns, addItems, reset } = useMasonry(columnCount)

const handleResize = () => {
  const newCount = getColumnCount()
  if (newCount !== columnCount.value) {
    columnCount.value = newCount
    reset()
    addItems(filteredPosts.value)
  }
}

const getAspectRatio = (post) => {
  if (post.width && post.height) {
    const ratio = (post.height / post.width) * 100
    return `${ratio}%`
  }
  return '133%'
}

const handleImageLoad = (e) => {
  const img = e.target
  const skeleton = img.previousElementSibling
  if (skeleton && skeleton.classList.contains('skeleton')) {
    skeleton.style.opacity = '0'
    setTimeout(() => {
      skeleton.style.display = 'none'
    }, 300)
  }
  img.style.opacity = '1'
}

const loadPosts = async (append = false) => {
  if (loading.value) return
  loading.value = true

  if (append) showTip('正在加载更多...', 0)

  try {
    const q = route.query.q || ''
    const { data } = await axios.get('/api/posts', {
      params: { q, page: page.value }
    })

    console.log(`📦 R18 第 ${page.value} 页加载了 ${data?.length || 0} 条`)

    if (append) {
      posts.value.push(...(data || []))

      const filteredNew = (data || []).filter(isR18Content)
      addItems(filteredNew)

      if (filteredNew.length < 12 && data && data.length >= 30) {
        console.log('⚠️ 本页命中 R18 太少，自动尝试下一页...')
        setTimeout(() => {
          page.value++
          loadPosts(true)
        }, 120)
        return
      }
    } else {
      posts.value = data || []
      reset()
      addItems(filteredPosts.value)
    }

    if (!data || data.length === 0) {
      hasMore.value = false
      showTip('📦 已经到底啦！没有更多内容了~', 3000)
    } else if (data.length < 30) {
      hasMore.value = false
      showTip(`已加载全部 R18 内容（当前命中 ${filteredPosts.value.length} 条）✨`, 2500)
    } else {
      tipOpacity.value = 0
    }
  } catch (err) {
    console.error('❌ 加载失败:', err)
    showTip('❌ 加载失败，请稍后重试', 3000)
    if (!append) posts.value = []
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  if (loading.value || !hasMore.value) return
  page.value++
  loadPosts(true)
}

const resetState = () => {
  page.value = 1
  posts.value = []
  hasMore.value = true
  reset()
  loadPosts(false)
}

let observer = null

const teardownObserver = () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

const setupObserver = async () => {
  await nextTick()
  if (!scrollSentinel.value) return

  teardownObserver()

  observer = new IntersectionObserver(
    (entries) => {
      if (!confirmed.value) return
      if (entries[0]?.isIntersecting) {
        console.log('📍 R18 滚动哨兵触发')
        loadMore()
      }
    },
    { rootMargin: '500px' }
  )

  observer.observe(scrollSentinel.value)
  console.log('✅ R18 IntersectionObserver 已启动')
}

const confirmAge = async () => {
  confirmed.value = true
  sessionStorage.setItem('r18_confirmed', 'true')
  resetState()
  await setupObserver()
}

onMounted(async () => {
  detectDevicePerformance()
  window.addEventListener('resize', handleResize)

  if (sessionStorage.getItem('r18_confirmed') === 'true') {
    confirmed.value = true
    resetState()
    await setupObserver()
  }
})

onUnmounted(() => {
  teardownObserver()
  window.removeEventListener('resize', handleResize)
})

watch(confirmed, async (val) => {
  if (val) await setupObserver()
  else teardownObserver()
})

watch(() => route.query.q, () => {
  if (confirmed.value) resetState()
})
</script>

<style scoped>
/* —— 你的样式原封不动 —— */
.r18 {
  position: relative;
  min-height: 100vh;
}

/* 动态背景（同首页） */
.hero-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(10px) brightness(0.7); /* 轻微模糊，增加亮度 */
  z-index: -1;
  opacity: 1;
  pointer-events: none;
  animation: fadeIn 0.8s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 年龄确认 */
.warning-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s;
  padding: 1rem;
}

.warning-box {
  background: #fff;
  padding: 3rem;
  border-radius: 16px;
  text-align: center;
  max-width: 520px;
  width: 100%;
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}

.warning-box h1 {
  color: #ff4757;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.warning-box p {
  margin: 0.8rem 0;
  color: #666;
  font-size: 1rem;
}

.warning-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-confirm, .btn-cancel {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm {
  background: #ff69b4;
  color: white;
}
.btn-confirm:hover { background: #ff1493; }

.btn-cancel {
  background: #f5f5f5;
  color: #333;
}
.btn-cancel:hover { background: #e0e0e0; }

/* 内容区 */
.r18-content {
  padding: 0.5rem;
  padding-top: 18px;
  max-width: none;
  margin: 0 auto;
}

.content-header {
  display: none;
  text-align: center;
  margin-bottom: 1.2rem;
  color: #fff;
}

.content-header h1 {
  color: #ff69b4;
  margin-bottom: 0.4rem;
}
.content-header p {
  color: rgba(255,255,255,0.75);
}

/* 首页同款瀑布流样式 */
.masonry-container {
  width: 100%;
  margin: 0 auto;
  padding: 0 clamp(4px, 0.8vw, 10px);
}

.masonry-grid {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.masonry-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.masonry-item {
  width: 100%;
  cursor: pointer;
  overflow: hidden;
  border-radius: 8px;
  background: #2a2a2a;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.masonry-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 105, 180, 0.3);
}

.image-wrapper {
  position: relative;
  width: 100%;
  background: #1a1a1a;
  overflow: hidden;
}

.skeleton {
  position: absolute;
  inset: 0;
  background: #2a2a2a;
  z-index: 1;
  transition: opacity 0.3s ease;
}

.skeleton-fancy {
  overflow: hidden;
  will-change: opacity;
}

.skeleton-fancy::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.08) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: shimmer 2s infinite;
  will-change: transform;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton-simple {
  animation: pulse 1.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.image-wrapper img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.4s ease, transform 0.3s;
  z-index: 2;
}

.masonry-item:hover .image-wrapper img {
  transform: scale(1.05);
}

.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.9));
  color: white;
  padding: 1rem;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 3;
}

.masonry-item:hover .overlay {
  opacity: 1;
}

.caption {
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0.3rem;
}

.artist {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* 哨兵 & tip */
.scroll-sentinel {
  height: 1px;
  margin: 20px 0;
  background: transparent;
}

.loading-tip {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  color: #fff;
  padding: 8px 20px;
  border-radius: 99px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 999;
  white-space: nowrap;
}

.empty {
  text-align: center;
  padding: 3rem;
  color: #fff;
}
.empty p:first-child { font-size: 3rem; }

/* 响应式 */
@media (max-width: 768px) {
  .r18-content {
    padding: 0.35rem;
    padding-top: 10px;
  }
  .masonry-grid { gap: 8px; }
  .masonry-column { gap: 8px; }
  .warning-box { padding: 2rem 1.5rem; }
  .warning-box h1 { font-size: 1.5rem; }
}
</style>



