<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  select: [file: File]
}>()

const selectedFileName = ref('')

function handleSelection(event: Event) {
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]

  if (!file) {
    return
  }

  selectedFileName.value = file.name
  emit('select', file)
  input.value = ''
}
</script>

<template>
  <section class="upload-panel">
    <div class="copy">
      <p class="eyebrow">
        Step 1
      </p>
      <h2>上傳要分析的照片</h2>
      <p>
        支援從裝置選檔，或直接開啟相機拍照。選到檔案後會立即交給分析流程。
      </p>
    </div>

    <div class="actions">
      <label class="action-button">
        <span>從裝置選檔</span>
        <input
          accept="image/*"
          class="sr-only"
          data-testid="file-input"
          type="file"
          @change="handleSelection"
        >
      </label>

      <label class="action-button action-button-secondary">
        <span>直接拍照</span>
        <input
          accept="image/*"
          capture="environment"
          class="sr-only"
          data-testid="camera-input"
          type="file"
          @change="handleSelection"
        >
      </label>
    </div>

    <p
      v-if="selectedFileName"
      class="selected-file"
    >
      已選擇：{{ selectedFileName }}
    </p>
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

.eyebrow {
  margin: 0 0 0.5rem;
  color: #92400e;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
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
  padding: 0.85rem 1.1rem;
  border-radius: 999px;
  background: #1f2937;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

.action-button-secondary {
  background: #92400e;
}

.selected-file {
  margin: 0;
  color: #475569;
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
</style>
