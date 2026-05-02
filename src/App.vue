<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCatalog } from './composables/useCatalog'
import type { Car, SortOption } from './types'

import StatsBar   from './components/StatsBar.vue'
import SyncPanel  from './components/SyncPanel.vue'
import TagManager from './components/TagManager.vue'
import CarCard    from './components/CarCard.vue'
import CarForm    from './components/CarForm.vue'
import CarDetail  from './components/CarDetail.vue'

const { catalog, filtered, makes, search, filterMake, sortBy, saveCar, deleteCar } = useCatalog()

const showForm   = ref(false)
const showDetail = ref(false)
const editingCar = ref<Car | null>(null)
const detailCar  = ref<Car | null>(null)

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'added',     label: 'Newest Added' },
  { value: 'year_desc', label: 'Year ↓' },
  { value: 'year_asc',  label: 'Year ↑' },
  { value: 'make',      label: 'Make A–Z' },
]

function openAdd() {
  editingCar.value = null
  showForm.value = true
}

function openEdit(id: string) {
  editingCar.value = catalog.value.find(c => c.id === id) ?? null
  showForm.value = true
}

function openDetail(id: string) {
  detailCar.value = catalog.value.find(c => c.id === id) ?? null
  showDetail.value = true
}

function handleSave(data: Omit<Car, 'id' | 'addedAt' | 'updatedAt'>) {
  saveCar(data, editingCar.value?.id)
}

function handleDelete(id: string) {
  deleteCar(id)
}

// Export
function exportData() {
  const json = JSON.stringify({ version: 1, catalog: catalog.value, exportedAt: new Date().toISOString() }, null, 2)
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  a.download = `carlog-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
}

// Import
const importInput = ref<HTMLInputElement>()
function triggerImport() { importInput.value?.click() }
function handleImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target!.result as string)
      const incoming: Car[] = data.catalog ?? data
      if (!Array.isArray(incoming)) throw new Error()
      if (confirm(`Import ${incoming.length} cars? New entries will be merged.`)) {
        const ids = new Set(catalog.value.map(c => c.id))
        incoming.forEach(c => { if (!ids.has(c.id)) catalog.value.push(c) })
        alert('Import complete!')
      }
    } catch { alert('Invalid file.') }
  }
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}

// iOS install banner
onMounted(() => {
  const isIOS       = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = (navigator as Navigator & { standalone?: boolean }).standalone
    || window.matchMedia('(display-mode:standalone)').matches
  if (isIOS && !isStandalone && !sessionStorage.getItem('pwaShown')) {
    setTimeout(() => {
      const b = document.createElement('div')
      b.style.cssText = 'position:fixed;bottom:84px;left:50%;transform:translateX(-50%);background:#1f1f21;border:1px solid rgba(232,197,71,.6);border-radius:14px;padding:14px 20px 14px 16px;font-family:system-ui,sans-serif;font-size:13px;color:#f0efe8;z-index:9999;width:calc(100% - 40px);max-width:340px;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.6);line-height:1.5'
      b.innerHTML = '<div style="color:#e8c547;font-weight:700;font-size:15px;margin-bottom:6px">📲 Install CarLog</div>Tap <span style="background:#333;padding:1px 6px;border-radius:4px">Share</span> then <span style="background:#333;padding:1px 6px;border-radius:4px">Add to Home Screen</span>'
      const x = document.createElement('button')
      x.textContent = '✕'; x.type = 'button'
      x.style.cssText = 'position:absolute;top:8px;right:10px;background:none;border:none;color:#666;font-size:18px;cursor:pointer;padding:0;touch-action:manipulation'
      x.addEventListener('click', () => b.remove())
      b.appendChild(x)
      document.body.appendChild(b)
      sessionStorage.setItem('pwaShown', '1')
      setTimeout(() => b.parentNode && b.remove(), 12000)
    }, 2500)
  }
})
</script>

<template>
  <header>
    <div class="logo">Car<span>Log</span></div>
    <div class="header-actions">
      <button class="btn btn-ghost" type="button" @click="exportData">Export</button>
      <button class="btn btn-ghost" type="button" @click="triggerImport">Import</button>
      <input ref="importInput" type="file" accept=".json" style="display:none" @change="handleImport" />
    </div>
  </header>

  <StatsBar />
  <SyncPanel />
  <TagManager />

  <!-- Controls -->
  <div class="controls">
    <div class="search-wrap">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input v-model="search" type="text" class="search-input" placeholder="Search make, model, year…" />
    </div>
    <select v-model="filterMake">
      <option value="">All Makes</option>
      <option v-for="m in makes" :key="m">{{ m }}</option>
    </select>
    <select v-model="sortBy">
      <option v-for="o in SORT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </div>

  <!-- Grid -->
  <main class="grid" v-if="filtered.length">
    <CarCard v-for="car in filtered" :key="car.id" :car="car" @select="openDetail" />
  </main>
  <div v-else class="empty-state">
    <span class="empty-icon">🚗</span>
    <div class="empty-title">No cars yet</div>
    <div>Tap the <strong>+</strong> button to add your first car.</div>
  </div>

  <!-- Bottom nav -->
  <nav class="bottom-nav">
    <button class="nav-btn active" type="button">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      Catalog
    </button>
    <div class="nav-fab-slot" />
    <button class="nav-btn" type="button" @click="exportData">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Export
    </button>
  </nav>

  <!-- FAB -->
  <button class="fab" type="button" aria-label="Add car" @click="openAdd">+</button>

  <!-- Modals -->
  <CarForm
    v-model="showForm"
    :edit-car="editingCar"
    @save="handleSave"
  />
  <CarDetail
    v-model="showDetail"
    :car="detailCar"
    @edit="openEdit"
    @delete="handleDelete"
  />
</template>

<style>
/* Global reset + tokens */
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;900&family=Barlow:wght@300;400;500&display=swap');

:root {
  --bg:#0e0e0f; --surface:#181819; --card:#1f1f21; --border:#2e2e32;
  --accent:#e8c547; --accent2:#ff5c35; --text:#f0efe8; --muted:#888884;
  --radius:12px; --nav-h:60px; --safe-b:env(safe-area-inset-bottom,0px);
}
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
html,body,#app { height:100%; }
body {
  background:var(--bg); color:var(--text);
  font-family:'Barlow',sans-serif; font-weight:300;
  padding-bottom:calc(var(--nav-h) + var(--safe-b) + 24px);
}

/* Shared inputs */
input[type="text"],input[type="number"],select,textarea {
  background:var(--card); border:1px solid var(--border); color:var(--text);
  border-radius:8px; font-family:'Barlow',sans-serif; font-size:14px;
  padding:10px 12px; width:100%; outline:none; -webkit-appearance:none;
  transition:border-color .15s;
}
input:focus,select:focus,textarea:focus { border-color:var(--accent); }
select option { background:#222; }

/* Shared buttons */
.btn { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:13px; letter-spacing:.08em; text-transform:uppercase; padding:8px 14px; border-radius:6px; border:none; cursor:pointer; transition:opacity .15s; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
.btn-accent { background:var(--accent); color:#000; }
.btn-ghost  { background:transparent; color:var(--muted); border:1px solid var(--border); }
.btn-danger { background:transparent; color:var(--accent2); border:1px solid var(--accent2); }
.btn:active { opacity:.7; }
.btn:disabled { opacity:.4; cursor:default; }
</style>

<style scoped>
header { background:var(--surface); border-bottom:1px solid var(--border); padding:14px 16px 14px 20px; padding-top:max(14px,env(safe-area-inset-top)); position:sticky; top:0; z-index:100; display:flex; align-items:center; justify-content:space-between; }
.logo { font-family:'Barlow Condensed',sans-serif; font-weight:900; font-size:24px; letter-spacing:.04em; text-transform:uppercase; }
.logo span { color:var(--accent); }
.header-actions { display:flex; gap:6px; align-items:center; flex-shrink:0; }
@media(max-width:420px) { .header-actions .btn { padding:6px 8px; font-size:11px; } }

.controls { padding:12px 14px; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.controls .search-wrap { grid-column:1/-1; }
.search-wrap { position:relative; }
.search-wrap svg { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--muted); pointer-events:none; }
.search-input { padding-left:34px !important; }

.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(280px,100%),1fr)); gap:12px; padding:0 14px; }

.empty-state { text-align:center; padding:60px 20px; color:var(--muted); }
.empty-icon  { font-size:48px; margin-bottom:12px; display:block; opacity:.4; }
.empty-title { font-family:'Barlow Condensed',sans-serif; font-size:22px; font-weight:700; margin-bottom:6px; }

.bottom-nav { position:fixed; bottom:0; left:0; right:0; height:calc(var(--nav-h) + var(--safe-b)); background:var(--surface); border-top:1px solid var(--border); z-index:150; display:flex; align-items:center; padding-bottom:var(--safe-b); overflow:visible; }
.nav-btn { flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; background:none; border:none; color:var(--muted); cursor:pointer; font-size:10px; font-family:'Barlow',sans-serif; letter-spacing:.04em; padding:8px 0; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
.nav-btn.active { color:var(--accent); }
.nav-fab-slot { flex:1; }

.fab { position:fixed; bottom:calc(var(--nav-h) * 0.5 + var(--safe-b)); left:50%; transform:translateX(-50%); width:58px; height:58px; background:var(--accent); color:#000; border-radius:50%; border:3px solid var(--bg); display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:700; line-height:1; cursor:pointer; box-shadow:0 4px 20px rgba(0,0,0,.65); z-index:400; -webkit-tap-highlight-color:transparent; touch-action:manipulation; appearance:none; font-family:inherit; padding:0; }
.fab:active { transform:translateX(-50%) scale(.88); }
</style>
