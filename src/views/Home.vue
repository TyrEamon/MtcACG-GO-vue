<template>
  <div class="home">
    <!-- ❌ 已删除 .hero-bg，背景现在由 App.vue 统一管理 -->

    <!-- 首次访问提示 -->
    <NoticeToast
      storage-key="mtcacg_home_notice_v1"
      title="欢迎来到 MtcACG！(≧∇≦)ﾉ"
      :message="homeNoticeMessage"
      :actions="homeNoticeActions"
    />

    <!-- ✅ 瀑布流结构 (保持原样) -->
    <div class="masonry-container" v-if="filteredPosts.length > 0">
      <div class="masonry-grid">
        <div 
          v-for="(column, index) in columns"
          :key="index"
          class="masonry-column"
        >
          <div 
            v-for="post in column" 
            :key="post.id"
            class="masonry-item"
            @click="$router.push(`/detail/${post.id}`)"
          >
            <div 
              class="image-wrapper"
              :style="{ paddingBottom: getAspectRatio(post) }"
            >
              <div :class="['skeleton', isLowEndDevice ? 'skeleton-simple' : 'skeleton-fancy']"></div>
              <img 
                :src="`/image/${post.file_name}`" 
                :alt="post.caption || '无标题'" 
                loading="lazy"
                @load="handleImageLoad"
              >
            </div>
            <div class="overlay">
              <p class="caption">{{ (post.caption || '无标题').split('\n')[0] }}</p>
              <p class="artist" v-if="post.artist">👤 {{ post.artist }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ✅ 滚动哨兵 -->
    <div ref="scrollSentinel" class="scroll-sentinel"></div>

    <!-- 加载提示 -->
    <div class="loading-tip" :style="{ opacity: tipOpacity }">
      {{ tipText }}
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && filteredPosts.length === 0" class="empty">
      <p>😢</p>
      <p>暂无图片</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue' // ✅ 引入 inject
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useMasonry } from '../composables/useMasonry'
import NoticeToast from '../components/NoticeToast.vue'

const route = useRoute()

// ✅ 注入 App.vue 的背景控制方法
const setAppBackground = inject('setAppBackground')
const resetAppBackground = inject('resetAppBackground')

const posts = ref([])
const loading = ref(false)
const hasSearchQuery = ref(false)
const page = ref(1)
const hasMore = ref(true)

const tipOpacity = ref(0)
const tipText = ref('加载中...')

const isLowEndDevice = ref(false)
const scrollSentinel = ref(null)
const homeNoticeMessage = [
  '在乱糟糟的互联网异世界里，这里是本站长偷偷搭建的"秘密基地"',
  '这里没有算法裹挟，只有我的私人凝视。每一张图，都是我从时间里切下的碎片，安放于此。',
  '/api/posts?q=random',
  '/api/bg_safe?type=image'
]
const homeNoticeActions = [
  { label: '进入探索 →', variant: 'primary' }
]

const getColumnCount = () => {
  const width = window.innerWidth
  if (width < 768) return 2
  if (width < 1600) return 4
  return 5
}

const handleResize = () => {
  const newCount = getColumnCount()
  if (newCount !== columnCount.value) {
    columnCount.value = newCount
    reset()
    addItems(filteredPosts.value)
  }
}

const columnCount = ref(getColumnCount())
const { columns, addItems, reset } = useMasonry(columnCount)

// 设备性能检测
const detectDevicePerformance = () => {
  const cores = navigator.hardwareConcurrency || 2
  const memory = (navigator.deviceMemory || 4)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  const effectiveType = connection?.effectiveType || '4g'
  
  if (cores < 4 || memory < 4 || (isMobile && effectiveType === 'slow-2g') || effectiveType === '2g' || effectiveType === '3g') {
    isLowEndDevice.value = true
  }
}

// R18 关键词列表 (保持原样)
const R18_KEYWORDS = [
  'R-18', 'R18', 'NSFW', 'Hentai', '性爱', '性交', '乱伦', '裸胸',
  '露点', '调教', '触手', '高潮', '喷水', '阿黑颜', '颜射', '后宫',
  '痴汉', 'NTR', '3P', 'Boobs', 'Tits', 'Nipples', 'Breast', '乳房',
  '乳头', '胸部', '巨乳', '爆乳', 'Creampie', 'Cum', 'Bukkake', 'Sex',
  'Fuck', 'Blowjob', '射精', 'Handjob', 'Paizuri', '乳交', 'Cunnilingus', 'Fellatio',
  'Masturbation', 'Pussy', 'Vagina', 'Penis', 'Dick', 'Cock', 'Genitals', 'Pubic',
  '阴部', '生殖器', '阴茎', '阴道', '私处', '下体', 'Nude', 'Topless',
  'Ahegao', '潮吹', 'X-ray', '透视', 'Mind Break', '精神崩溃', '洗脑', '堕落',
  'Futa', '扶她', '双性', 'Tentacle', 'BDSM', 'Bondage', '捆绑', '束缚',
  'Scat', 'Pregnant', '怀孕', '孕妇', 'School Swimsuit', 'Maid', 'Swimsuit', 'Ass',
  '臀部', '屁股', 'Pantyhose', 'Garter', 'Lingerie', 'Panty', 'Stockings', '断面图',
  '丁字裤', '内裤', '胖次', '情趣内衣', '透视装', 'naked', 'nipples', 'anus',
  '肛门', '菊花', '乳首', 'スカトロ', 'レイプ', '口交', '丸吞', '妊娠',
  '破れタイツ', '快楽堕ち', '寝取られ', '乳出し', 'ふたなり', '輪姦', '異種姦', '孕ませ',
  '緊縛', '奴隷', '悪堕ち', '精神崩壊', 'セックス', '中出し', '顔射', 'イラマチオ',
  'フェラ', 'パイズリ', '手コキ', '潮吹き', '絶頂', 'アヘ顔', '全裸', 'ペニス',
  'ヴァギナ', 'クリトリス', '近親', '調教'
];



const isR18Content = (post) => {
  const text = `${post.caption || ''} ${post.tags || ''}`.toLowerCase()
  return R18_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))
}

const filteredPosts = computed(() => {
  const hide = localStorage.getItem('hide_r18')
  const shouldHideR18 = hide === null ? true : hide === 'true'
  if (shouldHideR18) return posts.value.filter(post => !isR18Content(post))
  return posts.value
})

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
    setTimeout(() => { skeleton.style.display = 'none' }, 300)
  }
  img.style.opacity = '1'
}

const showTip = (text, duration = 2000) => {
  tipText.value = text
  tipOpacity.value = 1
  if (duration > 0) {
    setTimeout(() => { tipOpacity.value = 0 }, duration)
  }
}

const loadPosts = async (append = false) => {
  if (loading.value) return
  loading.value = true

  if (append) showTip('正在加载更多...', 0)

  try {
    const q = route.query.q || ''
    hasSearchQuery.value = !!q

    const { data } = await axios.get('/api/posts', {
      params: { q, page: page.value }
    })

    console.log(`📦 第 ${page.value} 页加载了 ${data?.length || 0} 张图片`)

    const hide = localStorage.getItem('hide_r18')
    const shouldHideR18 = hide === null ? true : hide === 'true'

    if (append) {
      posts.value.push(...(data || []))

      const incoming = shouldHideR18
        ? (data || []).filter(post => !isR18Content(post))
        : (data || [])

      addItems(incoming)

      // ✅ 过滤开启时：如果过滤后太少，就自动多拉几页补足（保留你原逻辑）
      if (shouldHideR18) {
        const filteredCount = posts.value.filter(p => !isR18Content(p)).length
        if (filteredCount < 20 && data && data.length >= 30) {
          setTimeout(() => {
            page.value++
            loadPosts(true)
          }, 100)
          return
        }
      }
    } else {
      posts.value = data || []
      reset()
      addItems(filteredPosts.value)

      // ✅ 只在首次加载设置背景（App.vue 需要对象参数）
      if (data && data.length > 0 && setAppBackground) {
        setAppBackground({ url: `/image/${data[0].file_name}`, dim: 0.6 })
      }
    }

    if (!data || data.length === 0) {
      hasMore.value = false
      showTip('📦 已经到底啦！没有更多图片了~', 3000)
    } else if (data.length < 30) {
      hasMore.value = false
      showTip(`已加载全部 ${filteredPosts.value.length} 张图片 ✨`, 2000)
    } else {
      tipOpacity.value = 0
    }
  } catch (error) {
    console.error('❌ 加载失败:', error)
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
  loadPosts()
}

let observer = null

onMounted(() => {
  detectDevicePerformance()

  if (localStorage.getItem('hide_r18') === null) localStorage.setItem('hide_r18', 'true')

  loadPosts()

  window.addEventListener('resize', handleResize)

  if (scrollSentinel.value) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '500px' }
    )
    observer.observe(scrollSentinel.value)
  }
})

onUnmounted(() => {
  if (observer && scrollSentinel.value) {
    observer.unobserve(scrollSentinel.value)
    observer.disconnect()
    observer = null
  }
  window.removeEventListener('resize', handleResize)

  // ✅ 离开页面时重置背景（恢复默认随机图）
  if (resetAppBackground) {
    resetAppBackground()
  }
})

watch(() => route.query.q, resetState)
</script>

<style scoped>
.home {
  position: relative;
  min-height: 100vh;
  padding: 1rem;
  padding-top: 40px;
}

/* ✅ 新瀑布流样式 (保持原样) */
.masonry-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 8px;
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
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.skeleton-simple {
  animation: pulse 1.5s ease-in-out infinite;
  will-change: opacity;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
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

.empty p:first-child {
  font-size: 3rem;
}

/* ✅ 响应式 */
@media (max-width: 768px) {
  .home {
    padding: 0.5rem;
    padding-top: 15px;
  }
  .masonry-grid {
    gap: 8px;
  }
  .masonry-column {
    gap: 8px;
  }
}
</style>






