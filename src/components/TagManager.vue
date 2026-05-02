<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTags } from '../composables/useTags'
import { useCatalog } from '../composables/useCatalog'

const { allTags, deleteTag } = useTags()
const { catalog, removeTagFromAll } = useCatalog()

const open = ref(false)

function tagCount(tag: string): number {
  return catalog.value.filter(c => c.tags?.includes(tag)).length
}

function handleDelete(tag: string) {
  const count = tagCount(tag)
  const msg = count > 0
    ? `Delete tag "${tag}"? It will be removed from ${count} model${count > 1 ? 's' : ''}.`
    : `Delete tag "${tag}"?`
  if (confirm(msg)) {
    deleteTag(tag)
    removeTagFromAll(tag)
  }
}

const tagList = computed(() => allTags.value.map(t => ({ tag: t, count: tagCount(t) })))
</script>

<template>
  <div class="tag-manager" v-if="allTags.length || open">
    <button class="tag-toggle" type="button" @click="open = !open">
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
      <span class="tag-toggle-text">
        <strong>Tag Library</strong>
        <small>{{ allTags.length }} tag{{ allTags.length !== 1 ? 's' : '' }} sitewide</small>
      </span>
      <span :class="{ 'toggle-chevron': true, open }">▼</span>
    </button>

    <Transition name="slide">
      <div v-if="open" class="tag-body">
        <div v-if="tagList.length" class="tags-grid">
          <div v-for="{ tag, count } in tagList" :key="tag" class="tag-row">
            <span class="tag-pill">{{ tag }}</span>
            <span class="tag-count">{{ count }} model{{ count !== 1 ? 's' : '' }}</span>
            <button class="tag-del" type="button" :title="`Delete &quot;${tag}&quot;`" @click="handleDelete(tag)">✕</button>
          </div>
        </div>
        <div v-else class="empty-tags">No tags yet — add them when editing a model.</div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tag-manager { background:rgba(232,197,71,.04); border:1px solid rgba(232,197,71,.16); border-radius:12px; margin:8px 14px 0; }
.tag-toggle { display:flex; align-items:center; gap:10px; padding:11px 14px; width:100%; background:none; border:none; border-radius:12px; text-align:left; color:inherit; font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
.tag-toggle svg { color:var(--accent); flex-shrink:0; }
.tag-toggle-text { flex:1; font-size:13px; color:var(--accent); }
.tag-toggle-text strong { display:block; font-weight:600; font-size:13px; }
.tag-toggle-text small { font-size:11px; color:var(--muted); }
.toggle-chevron { color:var(--muted); font-size:11px; transition:transform .25s; display:inline-block; }
.toggle-chevron.open { transform:rotate(180deg); }

.tag-body { padding:8px 14px 14px; border-top:1px solid rgba(232,197,71,.12); }
.tags-grid { display:flex; flex-direction:column; gap:6px; }
.tag-row { display:flex; align-items:center; gap:8px; }
.tag-pill { flex:1; font-size:12px; font-weight:500; background:rgba(232,197,71,.12); color:var(--accent); border:1px solid rgba(232,197,71,.25); border-radius:20px; padding:4px 12px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tag-count { font-size:11px; color:var(--muted); white-space:nowrap; flex-shrink:0; }
.tag-del { background:none; border:none; color:var(--muted); cursor:pointer; font-size:13px; padding:4px 6px; border-radius:4px; touch-action:manipulation; flex-shrink:0; }
.tag-del:hover { color:var(--accent2); }
.empty-tags { font-size:12px; color:var(--muted); text-align:center; padding:8px 0; }

.slide-enter-active, .slide-leave-active { transition:max-height .25s ease, opacity .2s ease; max-height:400px; overflow:hidden; }
.slide-enter-from, .slide-leave-to { max-height:0; opacity:0; }
</style>
