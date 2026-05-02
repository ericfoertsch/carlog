import { ref, computed, watch } from 'vue'
import type { Car, SortOption } from '../types'

const STORAGE_KEY = 'carCatalog'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function normalize(c: Partial<Car>): Car {
  return {
    id: '', make: '', model: '', year: '', trim: '', body: '', color: '', engine: '',
    location: '', notes: '', rating: 0, photos: [], addedAt: 0, updatedAt: 0,
    customVsStock: '', modelMaker: '', vintageVsCurrent: '', kitPrice: '',
    material: '', promotional: false, scale: '', modelType: '', tags: [],
    ...c,
  } as Car
}

function load(): Car[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return (raw as Partial<Car>[]).map(normalize)
  } catch {
    return []
  }
}

// Singleton state — shared across components
const catalog = ref<Car[]>(load())
const search = ref('')
const filterMake = ref('')
const sortBy = ref<SortOption>('added')

watch(catalog, (val) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

export function useCatalog() {
  const makes = computed(() =>
    [...new Set(catalog.value.map(c => c.make).filter(Boolean))].sort()
  )

  const filtered = computed(() => {
    const q = search.value.toLowerCase()
    const fm = filterMake.value
    let list = catalog.value.filter(car => {
      const text = [
        car.make, car.model, car.year, car.trim, car.color, car.body,
        car.location, car.modelMaker, car.scale, car.modelType,
        ...(car.tags ?? []),
      ].join(' ').toLowerCase()
      return (!q || text.includes(q)) && (!fm || car.make === fm)
    })
    switch (sortBy.value) {
      case 'year_desc': list.sort((a, b) => (+b.year || 0) - (+a.year || 0)); break
      case 'year_asc':  list.sort((a, b) => (+a.year || 0) - (+b.year || 0)); break
      case 'make':      list.sort((a, b) => (a.make || '').localeCompare(b.make || '')); break
      default:          list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
    }
    return list
  })

  const stats = computed(() => {
    const years = catalog.value.map(c => +c.year).filter(Boolean)
    return {
      total: catalog.value.length,
      makes: makes.value.length,
      oldest: years.length ? Math.min(...years) : '—',
      newest: years.length ? Math.max(...years) : '—',
    }
  })

  function getById(id: string): Car | undefined {
    return catalog.value.find(c => c.id === id)
  }

  function saveCar(data: Omit<Car, 'id' | 'addedAt' | 'updatedAt'>, editId?: string): Car {
    const now = Date.now()
    if (editId) {
      const idx = catalog.value.findIndex(c => c.id === editId)
      const car: Car = { ...data, id: editId, addedAt: catalog.value[idx]?.addedAt ?? now, updatedAt: now }
      if (idx !== -1) catalog.value.splice(idx, 1, car)
      return car
    } else {
      const car: Car = { ...data, id: uid(), addedAt: now, updatedAt: now }
      catalog.value.unshift(car)
      return car
    }
  }

  function deleteCar(id: string) {
    catalog.value = catalog.value.filter(c => c.id !== id)
  }

  function removeTagFromAll(tag: string) {
    catalog.value = catalog.value.map(c => ({ ...c, tags: (c.tags ?? []).filter(t => t !== tag) }))
  }

  function mergeCars(incoming: Car[]) {
    incoming.map(normalize).forEach(rc => {
      const idx = catalog.value.findIndex(c => c.id === rc.id)
      if (idx === -1) {
        catalog.value.push(rc)
      } else if ((rc.updatedAt || 0) > (catalog.value[idx].updatedAt || 0)) {
        catalog.value.splice(idx, 1, rc)
      }
    })
  }

  return {
    catalog, search, filterMake, sortBy, makes, filtered, stats,
    getById, saveCar, deleteCar, removeTagFromAll, mergeCars,
  }
}
