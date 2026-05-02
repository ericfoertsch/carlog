<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Car } from '../types'
import { useTags } from '../composables/useTags'

const props = defineProps<{ modelValue: boolean; editCar?: Car | null }>()
const emit  = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'save', data: Omit<Car, 'id' | 'addedAt' | 'updatedAt'>): void
}>()

const { allTags, ensureTag } = useTags()

const BODY_STYLES = ['Sedan','Coupe','Convertible','Hatchback','Wagon','SUV','Crossover',
  'Pickup Truck','Van','Minivan','Roadster','Supercar','Hot Rod','Rat Rod','Classic','Other']
const SCALES = ['1:8','1:12','1:16','1:18','1:24','1:32','1:43','1:64','1:87','1:100','1:144']
const MODEL_TYPES = ['Scale Kit','Die-cast','Hot Wheels','Matchbox','Resin','Slot Car',
  'RC Model','Promo Model','Snap Kit','Pre-built','Other']

const blank = (): Omit<Car, 'id'|'addedAt'|'updatedAt'> => ({
  make:'', model:'', year:'', trim:'', body:'', color:'', engine:'', location:'',
  notes:'', rating:0, photos:[],
  customVsStock:'', modelMaker:'', vintageVsCurrent:'', kitPrice:'',
  material:'', promotional:false, scale:'', modelType:'', tags:[],
})

const form   = ref(blank())
const photos = ref<string[]>([])
const rating = ref(0)
const localTags = ref<string[]>([])
const tagInput  = ref('')
const showTagSuggestions = ref(false)

const tagSuggestions = computed(() => {
  const q = tagInput.value.trim().toLowerCase()
  return allTags.value.filter(t =>
    t.toLowerCase().includes(q) && !localTags.value.includes(t)
  )
})

watch(() => props.modelValue, open => {
  if (open) {
    if (props.editCar) {
      const c = props.editCar
      form.value = {
        make:c.make, model:c.model, year:c.year, trim:c.trim, body:c.body,
        color:c.color, engine:c.engine, location:c.location, notes:c.notes,
        rating:c.rating, photos:[],
        customVsStock:c.customVsStock ?? '', modelMaker:c.modelMaker ?? '',
        vintageVsCurrent:c.vintageVsCurrent ?? '', kitPrice:c.kitPrice ?? '',
        material:c.material ?? '', promotional:c.promotional ?? false,
        scale:c.scale ?? '', modelType:c.modelType ?? '', tags:[],
      }
      photos.value = [...c.photos]
      rating.value = c.rating
      localTags.value = [...(c.tags ?? [])]
    } else {
      form.value = blank()
      photos.value = []
      rating.value = 0
      localTags.value = []
    }
    tagInput.value = ''
    showTagSuggestions.value = false
  }
})

function handlePhotos(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = ev => { photos.value.push(ev.target!.result as string) }
    reader.readAsDataURL(file)
  })
  ;(e.target as HTMLInputElement).value = ''
}

function removePhoto(i: number) { photos.value.splice(i, 1) }

function commitTag() {
  const t = tagInput.value.trim()
  if (!t || localTags.value.includes(t)) { tagInput.value = ''; return }
  localTags.value.push(t)
  ensureTag(t)
  tagInput.value = ''
  showTagSuggestions.value = false
}

function selectTag(t: string) {
  if (!localTags.value.includes(t)) localTags.value.push(t)
  tagInput.value = ''
  showTagSuggestions.value = false
}

function removeLocalTag(t: string) {
  localTags.value = localTags.value.filter(x => x !== t)
}

function hideSuggestions() {
  setTimeout(() => { showTagSuggestions.value = false }, 150)
}

function submit() {
  if (!form.value.make.trim() || !form.value.model.trim()) {
    alert('Make and Model are required.')
    return
  }
  emit('save', { ...form.value, photos: [...photos.value], rating: rating.value, tags: [...localTags.value] })
  emit('update:modelValue', false)
}

function close() { emit('update:modelValue', false) }
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div v-if="modelValue" class="modal-overlay" @click.self="close">
        <Transition name="sheet">
          <div v-if="modelValue" class="modal">
            <div class="modal-handle" />
            <div class="modal-title">{{ editCar ? 'Edit Model' : 'Add Model' }}</div>

            <!-- Subject Vehicle -->
            <div class="section-label">Subject Vehicle</div>

            <div class="form-row">
              <div>
                <label class="form-label">Make *</label>
                <input v-model="form.make" type="text" placeholder="e.g. Ford" />
              </div>
              <div>
                <label class="form-label">Model *</label>
                <input v-model="form.model" type="text" placeholder="e.g. Mustang" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <label class="form-label">Year</label>
                <input v-model="form.year" type="number" placeholder="e.g. 1969" min="1886" max="2030" />
              </div>
              <div>
                <label class="form-label">Trim / Edition</label>
                <input v-model="form.trim" type="text" placeholder="e.g. GT500" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <label class="form-label">Body Style</label>
                <select v-model="form.body">
                  <option value="">—</option>
                  <option v-for="b in BODY_STYLES" :key="b">{{ b }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">Color</label>
                <input v-model="form.color" type="text" placeholder="e.g. Candy Apple Red" />
              </div>
            </div>

            <div class="form-col">
              <label class="form-label">Engine</label>
              <input v-model="form.engine" type="text" placeholder="e.g. 5.0L V8" />
            </div>

            <!-- Model Details -->
            <div class="section-label" style="margin-top:18px">Model Details</div>

            <div class="form-row">
              <div>
                <label class="form-label">Custom vs Stock</label>
                <select v-model="form.customVsStock">
                  <option value="">—</option>
                  <option>Custom</option>
                  <option>Stock</option>
                </select>
              </div>
              <div>
                <label class="form-label">Vintage vs Current</label>
                <select v-model="form.vintageVsCurrent">
                  <option value="">—</option>
                  <option>Vintage</option>
                  <option>Current</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div>
                <label class="form-label">Model Maker</label>
                <input v-model="form.modelMaker" type="text" placeholder="e.g. Tamiya, Revell" />
              </div>
              <div>
                <label class="form-label">Scale</label>
                <input v-model="form.scale" type="text" placeholder="e.g. 1:24" list="scaleList" />
                <datalist id="scaleList">
                  <option v-for="s in SCALES" :key="s" :value="s" />
                </datalist>
              </div>
            </div>

            <div class="form-row">
              <div>
                <label class="form-label">Type of Model</label>
                <input v-model="form.modelType" type="text" placeholder="e.g. Die-cast, Scale Kit" list="modelTypeList" />
                <datalist id="modelTypeList">
                  <option v-for="t in MODEL_TYPES" :key="t" :value="t" />
                </datalist>
              </div>
              <div>
                <label class="form-label">Material</label>
                <select v-model="form.material">
                  <option value="">—</option>
                  <option>Plastic</option>
                  <option>Metal</option>
                  <option>Diecast</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div>
                <label class="form-label">Model Kit Price</label>
                <input v-model="form.kitPrice" type="text" placeholder="e.g. $29.99" />
              </div>
              <div class="promo-wrap">
                <label class="form-label">Promotional</label>
                <label class="toggle-label">
                  <input v-model="form.promotional" type="checkbox" class="toggle-input" />
                  <span class="toggle-track"><span class="toggle-thumb" /></span>
                  <span class="toggle-text">{{ form.promotional ? 'Yes' : 'No' }}</span>
                </label>
              </div>
            </div>

            <!-- Personal -->
            <div class="section-label" style="margin-top:18px">Personal</div>

            <div class="form-col">
              <label class="form-label">Location / Where Obtained</label>
              <input v-model="form.location" type="text" placeholder="e.g. Car show, eBay, hobby shop" />
            </div>

            <div class="form-col">
              <label class="form-label">Rating</label>
              <div class="rating-row">
                <button
                  v-for="n in 5" :key="n"
                  type="button"
                  :class="['star-btn', { on: n <= rating }]"
                  @click="rating = n"
                >★</button>
              </div>
            </div>

            <div class="form-col">
              <label class="form-label">Notes</label>
              <textarea v-model="form.notes" placeholder="Condition, history, interesting details…" />
            </div>

            <!-- Tags -->
            <div class="section-label" style="margin-top:18px">Tags</div>

            <div class="form-col">
              <div v-if="localTags.length" class="tags-row">
                <span v-for="tag in localTags" :key="tag" class="tag-chip">
                  {{ tag }}
                  <button type="button" class="tag-chip-rm" @click="removeLocalTag(tag)">✕</button>
                </span>
              </div>
              <div class="tag-input-row">
                <div style="position:relative;flex:1">
                  <input
                    v-model="tagInput"
                    type="text"
                    placeholder="Type a tag and press Enter…"
                    autocomplete="off"
                    @keydown.enter.prevent="commitTag"
                    @focus="showTagSuggestions = true"
                    @blur="hideSuggestions"
                  />
                  <div v-if="showTagSuggestions && tagSuggestions.length" class="tag-suggestions">
                    <button
                      v-for="t in tagSuggestions"
                      :key="t"
                      type="button"
                      class="tag-suggestion-item"
                      @mousedown.prevent="selectTag(t)"
                    >{{ t }}</button>
                  </div>
                </div>
                <button class="btn btn-ghost" type="button" @click="commitTag">Add</button>
              </div>
            </div>

            <!-- Photos -->
            <div class="section-label" style="margin-top:18px">Photos</div>

            <div class="form-col">
              <div v-if="photos.length" class="photo-grid">
                <div v-for="(src, i) in photos" :key="i" class="photo-item">
                  <img :src="src" alt="" />
                  <button class="photo-rm" type="button" @click="removePhoto(i)">✕</button>
                </div>
              </div>
              <label class="photo-zone">
                <input type="file" accept="image/*" multiple @change="handlePhotos" />
                <svg width="28" height="28" fill="none" stroke="#555" stroke-width="1.5" viewBox="0 0 24 24" style="margin-bottom:8px"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <div style="font-size:13px;color:#666">Tap to add photos from Camera or iCloud</div>
                <div style="font-size:11px;color:#444;margin-top:4px">Supports HEIC, JPEG, PNG</div>
              </label>
            </div>

            <div class="modal-actions">
              <button class="btn btn-ghost" type="button" @click="close">Cancel</button>
              <button class="btn btn-accent" type="button" @click="submit">Save Model</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.85); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
.modal { background:var(--surface); border:1px solid var(--border); border-radius:20px 20px 0 0; width:100%; max-width:640px; max-height:92dvh; overflow-y:auto; -webkit-overflow-scrolling:touch; padding:20px 18px calc(20px + var(--safe-b)); }
.modal-handle { width:40px; height:4px; background:var(--border); border-radius:2px; margin:0 auto 18px; }
.modal-title { font-family:'Barlow Condensed',sans-serif; font-weight:700; font-size:26px; letter-spacing:.04em; text-transform:uppercase; margin-bottom:18px; }

.section-label { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); border-bottom:1px solid rgba(232,197,71,.2); padding-bottom:5px; margin-bottom:12px; }

.form-row { display:flex; gap:10px; margin-bottom:12px; }
.form-row > * { flex:1; min-width:0; }
.form-col { margin-bottom:12px; }
.form-label { font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); display:block; margin-bottom:5px; }
.rating-row { display:flex; gap:6px; }
.star-btn { background:none; border:none; cursor:pointer; font-size:26px; color:var(--border); padding:4px; touch-action:manipulation; }
.star-btn.on { color:var(--accent); }
textarea { resize:vertical; min-height:80px; }

/* Promotional toggle */
.promo-wrap { display:flex; flex-direction:column; }
.toggle-label { display:flex; align-items:center; gap:10px; cursor:pointer; padding:10px 0; }
.toggle-input { display:none; }
.toggle-track { width:42px; height:24px; background:var(--border); border-radius:12px; position:relative; transition:background .2s; flex-shrink:0; }
.toggle-input:checked ~ .toggle-track { background:var(--accent); }
.toggle-thumb { position:absolute; top:3px; left:3px; width:18px; height:18px; background:#fff; border-radius:50%; transition:transform .2s; }
.toggle-input:checked ~ .toggle-track .toggle-thumb { transform:translateX(18px); }
.toggle-text { font-size:14px; color:var(--text); }

/* Tags */
.tags-row { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
.tag-chip { display:inline-flex; align-items:center; gap:5px; background:rgba(232,197,71,.15); color:var(--accent); border:1px solid rgba(232,197,71,.35); border-radius:20px; padding:4px 10px 4px 12px; font-size:12px; font-weight:500; }
.tag-chip-rm { background:none; border:none; color:var(--accent); cursor:pointer; font-size:12px; padding:0; line-height:1; opacity:.7; touch-action:manipulation; }
.tag-chip-rm:hover { opacity:1; }
.tag-input-row { display:flex; gap:8px; align-items:flex-start; }
.tag-input-row input { flex:1; }
.tag-suggestions { position:absolute; top:calc(100% + 4px); left:0; right:0; background:var(--card); border:1px solid var(--border); border-radius:8px; z-index:10; max-height:160px; overflow-y:auto; box-shadow:0 4px 16px rgba(0,0,0,.5); }
.tag-suggestion-item { display:block; width:100%; text-align:left; background:none; border:none; color:var(--text); padding:9px 12px; font-size:13px; cursor:pointer; font-family:'Barlow',sans-serif; border-bottom:1px solid var(--border); }
.tag-suggestion-item:last-child { border-bottom:none; }
.tag-suggestion-item:hover { background:rgba(232,197,71,.1); }

/* Photos */
.photo-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:12px; }
.photo-item { position:relative; aspect-ratio:1; border-radius:8px; overflow:hidden; }
.photo-item img { width:100%; height:100%; object-fit:cover; }
.photo-rm { position:absolute; top:4px; right:4px; background:rgba(0,0,0,.7); border:none; color:white; border-radius:50%; width:26px; height:26px; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; touch-action:manipulation; }
.photo-zone { display:block; border:2px dashed var(--border); border-radius:var(--radius); padding:20px; text-align:center; cursor:pointer; position:relative; }
.photo-zone input { position:absolute; inset:0; opacity:0; cursor:pointer; width:100%; height:100%; }

.modal-actions { display:flex; gap:10px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border); }
.modal-actions .btn { flex:1; padding:12px; font-size:14px; }

/* Transitions */
.overlay-enter-active, .overlay-leave-active { transition:opacity .2s; }
.overlay-enter-from, .overlay-leave-to { opacity:0; }
.sheet-enter-active, .sheet-leave-active { transition:transform .25s ease; }
.sheet-enter-from, .sheet-leave-to { transform:translateY(100%); }

@media(min-width:640px) {
  .modal { border-radius:20px; max-height:85vh; margin:auto; }
  .modal-overlay { align-items:center; }
}
</style>
