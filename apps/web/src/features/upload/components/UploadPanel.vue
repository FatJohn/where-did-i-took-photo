<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  status: 'idle' | 'submitting' | 'success' | 'error'
}>()

const emit = defineEmits<{
  submit: [file: File]
}>()

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

  if (input) {
    input.value = ''
  }

  if (!file) {
    return
  }

  revokePreview()
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function clearSelection() {
  revokePreview()
  selectedFile.value = null
}

function submit() {
  if (!selectedFile.value || props.status === 'submitting') {
    return
  }
  emit('submit', selectedFile.value)
}

watch(
  () => props.status,
  (next) => {
    if (next === 'success') {
      clearSelection()
    }
  },
)

onBeforeUnmount(revokePreview)
</script>

<template>
  <section
    class="upload-panel"
    :aria-busy="status === 'submitting'"
  >
    <div class="copy">
      <h2>上傳要分析的照片</h2>
      <p>
        支援從裝置選檔，或直接開啟相機拍照。確認縮圖正確後再送出分析。
      </p>
    </div>

    <div
      v-if="!selectedFile"
      class="actions"
    >
      <label
        class="action-button"
        :class="{ 'action-button-disabled': status === 'submitting' }"
      >
        <span>從裝置選檔</span>
        <input
          accept="image/*"
          class="sr-only"
          data-testid="file-input"
          type="file"
          :disabled="status === 'submitting'"
          @change="handleSelection"
        >
      </label>

      <label
        class="action-button action-button-secondary"
        :class="{ 'action-button-disabled': status === 'submitting' }"
      >
        <span>直接拍照</span>
        <input
          accept="image/*"
          capture="environment"
          class="sr-only"
          data-testid="camera-input"
          type="file"
          :disabled="status === 'submitting'"
          @change="handleSelection"
        >
      </label>
    </div>

    <div
      v-else
      class="preview"
    >
      <img
        :src="previewUrl"
        :alt="selectedFile.name"
        class="preview-image"
        data-testid="photo-preview"
      >
      <div class="preview-meta">
        <p
          class="selected-file"
          data-testid="selected-file-name"
        >
          {{ selectedFile.name }}
        </p>
        <div class="preview-actions">
          <button
            class="action-button"
            data-testid="submit-photo"
            type="button"
            :disabled="status === 'submitting'"
            @click="submit"
          >
            <span
              v-if="status === 'submitting'"
              class="spinner"
              aria-hidden="true"
            />
            <span>{{ status === 'submitting' ? '分析中…' : '分析這張照片' }}</span>
          </button>
          <button
            class="action-button action-button-ghost"
            data-testid="reset-photo"
            type="button"
            :disabled="status === 'submitting'"
            @click="clearSelection"
          >
            重新選擇
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.upload-panel {
  display: grid;
  gap: 1rem;
}

.copy h2,
.copy p {
  margin: 0;
}

.copy p {
  margin-top: 0.75rem;
  line-height: 1.7;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1.1rem;
  border: 0;
  border-radius: 999px;
  background: #1f2937;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.action-button:disabled,
.action-button-disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.action-button-secondary {
  background: #92400e;
}

.action-button-ghost {
  background: transparent;
  color: #1f2937;
  border: 1px solid rgba(31, 41, 55, 0.2);
}

.preview {
  display: grid;
  grid-template-columns: minmax(0, 200px) 1fr;
  gap: 1rem;
  align-items: center;
}

.preview-image {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-radius: 0.75rem;
  background: #f1f5f9;
}

.preview-meta {
  display: grid;
  gap: 0.75rem;
}

.selected-file {
  margin: 0;
  color: #475569;
  word-break: break-all;
}

.preview-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.spinner {
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 520px) {
  .preview {
    grid-template-columns: 1fr;
  }
}
</style>
