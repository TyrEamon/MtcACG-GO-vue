import { ref, watch } from 'vue'

export function useMasonry(columnCount) {
  const columns = ref([])
  const columnHeights = ref([])

  const initColumns = (count) => {
    columns.value = Array.from({ length: count }, () => [])
    columnHeights.value = Array.from({ length: count }, () => 0)
  }

  const addItems = (items = []) => {
    items.forEach(item => {
      const minHeight = Math.min(...columnHeights.value)
      const colIndex = columnHeights.value.indexOf(minHeight)

      columns.value[colIndex].push(item)

      const ratio =
        item.width && item.height
          ? item.height / item.width
          : 1.33

      columnHeights.value[colIndex] += ratio
    })
  }

  const reset = () => {
    initColumns(columnCount.value)
  }

  // 🌟 关键：监听列数变化
  watch(
    columnCount,
    (newCount) => {
      initColumns(newCount)
    },
    { immediate: true }
  )

  return {
    columns,
    addItems,
    reset
  }
}
