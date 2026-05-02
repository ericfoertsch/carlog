import { ref, watch } from 'vue'

const TAGS_KEY = 'carlogAllTags'

function loadTags(): string[] {
  try { return JSON.parse(localStorage.getItem(TAGS_KEY) ?? '[]') }
  catch { return [] }
}

// Singleton — shared across all components
const allTags = ref<string[]>(loadTags())

watch(allTags, val => localStorage.setItem(TAGS_KEY, JSON.stringify(val)), { deep: true })

export function useTags() {
  function ensureTag(tag: string) {
    const t = tag.trim()
    if (t && !allTags.value.includes(t)) {
      allTags.value = [...allTags.value, t].sort((a, b) => a.localeCompare(b))
    }
  }

  function deleteTag(tag: string) {
    allTags.value = allTags.value.filter(t => t !== tag)
  }

  return { allTags, ensureTag, deleteTag }
}
