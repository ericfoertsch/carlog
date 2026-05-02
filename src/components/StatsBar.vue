<script setup lang="ts">
import { useCatalog } from '../composables/useCatalog'
const { stats } = useCatalog()
</script>

<template>
  <div class="stats-bar">
    <div class="stat"><div class="stat-val">{{ stats.total }}</div><div class="stat-label">Total</div></div>
    <div class="stat"><div class="stat-val">{{ stats.makes }}</div><div class="stat-label">Makes</div></div>
    <div class="stat"><div class="stat-val">{{ stats.oldest }}</div><div class="stat-label">Oldest</div></div>
    <div class="stat"><div class="stat-val">{{ stats.newest }}</div><div class="stat-label">Newest</div></div>
  </div>
</template>

<style scoped>
.stats-bar { display:flex; background:var(--surface); border-bottom:1px solid var(--border); overflow-x:auto; }
.stat { flex:1; min-width:70px; padding:10px 12px; text-align:center; border-right:1px solid var(--border); }
.stat:last-child { border-right:none; }
.stat-val { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:20px; color:var(--accent); }
.stat-label { font-size:10px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); }
</style>
