<script setup lang="ts">
/**
 * PromptInput.vue - 提示词输入组件
 * ChatGPT风格的居中输入区域
 * 支持文字输入和图片上传两种互斥模式
 */
import { ref, computed, watch } from 'vue';
import { useI18n } from '@/composables/useI18n';

type InputMode = 'text' | 'image';

interface Props {
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
});

const emit = defineEmits<{
  (e: 'submit-text', text: string): void;
  (e: 'submit-image', file: File): void;
}>();

const { t } = useI18n();

// 状态
const inputMode = ref<InputMode>('text');
const textInput = ref('');
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

// 计算属性
const canSubmit = computed(() => {
  if (props.disabled || props.loading) return false;
  if (inputMode.value === 'text') {
    return textInput.value.trim().length > 0;
  }
  return selectedFile.value !== null;
});

const placeholderText = computed(() => {
  return inputMode.value === 'text' 
    ? t('chat.placeholder') 
    : t('chat.uploadHint');
});

// 方法
function switchMode(mode: InputMode): void {
  if (inputMode.value === mode) return;
  inputMode.value = mode;
  // 清空另一种模式的数据
  if (mode === 'text') {
    clearImage();
  } else {
    textInput.value = '';
  }
}

function handleTextInput(event: Event): void {
  const target = event.target as HTMLTextAreaElement;
  textInput.value = target.value;
  // 自动调整高度
  target.style.height = 'auto';
  target.style.height = Math.min(target.scrollHeight, 200) + 'px';
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSubmit();
  }
}

function triggerFileSelect(): void {
  fileInputRef.value?.click();
}

function handleFileSelect(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    processFile(file);
  }
  input.value = '';
}

function processFile(file: File): void {
  // 验证文件类型
  const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return;
  }
  
  // 验证文件大小 (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return;
  }
  
  selectedFile.value = file;
  inputMode.value = 'image';
  
  // 创建预览
  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function clearImage(): void {
  selectedFile.value = null;
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = null;
  }
}

function handleDragEnter(event: DragEvent): void {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(event: DragEvent): void {
  event.preventDefault();
  isDragging.value = false;
}

function handleDragOver(event: DragEvent): void {
  event.preventDefault();
}

function handleDrop(event: DragEvent): void {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    processFile(file);
  }
}

function handleSubmit(): void {
  if (!canSubmit.value) return;
  
  if (inputMode.value === 'text') {
    emit('submit-text', textInput.value.trim());
    textInput.value = '';
  } else if (selectedFile.value) {
    emit('submit-image', selectedFile.value);
    clearImage();
    inputMode.value = 'text';
  }
}

// 清理
watch(() => previewUrl.value, (_, oldUrl) => {
  if (oldUrl && oldUrl.startsWith('blob:')) {
    URL.revokeObjectURL(oldUrl);
  }
});
</script>

<template>
  <div 
    class="prompt-input"
    :class="{ 'is-dragging': isDragging, 'is-loading': loading }"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <!-- 模式切换标签 -->
    <div class="mode-tabs">
      <button 
        class="mode-tab" 
        :class="{ active: inputMode === 'text' }"
        @click="switchMode('text')"
        :disabled="loading"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7V4h16v3M9 20h6M12 4v16" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ t('inputMode.text') }}</span>
      </button>
      <button 
        class="mode-tab" 
        :class="{ active: inputMode === 'image' }"
        @click="switchMode('image')"
        :disabled="loading"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15l-5-5L5 21" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ t('inputMode.image') }}</span>
      </button>
    </div>

    <!-- 输入区域 -->
    <div class="input-container">
      <!-- 文字输入模式 -->
      <div v-if="inputMode === 'text'" class="text-input-wrapper">
        <textarea
          ref="textareaRef"
          v-model="textInput"
          class="text-input"
          :placeholder="placeholderText"
          :disabled="disabled || loading"
          rows="1"
          @input="handleTextInput"
          @keydown="handleKeyDown"
        ></textarea>
      </div>

      <!-- 图片上传模式 -->
      <div v-else class="image-input-wrapper">
        <input
          ref="fileInputRef"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="hidden-input"
          @change="handleFileSelect"
        />
        
        <!-- 图片预览 -->
        <div v-if="previewUrl" class="image-preview">
          <img :src="previewUrl" alt="Preview" />
          <button class="remove-image" @click="clearImage" :title="t('common.delete')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <!-- 上传区域 -->
        <button 
          v-else 
          class="upload-area" 
          @click="triggerFileSelect"
          :disabled="disabled || loading"
        >
          <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="upload-text">{{ t('chat.uploadHint') }}</span>
          <span class="upload-hint">PNG, JPG, WebP (max 10MB)</span>
        </button>
      </div>

      <!-- 发送按钮 -->
      <button 
        class="submit-btn"
        :class="{ active: canSubmit }"
        :disabled="!canSubmit"
        @click="handleSubmit"
        :title="t('common.send')"
      >
        <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div v-else class="loading-spinner"></div>
      </button>
    </div>

    <!-- 拖拽提示 -->
    <Transition name="fade">
      <div v-if="isDragging" class="drag-overlay">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ t('chat.uploadHint') }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.prompt-input {
  position: relative;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}

/* 模式切换标签 */
.mode-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
  justify-content: center;
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast) ease-out;
}

.mode-tab svg {
  width: 16px;
  height: 16px;
}

.mode-tab:hover:not(:disabled) {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
}

.mode-tab.active {
  background: var(--accent-light);
  border-color: var(--accent);
  color: var(--accent);
}

.mode-tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 输入容器 */
.input-container {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-glass);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-glow);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg), var(--shadow-glow-subtle);
  transition: all var(--transition-normal) ease-out;
}

.input-container:hover {
  border-color: var(--border-glow-hover);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.input-container:focus-within {
  border-color: var(--accent);
  box-shadow: var(--shadow-lg), var(--shadow-glow-active);
}

.is-dragging .input-container {
  border-color: var(--accent);
  border-style: dashed;
}

/* 文字输入 */
.text-input-wrapper {
  flex: 1;
  min-width: 0;
}

.text-input {
  width: 100%;
  min-height: 44px;
  max-height: 200px;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: 15px;
  line-height: 1.5;
  color: var(--text-primary);
}

.text-input::placeholder {
  color: var(--text-muted);
}

/* 图片输入 */
.image-input-wrapper {
  flex: 1;
  min-width: 0;
}

.hidden-input {
  display: none;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 120px;
  padding: var(--spacing-lg);
  background: transparent;
  border: 2px dashed var(--border-glass);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast) ease-out;
}

.upload-area:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--accent-lighter);
}

.upload-area:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-icon {
  width: 40px;
  height: 40px;
  color: var(--text-muted);
  margin-bottom: var(--spacing-sm);
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.upload-hint {
  font-size: 12px;
  color: var(--text-muted);
}

/* 图片预览 */
.image-preview {
  position: relative;
  width: 100%;
  max-height: 200px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  max-height: 200px;
  object-fit: contain;
  background: var(--bg-secondary);
}

.remove-image {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: var(--radius-full);
  color: #fff;
  cursor: pointer;
  transition: all var(--transition-fast) ease-out;
}

.remove-image:hover {
  background: rgba(239, 68, 68, 0.9);
}

.remove-image svg {
  width: 16px;
  height: 16px;
}

/* 发送按钮 */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  background: var(--bg-secondary);
  border: none;
  border-radius: var(--radius-lg);
  color: var(--text-muted);
  cursor: not-allowed;
  transition: all var(--transition-fast) ease-out;
}

.submit-btn svg {
  width: 20px;
  height: 20px;
}

.submit-btn.active {
  background: var(--accent);
  color: #fff;
  cursor: pointer;
}

.submit-btn.active:hover {
  background: var(--accent-hover);
  transform: scale(1.05);
}

.submit-btn:disabled {
  opacity: 0.5;
}

/* 加载动画 */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 拖拽遮罩 */
.drag-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  background: var(--accent);
  border-radius: var(--radius-xl);
  color: #fff;
  z-index: 10;
}

.drag-overlay svg {
  width: 48px;
  height: 48px;
}

.drag-overlay span {
  font-size: 16px;
  font-weight: 500;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast) ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .prompt-input {
    max-width: 100%;
  }
  
  .mode-tab span {
    display: none;
  }
  
  .mode-tab {
    padding: var(--spacing-sm);
  }
  
  .mode-tab svg {
    width: 20px;
    height: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
}
</style>
