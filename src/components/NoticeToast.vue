<template>
  <transition name="notice-slide">
    <div v-if="visible" class="notice-toast" role="status" aria-live="polite">
      <div
        class="notice-card"
        @click.stop
        @pointerenter="pauseAutoClose"
        @pointerleave="resumeAutoClose"
        @focusin="pauseAutoClose"
        @focusout="resumeAutoClose"
      >
        <button class="notice-close" type="button" @click="close" aria-label="Close">
          ×
        </button>
        <div v-if="title" class="notice-title">{{ title }}</div>
        <div v-if="lines.length" class="notice-body">
          <template v-for="(line, index) in lines" :key="index">
            <code v-if="isCodeLine(line)" class="notice-code">{{ line }}</code>
            <p v-else class="notice-text">{{ line }}</p>
          </template>
        </div>
        <div v-if="actions.length" class="notice-actions">
          <button
            v-for="(action, index) in actions"
            :key="`${action.label}-${index}`"
            type="button"
            class="notice-btn"
            :class="action.variant || (index === 0 ? 'primary' : 'ghost')"
            @click="handleAction(action)"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  message: { type: [String, Array], default: '' },
  actions: { type: Array, default: () => [] },
  storageKey: { type: String, required: true }
})

const visible = ref(false)
const dismissed = ref(false)
const isDesktop = ref(true)
const autoCloseDelay = 3000
let autoCloseTimer = null

const lines = computed(() => {
  if (Array.isArray(props.message)) return props.message.filter(Boolean)
  if (!props.message) return []
  return String(props.message)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
})

const isCodeLine = (line) => line.trim().startsWith('/')

const updateViewport = () => {
  if (typeof window === 'undefined') return
  isDesktop.value = window.innerWidth >= 769
}

const loadDismissed = () => {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(props.storageKey) === 'true'
}

const close = () => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
  visible.value = false
  dismissed.value = true
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(props.storageKey, 'true')
  }
}

const handleAction = (action) => {
  if (action && typeof action.onClick === 'function') {
    action.onClick()
  }
  close()
}

const scheduleAutoClose = () => {
  if (!visible.value || dismissed.value || !isDesktop.value) return
  if (autoCloseTimer) clearTimeout(autoCloseTimer)
  autoCloseTimer = setTimeout(() => {
    if (visible.value && !dismissed.value) {
      close()
    }
  }, autoCloseDelay)
}

const pauseAutoClose = () => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
}

const resumeAutoClose = () => {
  scheduleAutoClose()
}

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)
  dismissed.value = loadDismissed()
  if (isDesktop.value && !dismissed.value) {
    visible.value = true
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
  pauseAutoClose()
})

watch(visible, (val) => {
  if (val) {
    scheduleAutoClose()
  } else {
    pauseAutoClose()
  }
})

watch(isDesktop, (val) => {
  if (!val) {
    visible.value = false
    return
  }
  if (!dismissed.value) {
    visible.value = true
  }
})
</script>

<style scoped>
.notice-toast {
  position: fixed;
  left: 20px;
  bottom: 20px;
  z-index: 110;
}

@media (max-width: 768px) {
  .notice-toast {
    display: none;
  }
}

.notice-card {
  width: 360px;
  max-width: calc(100vw - 40px);
  border-radius: 18px;
  padding: 18px 18px 16px;
  background: rgba(14, 20, 32, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(12px);
  color: #f5f7fb;
  position: relative;
}

.notice-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.notice-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
}

.notice-text {
  margin: 0;
}

.notice-code {
  display: inline-block;
  background: rgba(255, 255, 255, 0.08);
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
}

.notice-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.notice-btn {
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.notice-btn.primary {
  background: linear-gradient(135deg, #ff7db7, #ff9ad0);
  color: #1b0f1c;
}

.notice-btn.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.notice-btn:hover {
  transform: translateY(-1px);
}

.notice-close {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
}

.notice-close:hover {
  background: rgba(255, 255, 255, 0.16);
}

.notice-slide-enter-active,
.notice-slide-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.notice-slide-enter-from,
.notice-slide-leave-to {
  transform: translate(-20px, 20px);
  opacity: 0;
}
</style>
