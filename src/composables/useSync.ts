import { ref, watch } from 'vue'
import type { SyncStatus, SyncConfig, GistPayload } from '../types'
import { useCatalog } from './useCatalog'

const GIST_FILE = 'carlog-catalog.json'
const GIST_API  = 'https://api.github.com/gists'
const CFG_KEY   = 'syncCfg'
const TIME_KEY  = 'lastSyncTime'

function loadConfig(): SyncConfig {
  try { return JSON.parse(localStorage.getItem(CFG_KEY) ?? '{}') }
  catch { return { token: '', gistId: '' } }
}

// Singleton
const config    = ref<SyncConfig>(loadConfig())
const status    = ref<SyncStatus>('off')
const lastSync  = ref<number | null>(+( localStorage.getItem(TIME_KEY) ?? '0') || null)
const isSyncing = ref(false)
let   etag: string | null = null
let   interval: ReturnType<typeof setInterval> | null = null

watch(config, val => localStorage.setItem(CFG_KEY, JSON.stringify(val)), { deep: true })

function headers(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

export function useSync() {
  const { catalog, mergeCars } = useCatalog()

  function saveConfig(token: string, gistId: string) {
    config.value = { token, gistId }
    setupInterval()
  }

  async function createGist(): Promise<string> {
    const { token } = config.value
    if (!token) throw new Error('Token required')
    status.value = 'syncing'
    const payload: GistPayload = { catalog: catalog.value, version: 1, updatedAt: Date.now() }
    const res = await fetch(GIST_API, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({
        description: 'CarLog — do not edit manually',
        public: false,
        files: { [GIST_FILE]: { content: JSON.stringify(payload, null, 2) } },
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message ?? String(res.status))
    config.value.gistId = data.id
    lastSync.value = Date.now()
    localStorage.setItem(TIME_KEY, String(lastSync.value))
    status.value = 'ok'
    setupInterval()
    return data.id
  }

  async function push(): Promise<void> {
    const { token, gistId } = config.value
    if (!token || !gistId || isSyncing.value) return
    isSyncing.value = true
    status.value = 'syncing'
    try {
      const payload: GistPayload = { catalog: catalog.value, version: 1, updatedAt: Date.now() }
      const res = await fetch(`${GIST_API}/${gistId}`, {
        method: 'PATCH',
        headers: headers(token),
        body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(payload, null, 2) } } }),
      })
      if (!res.ok) throw new Error(String(res.status))
      lastSync.value = Date.now()
      localStorage.setItem(TIME_KEY, String(lastSync.value))
      status.value = 'ok'
    } catch {
      status.value = 'error'
    } finally {
      isSyncing.value = false
    }
  }

  async function pull(): Promise<void> {
    const { token, gistId } = config.value
    if (!token || !gistId || isSyncing.value) return
    isSyncing.value = true
    status.value = 'syncing'
    try {
      const hdrs: Record<string, string> = { ...headers(token) }
      if (etag) hdrs['If-None-Match'] = etag

      const res = await fetch(`${GIST_API}/${gistId}`, { headers: hdrs })
      if (res.status === 304) { status.value = 'ok'; lastSync.value = Date.now(); localStorage.setItem(TIME_KEY, String(lastSync.value)); return }
      if (!res.ok) throw new Error(String(res.status))

      etag = res.headers.get('etag')
      const gist = await res.json()
      const raw: string = gist.files?.[GIST_FILE]?.content
      if (!raw) throw new Error('File missing in gist')

      const remote = JSON.parse(raw) as GistPayload
      if (Array.isArray(remote.catalog)) mergeCars(remote.catalog)

      lastSync.value = Date.now()
      localStorage.setItem(TIME_KEY, String(lastSync.value))
      status.value = 'ok'
    } catch {
      status.value = 'error'
    } finally {
      isSyncing.value = false
    }
  }

  function setupInterval() {
    if (interval) clearInterval(interval)
    if (config.value.token && config.value.gistId) {
      pull()
      interval = setInterval(pull, 30_000)
      status.value = 'ok'
    } else {
      status.value = 'off'
    }
  }

  function isConfigured() {
    return !!(config.value.token && config.value.gistId)
  }

  return { config, status, lastSync, isSyncing, saveConfig, createGist, push, pull, setupInterval, isConfigured }
}
