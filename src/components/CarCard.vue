<script setup lang="ts">
import type { Car } from '../types'

defineProps<{ car: Car }>()
defineEmits<{ (e: 'select', id: string): void }>()

const PLACEHOLDER_SVG = `<svg width="48" height="48" fill="none" stroke="#2a2a2e" stroke-width="1.5" viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 0 1-2-2v-4l2-4h14l2 4v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="16" width="2" height="4" rx="1"/><rect x="15" y="16" width="2" height="4" rx="1"/><path d="M5 9h14"/></svg>`
</script>

<template>
  <div class="car-card" @click="$emit('select', car.id)">
    <img v-if="car.photos[0]" class="car-thumb" :src="car.photos[0]" :alt="`${car.make} ${car.model}`" loading="lazy" />
    <div v-else class="car-thumb-ph" v-html="PLACEHOLDER_SVG" />
    <div class="car-info">
      <div v-if="car.year" class="car-year">{{ car.year }}</div>
      <div class="car-make-model">
        {{ car.make }} {{ car.model }}<span v-if="car.trim"> · {{ car.trim }}</span>
      </div>
      <div class="car-tags">
        <span v-if="car.scale" class="tag">{{ car.scale }}</span>
        <span v-if="car.material" class="tag">{{ car.material }}</span>
        <span v-if="car.customVsStock" class="tag">{{ car.customVsStock }}</span>
        <span v-if="car.promotional" class="tag tag-promo">Promo</span>
        <span v-if="car.photos.length > 1" class="tag tag-accent">📷 {{ car.photos.length }}</span>
      </div>
      <div v-if="car.tags?.length" class="car-custom-tags">
        <span v-for="tag in car.tags.slice(0, 3)" :key="tag" class="tag tag-custom">{{ tag }}</span>
        <span v-if="car.tags.length > 3" class="tag tag-more">+{{ car.tags.length - 3 }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.car-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; transition:opacity .15s; }
.car-card:active { opacity:.8; }
.car-thumb { width:100%; aspect-ratio:16/9; object-fit:cover; background:#111; display:block; }
.car-thumb-ph { width:100%; aspect-ratio:16/9; background:linear-gradient(135deg,#1a1a1c,#111); display:flex; align-items:center; justify-content:center; color:#333; }
.car-info { padding:12px 14px; }
.car-make-model { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:20px; line-height:1.1; }
.car-year { font-family:'Barlow Condensed',sans-serif; font-weight:300; font-size:13px; color:var(--accent); letter-spacing:.04em; margin-bottom:4px; }
.car-tags { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
.car-custom-tags { display:flex; gap:6px; flex-wrap:wrap; margin-top:5px; }
.tag { font-size:10px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; padding:3px 8px; border-radius:4px; background:var(--border); color:var(--muted); }
.tag-accent { background:rgba(232,197,71,.15); color:var(--accent); }
.tag-promo { background:rgba(255,92,53,.12); color:var(--accent2); }
.tag-custom { background:rgba(232,197,71,.1); color:var(--accent); border:1px solid rgba(232,197,71,.25); text-transform:none; letter-spacing:.02em; }
.tag-more { background:var(--border); color:var(--muted); }
</style>
