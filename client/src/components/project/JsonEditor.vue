<script setup lang="ts">
/**
 * JSON 编辑器组件
 * 集成 Monaco Editor，实现语法高亮和错误提示
 * 实现保存按钮（创建 json_edit 版本）
 */
import { ref, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import * as monaco from 'monaco-editor';
import type { CanonicalJSON } from '../../types';

// ==================== Props ====================
interface Props {
  modelValue: CanonicalJSON | null;
  readonly?: boolean;
  saving?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  saving: false,
});

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'update:modelValue', value: CanonicalJSON): void;
  (e: 'save', jsonString: string): void;
  (e: 'error', error: string): void;
}>();

// ==================== 状态 ====================
const editorContainer = ref<HTMLDivElement | null>(null);
const editor = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);
const hasChanges = ref(false);
const parseError = ref<string | null>(null);
const currentContent = ref('');

// ==================== 初始化编辑器 ====================
onMounted(() => {
  if (!editorContainer.value) return;

  // 配置 Monaco 主题
  monaco.editor.defineTheme('custom-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.lineHighlightBackground': '#2a2a2a',
    },
  });

  // 创建编辑器实例
  editor.value = monaco.editor.create(editorContainer.value, {
    value: formatJson(props.modelValue),
    language: 'json',
    theme: 'custom-dark',
    readOnly: props.readonly,
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 13,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    tabSize: 2,
    formatOnPaste: true,
    formatOnType: true,
    folding: true,
    foldingStrategy: 'indentation',
    renderLineHighlight: 'line',
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
  });

  // 监听内容变化
  editor.value.onDidChangeModelContent(() => {
    const content = editor.value?.getValue() || '';
    currentContent.value = content;
    hasChanges.value = true;
    validateJson(content);
  });

  // 初始化内容
  currentContent.value = formatJson(props.modelValue);
});

// ==================== 清理 ====================
onBeforeUnmount(() => {
  editor.value?.dispose();
});

// ==================== 监听 Props 变化 ====================
watch(() => props.modelValue, (newValue) => {
  if (!editor.value) return;
  
  const newContent = formatJson(newValue);
  const currentEditorContent = editor.value.getValue();
  
  // 只有当外部值与编辑器内容不同时才更新
  if (newContent !== currentEditorContent) {
    editor.value.setValue(newContent);
    hasChanges.value = false;
    parseError.value = null;
  }
});

watch(() => props.readonly, (newValue) => {
  editor.value?.updateOptions({ readOnly: newValue });
});

// ==================== 方法 ====================
function formatJson(value: CanonicalJSON | null): string {
  if (!value) return '{}';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{}';
  }
}

function validateJson(content: string): boolean {
  try {
    JSON.parse(content);
    parseError.value = null;
    return true;
  } catch (err) {
    if (err instanceof SyntaxError) {
      parseError.value = err.message;
    } else {
      parseError.value = '无效的 JSON 格式';
    }
    return false;
  }
}

function handleSave(): void {
  const content = editor.value?.getValue() || '';
  
  if (!validateJson(content)) {
    emit('error', parseError.value || 'JSON 格式错误');
    return;
  }

  emit('save', content);
  hasChanges.value = false;
}

function handleFormat(): void {
  const content = editor.value?.getValue() || '';
  
  try {
    const parsed = JSON.parse(content);
    const formatted = JSON.stringify(parsed, null, 2);
    editor.value?.setValue(formatted);
    parseError.value = null;
  } catch (err) {
    if (err instanceof SyntaxError) {
      parseError.value = err.message;
    }
  }
}

function handleReset(): void {
  if (!editor.value) return;
  editor.value.setValue(formatJson(props.modelValue));
  hasChanges.value = false;
  parseError.value = null;
}
</script>

<template>
  <div class="json-editor">
    <!-- 工具栏 -->
    <div class="json-editor__toolbar">
      <div class="json-editor__title">
        <span>JSON 编辑器</span>
        <span v-if="hasChanges" class="json-editor__modified">已修改</span>
      </div>
      <div class="json-editor__actions">
        <button
          class="json-editor__btn"
          title="格式化"
          :disabled="readonly"
          @click="handleFormat"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 7h16M4 12h10M4 17h16" />
          </svg>
        </button>
        <button
          class="json-editor__btn"
          title="重置"
          :disabled="readonly || !hasChanges"
          @click="handleReset"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <button
          class="json-editor__btn json-editor__btn--primary"
          title="保存"
          :disabled="readonly || !hasChanges || !!parseError || saving"
          @click="handleSave"
        >
          <template v-if="saving">
            <div class="json-editor__spinner"></div>
          </template>
          <template v-else>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span>保存</span>
          </template>
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="parseError" class="json-editor__error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <span>{{ parseError }}</span>
    </div>

    <!-- 编辑器容器 -->
    <div ref="editorContainer" class="json-editor__container"></div>
  </div>
</template>

<style scoped>
.json-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}

.json-editor__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #1e1e1e;
  border-bottom: 1px solid #333;
}

.json-editor__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #fff;
}

.json-editor__modified {
  font-size: 11px;
  font-weight: normal;
  color: #f59e0b;
  padding: 2px 6px;
  background: rgba(245, 158, 11, 0.15);
  border-radius: 4px;
}

.json-editor__actions {
  display: flex;
  gap: 4px;
}

.json-editor__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.json-editor__btn:hover:not(:disabled) {
  background: #333;
  color: #fff;
}

.json-editor__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.json-editor__btn svg {
  width: 14px;
  height: 14px;
}

.json-editor__btn--primary {
  background: #3b82f6;
  color: #fff;
  padding: 0 12px;
}

.json-editor__btn--primary:hover:not(:disabled) {
  background: #2563eb;
}

.json-editor__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.json-editor__error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-size: 12px;
}

.json-editor__error svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.json-editor__container {
  flex: 1;
  min-height: 0;
}
</style>
