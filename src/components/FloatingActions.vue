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
        <svg v-if="autoScroll" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 6.5L18 12L8 17.5Z" />
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

const getScrollElement = () => (
  scrollEl || document.scrollingElement || document.documentElement
)

const stopAutoScroll = () => {
  autoScroll.value = false
  lastTime = 0
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

const stepScroll = (timestamp) => {
  if (!autoScroll.value) return
  if (!lastTime) lastTime = timestamp

  const delta = timestamp - lastTime
  lastTime = timestamp

  const el = getScrollElement()
  if (!el) {
    stopAutoScroll()
    return
  }

  const speed = 0.22
  const move = delta * speed
  el.scrollTop += move

  const maxTop = el.scrollHeight - el.clientHeight
  if (el.scrollTop >= maxTop - 2) {
    stopAutoScroll()
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
  lastTime = 0
  rafId = requestAnimationFrame(stepScroll)
  open.value = false
}

const toggleOpen = () => {
  open.value = !open.value
}

const handleBack = () => {
  stopAutoScroll()
  open.value = false
  router.back()
}

const handleHome = () => {
  stopAutoScroll()
  open.value = false
  router.push('/')
}

onMounted(() => {
  scrollEl = document.querySelector('.main-content')
})

onBeforeUnmount(() => {
  stopAutoScroll()
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
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.floating-actions:not(.open) .action-stack {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
  pointer-events: none;
}

.fab-btn {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: var(--fab-shadow);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
}

.fab-btn svg {
  width: 24px;
  height: 24px;
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
}

.fab-btn.main:hover {
  transform: translateY(-2px);
}

.plus {
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
  transition: transform 0.2s ease;
}

.plus.rotated {
  transform: rotate(45deg);
}

@media (max-width: 768px) {
  .floating-actions {
    right: 14px;
    bottom: 14px;
  }
  .fab-btn {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }
  .fab-btn svg {
    width: 22px;
    height: 22px;
  }
}
</style>
