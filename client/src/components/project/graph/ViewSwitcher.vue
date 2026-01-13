<script setup lang="ts">
/**
 * 视图切换组件
 * 用于在图谱视图和JSON视图之间切换
 * 
 * 功能：
 * - 提供 Graph View 和 JSON View 切换按钮
 * - 切换时验证数据有效性
 * - 如果JSON无效，显示错误并阻止切换到Graph View
 * 
 * Requirements: 5.1, 5.4, 5.5
 */

// ==================== Props ====================
interface Props {
  /** 当前视图模式 */
  modelValue: 'graph' | 'json';
  /** 是否禁用切换 */
  disabled?: boolean;
  /** 是否有验证错误（用于阻止切换到Graph View） */
  hasValidationError?: boolean;
  /** 验证错误信息 */
  validationErrorMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  hasValidationError: false,
  validationErrorMessage: '',
});

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'update:modelValue', value: 'graph' | 'json'): void;
  (e: 'before-switch', targetView: 'graph' | 'json'): void;
}>();

// ==================== 方法 ====================

/**
 * 处理视图切换
 * @param targetView 目标视图
 */
function handleSwitch(targetView: 'graph' | 'json') {
  // 如果已经是当前视图，不做任何操作
  if (targetView === props.modelValue) return;
  
  // 如果禁用，不做任何操作
  if (props.disabled) return;
  
  // 如果切换到 Graph View 且有验证错误，阻止切换
  if (targetView === 'graph' && props.hasValidationError) {
    return;
  }
  
  // 发出切换前事件，允许父组件进行验证
  emit('before-switch', targetView);
  
  // 发出更新事件
  emit('update:modelValue', targetView);
}
</script>

<template>
  <div class="view-switcher">
    <!-- 切换按钮组 -->
    <div class="view-switcher__buttons">
      <!-- Graph View 按钮 -->
      <button
        class="view-switcher__btn"
        :class="{
          'view-switcher__btn--active': modelValue === 'graph',
          'view-switcher__btn--disabled': disabled || (hasValidationError && modelValue === 'json'),
        }"
        :disabled="disabled || (hasValidationError && modelValue === 'json')"
        :title="hasValidationError && modelValue === 'json' 
          ? validationErrorMessage || 'JSON格式错误，无法切换到图谱视图' 
          : '切换到图谱视图'"
        @click="handleSwitch('graph')"
      >
        <!-- 图谱图标 -->
        <svg 
          class="view-switcher__icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="12" cy="18" r="3" />
          <path d="M8.5 7.5L10.5 16" />
          <path d="M15.5 7.5L13.5 16" />
        </svg>
        <span>Graph View</span>
      </button>
      
      <!-- JSON View 按钮 -->
      <button
        class="view-switcher__btn"
        :class="{
          'view-switcher__btn--active': modelValue === 'json',
          'view-switcher__btn--disabled': disabled,
        }"
        :disabled="disabled"
        title="切换到JSON视图"
        @click="handleSwitch('json')"
      >
        <!-- JSON图标 -->
        <svg 
          class="view-switcher__icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
          <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
        </svg>
        <span>JSON View</span>
      </button>
    </div>
    
    <!-- 验证错误提示 -->
    <div 
      v-if="hasValidationError && modelValue === 'json'" 
      class="view-switcher__error"
    >
      <svg 
        class="view-switcher__error-icon" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <span>{{ validationErrorMessage || 'JSON格式错误，请修复后再切换' }}</span>
    </div>
  </div>
</template>

<style scoped>
.view-switcher {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.view-switcher__buttons {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #1a1a2e;
  border-radius: 8px;
}

.view-switcher__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #888;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-switcher__btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  color: #ccc;
}

.view-switcher__btn--active {
  background: #3b82f6 !important;
  color: #fff !important;
}

.view-switcher__btn--active:hover:not(:disabled) {
  background: #2563eb !important;
}

.view-switcher__btn--disabled,
.view-switcher__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.view-switcher__icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.view-switcher__error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #ef4444;
  font-size: 11px;
}

.view-switcher__error-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}
</style>
