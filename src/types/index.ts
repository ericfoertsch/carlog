export interface Car {
  id: string
  make: string
  model: string
  year: string
  trim: string
  body: string
  color: string
  engine: string
  location: string
  notes: string
  rating: number
  photos: string[]
  addedAt: number
  updatedAt: number
  // Model-specific fields
  customVsStock: '' | 'Custom' | 'Stock'
  modelMaker: string
  vintageVsCurrent: '' | 'Vintage' | 'Current'
  kitPrice: string
  material: '' | 'Plastic' | 'Metal' | 'Diecast'
  promotional: boolean
  scale: string
  modelType: string
  tags: string[]
}

export type SortOption = 'added' | 'year_desc' | 'year_asc' | 'make'
export type SyncStatus = 'off' | 'syncing' | 'ok' | 'error'

export interface SyncConfig {
  token: string
  gistId: string
}

export interface GistPayload {
  catalog: Car[]
  version: number
  updatedAt: number
}
