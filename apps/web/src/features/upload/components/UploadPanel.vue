<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  status: 'idle' | 'submitting' | 'awaiting-location' | 'success' | 'error'
}>()

const isMobile = computed(() => {
  if (typeof navigator === 'undefined') return false

  return /android|iphone|ipad|ipod|mobile|samsung/i.test(navigator.userAgent)
})

const emit = defineEmits<{ submit: [file: File] }>()

const selectedFile = ref<File | null>(null)
const previewUrl = ref('')

function revokePreview() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
}

function handleSelection(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (input) input.value = ''
  if (!file) return
  revokePreview()
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function clearSelection() {
  revokePreview()
  selectedFile.value = null
}

function submit() {
  if (!selectedFile.value || props.status === 'submitting') return
  emit('submit', selectedFile.value)
}

watch(() => props.status, (next) => {
  if (next === 'success') clearSelection()
})

onBeforeUnmount(revokePreview)
</script>

<template>
  <section class="upload" :aria-busy="status === 'submitting'">
    <!-- IDLE — paper drop zone -->
    <div v-if="!selectedFile" class="drop">
      <span class="tape tape-l" aria-hidden="true" />
      <span class="tape tape-r" aria-hidden="true" />
      <div class="drop-icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </div>
      <h2 class="drop-title">
        Tape a photo here
      </h2>
      <p class="drop-sub">
        貼上一張照片開始
      </p>
      <p class="drop-meta">
        JPG · PNG · HEIC · ≤ 10MB
      </p>
      <p v-if="isMobile" class="drop-hint" data-testid="mobile-hint">
        手機相簿常會剝掉 GPS。<br>
        iOS 17+ 請點選圖時左下「Options → Include Location」<br>
        其他情況下方會問你要不要用裝置目前位置。
      </p>
      <div class="drop-actions">
        <label class="btn btn-primary" :class="{ disabled: status === 'submitting' }">
          <span>Choose photo · 選檔</span>
          <input
            accept="image/*" type="file" class="sr-only"
            data-testid="file-input"
            :disabled="status === 'submitting'"
            @change="handleSelection"
          >
        </label>
        <label class="btn btn-ghost" :class="{ disabled: status === 'submitting' }" aria-label="Use camera">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
          <input
            accept="image/*" capture="environment" type="file" class="sr-only"
            data-testid="camera-input"
            :disabled="status === 'submitting'"
            @change="handleSelection"
          >
        </label>
      </div>
    </div>

    <!-- PREVIEW -->
    <div v-else class="preview">
      <div class="preview-img">
        <img :src="previewUrl" :alt="selectedFile.name" data-testid="photo-preview">
        <span class="tape tape-l" aria-hidden="true" />
      </div>
      <div class="preview-meta">
        <p class="eyebrow">
          · Ready to send ·
        </p>
        <p class="filename" data-testid="selected-file-name">
          {{ selectedFile.name }}
        </p>
        <p class="filesize">
          {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
        </p>
        <div class="preview-actions">
          <button
            class="btn btn-primary"
            type="button"
            data-testid="submit-photo"
            :disabled="status === 'submitting'"
            @click="submit"
          >
            <span v-if="status === 'submitting'" class="spinner" aria-hidden="true" />
            <span>{{ status === 'submitting' ? 'Reading clues…' : 'Find this place · 開始定位' }}</span>
          </button>
          <button
            class="btn btn-ghost"
            type="button"
            data-testid="reset-photo"
            :disabled="status === 'submitting'"
            @click="clearSelection"
          >
            Reset · 重選
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.upload { display: grid; gap: 0; }

/* Drop zone */
.drop {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.6rem;
  padding: 2.5rem 1.5rem 2rem;
  border: 1.5px dashed var(--edge);
  border-radius: var(--r-sm);
  background: var(--paper-warm);
  text-align: center;
}
.tape { display: block; width: 64px; height: 22px; }
.tape-l { top: -10px; left: 28px; transform: rotate(-4deg); }
.tape-r { top: -8px; right: 24px; width: 54px; height: 20px; transform: rotate(3deg); background: rgba(74, 107, 58, 0.3); }

.drop-icon {
  width: 56px; height: 56px; border-radius: 50%;
  border: 1.5px solid var(--ink);
  display: grid; place-items: center;
  margin-bottom: 0.4rem;
}
.drop-title {
  font-family: var(--serif); font-weight: 400;
  font-size: 1.6rem; margin: 0; line-height: 1.1;
}
.drop-sub { margin: 0; font-size: 0.85rem; color: var(--ink-2); }
.drop-meta { margin: 0.2rem 0 0.6rem; font-family: var(--mono); font-size: 0.65rem; letter-spacing: 0.16em; color: var(--ink-2); }

.drop-hint {
  margin: -0.2rem 0 0.6rem;
  padding: 0.55rem 0.8rem;
  font-size: 0.78rem;
  line-height: 1.5;
  color: var(--ink-2);
  border: 1px dashed rgba(184, 120, 43, 0.45);
  border-radius: var(--r-sm);
  background: rgba(184, 120, 43, 0.06);
  max-width: 22rem;
}

.drop-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; justify-content: center; }

.btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.1rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: transform 0.1s, background 0.15s, border-color 0.15s;
}
.btn:active { transform: translateY(1px); }
.btn-primary {
  background: var(--ink); color: var(--paper); border-color: var(--ink);
}
.btn-primary:hover:not(.disabled):not(:disabled) { background: #1c1814; }
.btn-ghost {
  background: transparent; color: var(--ink); border-color: var(--ink);
}
.btn-ghost:hover:not(.disabled):not(:disabled) { background: rgba(43, 37, 32, 0.06); }
.btn:disabled, .btn.disabled { cursor: not-allowed; opacity: 0.55; }

/* Preview */
.preview {
  display: grid;
  grid-template-columns: minmax(0, 220px) 1fr;
  gap: 1.25rem;
  align-items: center;
}
.preview-img {
  position: relative;
  border-radius: var(--r-sm);
  overflow: visible;
}
.preview-img img {
  width: 100%; max-height: 260px; object-fit: cover;
  border-radius: var(--r-sm);
  background: var(--paper-deep);
  display: block;
}
.preview-img .tape-l { top: -10px; left: 16px; }
.preview-meta { display: grid; gap: 0.35rem; }
.filename {
  margin: 0;
  font-family: var(--serif);
  font-size: 1.15rem;
  word-break: break-all;
  line-height: 1.25;
}
.filesize { margin: 0; font-family: var(--mono); font-size: 0.7rem; color: var(--ink-2); letter-spacing: 0.1em; }
.preview-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }

.spinner {
  width: 0.85rem; height: 0.85rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

@media (max-width: 560px) {
  .preview { grid-template-columns: 1fr; }
}
</style>
