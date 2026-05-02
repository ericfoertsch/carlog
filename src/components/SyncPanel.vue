<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSync } from '../composables/useSync'

const { config, status, lastSync, isSyncing, saveConfig, createGist, push, pull, setupInterval } = useSync()

const open     = ref(false)
const token    = ref(config.value.token)
const gistId   = ref(config.value.gistId)
const creating = ref(false)
const error    = ref('')

const dotClass = computed(() => ({
  sdot: true,
  syncing: status.value === 'syncing',
  ok:      status.value === 'ok',
  err:     status.value === 'error',
}))

const statusText = computed(() => {
  if (!config.value.token || !config.value.gistId) return 'Not configured — tap to set up'
  if (status.value === 'error') return 'Sync error — check token'
  return 'Syncing every 30 s via GitHub'
})

const lastSyncText = computed(() =>
  lastSync.value ? 'Last sync: ' + new Date(lastSync.value).toLocaleTimeString() : 'Never synced'
)

function onInput() {
  error.value = ''
  saveConfig(token.value.trim(), gistId.value.trim())
}

async function handleCreate() {
  error.value = ''
  creating.value = true
  try {
    const id = await createGist()
    gistId.value = id
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    creating.value = false
  }
}

// Init interval on mount if already configured
setupInterval()
</script>

<template>
  <div class="sync-panel">
    <button class="sync-toggle" type="button" @click="open = !open">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
      <div class="sync-toggle-text">
        <strong>Auto-Sync via GitHub</strong>
        <small>{{ statusText }}</small>
      </div>
      <span :class="{ 'sync-chevron': true, 'open': open }">▼</span>
    </button>

    <Transition name="slide">
      <div v-if="open" class="sync-body">
        <div class="sync-status-row">
          <span :class="dotClass" />
          <span>{{ lastSyncText }}</span>
          <button class="btn btn-ghost sm" type="button" :disabled="isSyncing" @click="pull">Pull Now</button>
          <button class="btn btn-ghost sm" type="button" :disabled="isSyncing" @click="push">Push Now</button>
        </div>

        <div class="form-col">
          <label class="form-label">GitHub Personal Access Token</label>
          <input
            v-model="token"
            type="text"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"
            class="mono"
            @input="onInput"
          />
        </div>

        <div class="form-col">
          <label class="form-label">Gist ID</label>
          <div class="row-gap">
            <input
              v-model="gistId"
              type="text"
              placeholder="Leave blank then tap Create Gist"
              autocomplete="off" autocapitalize="none"
              @input="onInput"
            />
            <button class="btn btn-accent" type="button" :disabled="creating || !token" @click="handleCreate">
              {{ creating ? '…' : 'Create Gist' }}
            </button>
          </div>
          <p v-if="error" class="sync-error">{{ error }}</p>
        </div>

        <div class="sync-help">
          <strong>Free, no limits (~1 min setup):</strong><br>
          1. Go to <a href="https://github.com/settings/tokens/new?scopes=gist&description=CarLog" target="_blank">GitHub → Settings → Tokens</a><br>
          2. Check <strong>gist</strong> scope → Generate token<br>
          3. Paste token above → tap <strong>Create Gist</strong><br>
          4. Enter same Token + Gist ID on your other device<br>
          <span class="accent">✓ Free forever &nbsp;✓ Private &nbsp;✓ No request limits</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.sync-panel { background:rgba(232,197,71,.06); border:1px solid rgba(232,197,71,.22); border-radius:12px; margin:10px 14px 0; }
.sync-toggle { display:flex; align-items:center; gap:10px; padding:12px 14px; width:100%; background:none; border:none; border-radius:12px; text-align:left; color:inherit; font-family:inherit; cursor:pointer; -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
.sync-toggle-text { flex:1; font-size:13px; color:var(--accent); }
.sync-toggle-text strong { display:block; font-weight:600; font-size:14px; }
.sync-toggle-text small { font-size:11px; color:var(--muted); }
.sync-chevron { color:var(--muted); font-size:11px; transition:transform .25s; display:inline-block; }
.sync-chevron.open { transform:rotate(180deg); }
.sync-body { padding:12px 14px 16px; border-top:1px solid rgba(232,197,71,.15); overflow:visible; }
.sync-status-row { display:flex; align-items:center; gap:8px; margin-bottom:12px; font-size:12px; color:var(--muted); flex-wrap:wrap; }
.row-gap { display:flex; gap:8px; }
.row-gap input { flex:1; }
.sync-error { color:var(--accent2); font-size:12px; margin-top:6px; }
.sync-help { font-size:11px; color:var(--muted); margin-top:10px; line-height:1.6; }
.sync-help a { color:var(--accent); text-decoration:none; }
.accent { color:var(--accent); }
.mono { font-family:monospace; font-size:12px; }
.btn.sm { padding:5px 10px; font-size:11px; }

/* Transition */
.slide-enter-active, .slide-leave-active { transition: max-height .3s ease, opacity .2s ease; max-height:600px; overflow:hidden; }
.slide-enter-from, .slide-leave-to { max-height:0; opacity:0; }

/* Sync dot */
.sdot { width:8px; height:8px; border-radius:50%; background:var(--border); display:inline-block; flex-shrink:0; transition:background .3s; }
.sdot.syncing { background:var(--accent); animation:pulse 1s infinite; }
.sdot.ok  { background:#4caf50; }
.sdot.err { background:var(--accent2); }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
</style>
