<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Car } from '../types'

const props = defineProps<{ modelValue: boolean; car?: Car | null }>()
const emit  = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'edit', id: string): void
  (e: 'delete', id: string): void
}>()

const lightboxSrc = ref<string | null>(null)

const SPECS: Array<{ key: keyof Car; label: string; suffix?: string }> = [
  { key:'year',         label:'Year' },
  { key:'body',         label:'Body' },
  { key:'color',        label:'Color' },
  { key:'engine',       label:'Engine' },
  { key:'transmission', label:'Trans.' },
  { key:'horsepower',   label:'HP', suffix:' hp' },
  { key:'zeroToSixty',  label:'0–60' },
  { key:'location',     label:'Location' },
]

const filledSpecs = computed(() =>
  props.car ? SPECS.filter(s => props.car![s.key]).map(s => ({
    ...s, value: String(props.car![s.key])
  })) : []
)

function handleDelete() {
  if (!props.car) return
  if (confirm('Delete this car?')) {
    emit('delete', props.car.id)
    emit('update:modelValue', false)
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="modelValue" class="modal-overlay" @click.self="$emit('update:modelValue', false)">
        <Transition name="sheet">
          <div v-if="modelValue && car" class="modal">
            <div class="modal-handle" />

            <!-- Photos -->
            <template v-if="car.photos.length">
              <img class="detail-photo-main" :src="car.photos[0]" alt="" @click="lightboxSrc = car.photos[0]" />
              <div v-if="car.photos.length > 1" class="detail-photos">
                <img v-for="(p,i) in car.photos.slice(1)" :key="i" :src="p" alt="" @click="lightboxSrc = p" />
              </div>
            </template>
            <div v-else class="thumb-ph">🚗</div>

            <!-- Header -->
            <div class="detail-header">
              <div>
                <div class="car-make-model">
                  {{ car.make }} {{ car.model }}
                  <span v-if="car.trim" class="trim">{{ car.trim }}</span>
                </div>
                <div v-if="car.year" class="car-year">{{ car.year }}</div>
              </div>
              <div v-if="car.rating" class="stars">
                {{ '★'.repeat(car.rating) }}{{ '☆'.repeat(5 - car.rating) }}
              </div>
            </div>

            <!-- Specs -->
            <div v-if="car && filledSpecs.length" class="spec-grid">
              <div v-for="s in filledSpecs" :key="s.key" class="spec-item">
                <div class="spec-key">{{ s.label }}</div>
                <div class="spec-val">{{ s.value }}{{ s.suffix ?? '' }}</div>
              </div>
            </div>

            <!-- Notes -->
            <template v-if="car.notes">
              <div class="spec-key" style="margin:14px 0 6px">Notes</div>
              <div class="notes-block">{{ car.notes }}</div>
            </template>

            <div class="modal-actions">
              <button class="btn btn-danger" type="button" @click="handleDelete">Delete</button>
              <button class="btn btn-ghost"  type="button" @click="$emit('edit', car.id); $emit('update:modelValue', false)">Edit</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Lightbox -->
    <Transition name="overlay">
      <div v-if="lightboxSrc" class="lightbox" @click="lightboxSrc = null">
        <img :src="lightboxSrc" alt="" />
        <button class="lb-close" type="button" @click="lightboxSrc = null">✕</button>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.85); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
.modal { background:var(--surface); border:1px solid var(--border); border-radius:20px 20px 0 0; width:100%; max-width:640px; max-height:92dvh; overflow-y:auto; -webkit-overflow-scrolling:touch; padding:20px 18px calc(20px + var(--safe-b)); }
.modal-handle { width:40px; height:4px; background:var(--border); border-radius:2px; margin:0 auto 18px; }
.detail-photo-main { width:100%; aspect-ratio:16/9; object-fit:cover; border-radius:var(--radius); margin-bottom:14px; cursor:pointer; }
.detail-photos { display:grid; grid-template-columns:repeat(auto-fill,minmax(100px,1fr)); gap:8px; margin-bottom:14px; }
.detail-photos img { width:100%; aspect-ratio:1; object-fit:cover; border-radius:8px; cursor:pointer; touch-action:manipulation; }
.thumb-ph { width:100%; aspect-ratio:16/9; background:linear-gradient(135deg,#1a1a1c,#111); display:flex; align-items:center; justify-content:center; font-size:40px; border-radius:var(--radius); margin-bottom:14px; }
.detail-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px; }
.car-make-model { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:22px; line-height:1.1; }
.trim { color:var(--accent); font-weight:400; }
.car-year { font-family:'Barlow Condensed',sans-serif; font-size:13px; color:var(--accent); letter-spacing:.04em; }
.stars { color:var(--accent); font-size:18px; letter-spacing:2px; }
.spec-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:14px 0; }
.spec-item { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:11px; }
.spec-key { font-size:10px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:3px; }
.spec-val { font-family:'Barlow Condensed',sans-serif; font-weight:600; font-size:17px; }
.notes-block { background:var(--card); border:1px solid var(--border); border-radius:var(--radius); padding:13px; font-size:14px; line-height:1.6; color:#ccc; white-space:pre-wrap; }
.modal-actions { display:flex; gap:10px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border); }
.modal-actions .btn { flex:1; padding:12px; font-size:14px; }

.lightbox { position:fixed; inset:0; background:rgba(0,0,0,.95); z-index:300; display:flex; align-items:center; justify-content:center; }
.lightbox img { max-width:95vw; max-height:88vh; object-fit:contain; border-radius:8px; }
.lb-close { position:absolute; top:max(16px,env(safe-area-inset-top)); right:16px; background:rgba(255,255,255,.1); border:none; color:white; font-size:22px; width:48px; height:48px; border-radius:50%; cursor:pointer; touch-action:manipulation; }

.overlay-enter-active, .overlay-leave-active { transition:opacity .2s; }
.overlay-enter-from, .overlay-leave-to { opacity:0; }
.sheet-enter-active, .sheet-leave-active { transition:transform .25s ease; }
.sheet-enter-from, .sheet-leave-to { transform:translateY(100%); }

@media(min-width:640px) {
  .modal { border-radius:20px; max-height:85vh; margin:auto; }
  .modal-overlay { align-items:center; }
}
</style>
