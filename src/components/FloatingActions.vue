<template>
  <div class="floating-actions" :class="{ open }">
    <div class="action-stack">
      <button class="fab-btn action" type="button" title="Back" @click="handleBack">
        <svg viewBox="0 0 24 24" aria-hidden="true" class="icon-stroke">
          <path d="M15 6L9 12l6 6" />
        </svg>
      </button>
      <button class="fab-btn action" type="button" title="Home" @click="handleHome">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 11.5L12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" />
        </svg>
      </button>
      <button
        class="fab-btn action"
        :class="{ active: autoScroll }"
        type="button"
        title="Auto Scroll"
        @click="toggleAutoScroll"
      >
        <svg v-if="autoScroll" viewBox="0 0 24 24" aria-hidden="true" class="icon-stroke">
          <path d="M9 6.5V17.5M15 6.5V17.5" />
        </svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true" class="icon-stroke">
          <path d="M9 7.2L16.5 12L9 16.8Z" />
        </svg>
      </button>
    </div>
    <button class="fab-btn main" type="button" title="Menu" @click="toggleOpen">
      <span class="plus" :class="{ rotated: open }">+</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const open = ref(false)
const autoScroll = ref(false)

let rafId = 0
let lastTime = 0
let scrollEl = null
let resumeTimer = 0
let waitTimer = 0
let waitingForMore = false
let isUserPaused = false

const getScrollElement = () => (
  scrollEl || document.scrollingElement || document.documentElement
)

const cancelRaf = () => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

const stopAutoScroll = () => {
  autoScroll.value = false
  lastTime = 0
  waitingForMore = false
  isUserPaused = false
  if (resumeTimer) clearTimeout(resumeTimer)
  if (waitTimer) clearTimeout(waitTimer)
  cancelRaf()
}

const maybeStartScroll = () => {
  if (!autoScroll.value || isUserPaused || waitingForMore) return
  if (!rafId) rafId = requestAnimationFrame(stepScroll)
}

const scheduleResume = () => {
  if (resumeTimer) clearTimeout(resumeTimer)
  resumeTimer = setTimeout(() => {
    resumeTimer = 0
    if (!autoScroll.value) return
    isUserPaused = false
    maybeStartScroll()
  }, 800)
}

const pauseForUser = () => {
  if (!autoScroll.value) return
  isUserPaused = true
  lastTime = 0
  cancelRaf()
  scheduleResume()
}

const waitForMoreContent = () => {
  const el = getScrollElement()
  if (!el) {
    stopAutoScroll()
    return
  }
  if (waitTimer) return
  waitingForMore = true
  const baseHeight = el.scrollHeight

  const check = () => {
    waitTimer = 0
    if (!autoScroll.value) {
      waitingForMore = false
      return
    }

    const currentHeight = el.scrollHeight
    if (currentHeight > baseHeight + 2) {
      waitingForMore = false
      lastTime = 0
      maybeStartScroll()
      return
    }

    waitTimer = setTimeout(check, 300)
  }

  waitTimer = setTimeout(check, 300)
}

const stepScroll = (timestamp) => {
  if (!autoScroll.value) return
  if (isUserPaused || waitingForMore) return
  if (!lastTime) lastTime = timestamp

  const delta = timestamp - lastTime
  lastTime = timestamp

  const el = getScrollElement()
  if (!el) {
    stopAutoScroll()
    return
  }

  const speed = 0.08
  const move = delta * speed
  el.scrollTop += move

  const maxTop = el.scrollHeight - el.clientHeight
  if (el.scrollTop >= maxTop - 2) {
    waitForMoreContent()
    return
  }

  rafId = requestAnimationFrame(stepScroll)
}

const toggleAutoScroll = () => {
  if (autoScroll.value) {
    stopAutoScroll()
    return
  }
  autoScroll.value = true
  waitingForMore = false
  isUserPaused = false
  lastTime = 0
  maybeStartScroll()
}

const toggleOpen = () => {
  open.value = !open.value
}

const handleBack = () => {
  stopAutoScroll()
  router.back()
}

const handleHome = () => {
  stopAutoScroll()
  router.push('/')
}

onMounted(() => {
  scrollEl = document.querySelector('.main-content') || document.scrollingElement
  if (scrollEl) {
    scrollEl.addEventListener('wheel', pauseForUser, { passive: true })
    scrollEl.addEventListener('touchstart', pauseForUser, { passive: true })
    scrollEl.addEventListener('touchmove', pauseForUser, { passive: true })
  }
})

onBeforeUnmount(() => {
  stopAutoScroll()
  if (scrollEl) {
    scrollEl.removeEventListener('wheel', pauseForUser)
    scrollEl.removeEventListener('touchstart', pauseForUser)
    scrollEl.removeEventListener('touchmove', pauseForUser)
  }
})
</script>

<style scoped>
.floating-actions {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 120;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  --fab-main: #fea1d3;
  --fab-action: #ff69b4;
  --fab-action-strong: #ff1493;
  --fab-shadow: 0 10px 24px rgba(255, 105, 180, 0.35);
}

.action-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  transition: opacity 0.35s cubic-bezier(0.2, 1, 0.2, 1), transform 0.35s cubic-bezier(0.2, 1, 0.2, 1);
}

.floating-actions:not(.open) .action-stack {
  opacity: 0;
  transform: translateY(10px) scale(0.96);
  pointer-events: none;
}

.floating-actions:not(.open) .action-stack .fab-btn {
  transform: translateY(6px) scale(0.94);
}

.floating-actions.open .action-stack .fab-btn {
  transform: translateY(0) scale(1);
}

.fab-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: var(--fab-shadow);
  transition: transform 0.2s cubic-bezier(0.2, 1, 0.2, 1), box-shadow 0.2s ease, background 0.2s ease;
}

.fab-btn svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.icon-stroke {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.fab-btn.action {
  background: var(--fab-action);
}

.fab-btn.action:hover {
  background: var(--fab-action-strong);
  transform: translateY(-2px);
}

.fab-btn.action.active {
  box-shadow: 0 0 0 2px rgba(255, 20, 147, 0.6), var(--fab-shadow);
}

.fab-btn.main {
  background: var(--fab-main);
  width: 58px;
  height: 58px;
  border-radius: 16px;
}

.fab-btn.main:hover {
  transform: translateY(-3px) scale(1.02);
}

.plus {
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
  transition: transform 0.2s ease;
}

.plus.rotated {
  transform: rotate(45deg);
}

.action-stack .fab-btn {
  transition-delay: 0ms;
}

.floating-actions.open .action-stack .fab-btn:nth-child(1) { transition-delay: 40ms; }
.floating-actions.open .action-stack .fab-btn:nth-child(2) { transition-delay: 80ms; }
.floating-actions.open .action-stack .fab-btn:nth-child(3) { transition-delay: 120ms; }

@media (max-width: 768px) {
  .floating-actions {
    right: 14px;
    bottom: 14px;
  }
  .fab-btn {
    width: 38px;
    height: 38px;
    border-radius: 10px;
  }
  .fab-btn svg {
    width: 18px;
    height: 18px;
  }
  .fab-btn.main {
    width: 52px;
    height: 52px;
    border-radius: 14px;
  }
  .plus {
    font-size: 28px;
  }
}
</style>
