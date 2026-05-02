<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Car } from '../types'

const props = defineProps<{ modelValue: boolean; editCar?: Car | null }>()
const emit  = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'save', data: Omit<Car, 'id' | 'addedAt' | 'updatedAt'>): void
}>()

const MAKES = ['Acura','Alfa Romeo','Aston Martin','Audi','BMW','Bentley','Bugatti','Buick',
  'Cadillac','Chevrolet','Chrysler','Dodge','Ferrari','Fiat','Ford','GMC','Genesis','Honda',
  'Hyundai','Infiniti','Jaguar','Jeep','Kia','Lamborghini','Land Rover','Lexus','Lincoln',
  'Maserati','Mazda','McLaren','Mercedes-Benz','MINI','Mitsubishi','Nissan','Pontiac',
  'Porsche','RAM','Rivian','Rolls-Royce','Subaru','Tesla','Toyota','Volkswagen','Volvo']

const blank = (): Omit<Car, 'id'|'addedAt'|'updatedAt'> => ({
  make:'', model:'', year:'', trim:'', body:'', color:'',
  engine:'', transmission:'', horsepower:'', zeroToSixty:'',
  location:'', notes:'', rating:0, photos:[],
})

const form   = ref(blank())
const photos = ref<string[]>([])
const rating = ref(0)

watch(() => props.modelValue, open => {
  if (open) {
    if (props.editCar) {
      const c = props.editCar
      form.value = { make:c.make, model:c.model, year:c.year, trim:c.trim, body:c.body,
        color:c.color, engine:c.engine, transmission:c.transmission, horsepower:c.horsepower,
        zeroToSixty:c.zeroToSixty, location:c.location, notes:c.notes, rating:c.rating, photos:[] }
      photos.value = [...c.photos]
      rating.value = c.rating
    } else {
      form.value = blank()
      photos.value = []
      rating.value = 0
    }
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

function submit() {
  if (!form.value.make.trim() || !form.value.model.trim()) {
    alert('Make and Model are required.')
    return
  }
  emit('save', { ...form.value, photos: [...photos.value], rating: rating.value })
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
            <div class="modal-title">{{ editCar ? 'Edit Car' : 'Add Car' }}</div>

            <div class="form-row">
              <div>
                <label class="form-label">Make *</label>
                <input v-model="form.make" type="text" placeholder="e.g. Ford" list="makeList" />
                <datalist id="makeList">
                  <option v-for="m in MAKES" :key="m" :value="m" />
                </datalist>
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
                  <option v-for="b in ['Sedan','Coupe','Convertible','Hatchback','Wagon','SUV','Crossover','Pickup Truck','Van','Minivan','Roadster','Supercar','Hot Rod','Rat Rod','Classic','Other']" :key="b">{{ b }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">Color</label>
                <input v-model="form.color" type="text" placeholder="e.g. Candy Apple Red" />
              </div>
            </div>

            <div class="form-row">
              <div>
                <label class="form-label">Engine</label>
                <input v-model="form.engine" type="text" placeholder="e.g. 5.0L V8" />
              </div>
              <div>
                <label class="form-label">Transmission</label>
                <select v-model="form.transmission">
                  <option value="">—</option>
                  <option v-for="t in ['Manual','Automatic','CVT','DCT / PDK','Electric']" :key="t">{{ t }}</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div>
                <label class="form-label">Horsepower</label>
                <input v-model="form.horsepower" type="number" placeholder="e.g. 450" />
              </div>
              <div>
                <label class="form-label">0–60 mph</label>
                <input v-model="form.zeroToSixty" type="text" placeholder="e.g. 4.2s" />
              </div>
            </div>

            <div class="form-col">
              <label class="form-label">Location / Where Seen</label>
              <input v-model="form.location" type="text" placeholder="e.g. Car show, Austin TX" />
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

            <div class="form-col">
              <label class="form-label">Photos</label>
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
              <button class="btn btn-accent" type="button" @click="submit">Save Car</button>
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
.form-row { display:flex; gap:10px; margin-bottom:12px; }
.form-row > * { flex:1; min-width:0; }
.form-col { margin-bottom:12px; }
.form-label { font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); display:block; margin-bottom:5px; }
.rating-row { display:flex; gap:6px; }
.star-btn { background:none; border:none; cursor:pointer; font-size:26px; color:var(--border); padding:4px; touch-action:manipulation; }
.star-btn.on { color:var(--accent); }
textarea { resize:vertical; min-height:80px; }
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
