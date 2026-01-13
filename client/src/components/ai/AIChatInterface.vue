<script setup lang="ts">
/**
 * AIChatInterface 组件
 * AI 对话交互界面，集成所有子组件
 * 
 * Requirements: 4.1, 4.2, 4.5, 5.5, 5.6, 8.3, 8.4
 */
import { ref, computed, nextTick, watch, onMounted } from 'vue';
import { useI18n } from '../../composables/useI18n';
import InputModeToggle, { type InputMode } from './InputModeToggle.vue';
import ChatMessage, { type ChatMessageData, type MessageStatus } from './ChatMessage.vue';
import TypingIndicator from './TypingIndicator.vue';
import SendButton from './SendButton.vue';

export interface AIChatInterfaceProps {
  /** 项目 ID */
  projectId?: string;
}

defineProps<AIChatInterfaceProps>();

const emit = defineEmits<{
  (e: 'image-generated', imageUrl: string, jsonData: object): void;
  (e: 'image-uploaded', imageUrl: string): void;
  (e: 'message-sent', message: ChatMessageData): void;
}>();

const { t } = useI18n();

// ==================== 状态管理 ====================

// 输入模式
const inputMode = ref<InputMode>('text');

// 文本输入
const inputText = ref('');

// 待上传的图片
const pendingImage = ref<File | null>(null);
const pendingImagePreview = ref<string | null>(null);

// 是否正在处理
const isProcessing = ref(false);

// 对话历史
const messages = ref<ChatMessageData[]>([]);

// DOM 引用
const messagesContainerRef = ref<HTMLDivElement | null>(null);
const textInputRef = ref<HTMLTextAreaElement | null>(null);

// ==================== 计算属性 ====================

// 是否可以发送
const canSend = computed(() => {
  if (isProcessing.value) return false;
  if (inputMode.value === 'text') {
    return inputText.value.trim().length > 0;
  }
  return pendingImage.value !== null;
});

// 是否为空状态
const isEmpty = computed(() => messages.value.length === 0);

// ==================== 方法 ====================

// 生成唯一 ID
const generateId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight;
  }
};

// 处理输入模式切换
const handleModeChange = (mode: InputMode) => {
  inputMode.value = mode;
  // 切换到文字模式时清除待上传图片
  if (mode === 'text') {
    clearPendingImage();
  }
};

// 处理文件选择
const handleFileSelected = (file: File) => {
  // 验证文件类型
  const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    console.warn('Invalid file type:', file.type);
    return;
  }
  
  // 验证文件大小 (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    console.warn('File too large:', file.size);
    return;
  }
  
  pendingImage.value = file;
  
  // 创建预览 URL
  if (pendingImagePreview.value) {
    URL.revokeObjectURL(pendingImagePreview.value);
  }
  pendingImagePreview.value = URL.createObjectURL(file);
};

// 清除待上传图片
const clearPendingImage = () => {
  if (pendingImagePreview.value) {
    URL.revokeObjectURL(pendingImagePreview.value);
  }
  pendingImage.value = null;
  pendingImagePreview.value = null;
};

// 添加消息到历史
const addMessage = (message: Omit<ChatMessageData, 'id' | 'timestamp'>) => {
  const newMessage: ChatMessageData = {
    ...message,
    id: generateId(),
    timestamp: new Date()
  };
  messages.value.push(newMessage);
  scrollToBottom();
  return newMessage;
};

// 更新消息状态
const updateMessageStatus = (messageId: string, status: MessageStatus) => {
  const message = messages.value.find(m => m.id === messageId);
  if (message) {
    message.status = status;
  }
};

// 发送文字消息
const sendTextMessage = async () => {
  const text = inputText.value.trim();
  if (!text) return;
  
  // 添加用户消息
  const userMessage = addMessage({
    role: 'user',
    content: text,
    type: 'text',
    status: 'sending'
  });
  
  // 清空输入
  inputText.value = '';
  
  // 开始处理
  isProcessing.value = true;
  
  try {
    // 模拟 AI 响应（实际应调用 API）
    await simulateAIResponse(text);
    updateMessageStatus(userMessage.id, 'sent');
    emit('message-sent', userMessage);
  } catch (error) {
    updateMessageStatus(userMessage.id, 'error');
    console.error('Failed to send message:', error);
  } finally {
    isProcessing.value = false;
  }
};

// 发送图片消息
const sendImageMessage = async () => {
  if (!pendingImage.value || !pendingImagePreview.value) return;
  
  // 添加用户消息
  const userMessage = addMessage({
    role: 'user',
    content: t('chat.analyzing'),
    type: 'image',
    imageUrl: pendingImagePreview.value,
    status: 'sending'
  });
  
  // 清除待上传图片（但保留预览 URL 供消息显示）
  const imageFile = pendingImage.value;
  pendingImage.value = null;
  pendingImagePreview.value = null;
  
  // 切换回文字模式
  inputMode.value = 'text';
  
  // 开始处理
  isProcessing.value = true;
  
  try {
    // 模拟图片分析（实际应调用 API）
    await simulateImageAnalysis(imageFile);
    updateMessageStatus(userMessage.id, 'sent');
    emit('image-uploaded', userMessage.imageUrl!);
    emit('message-sent', userMessage);
  } catch (error) {
    updateMessageStatus(userMessage.id, 'error');
    console.error('Failed to upload image:', error);
  } finally {
    isProcessing.value = false;
  }
};

// 发送消息（根据当前模式）
const sendMessage = () => {
  if (!canSend.value) return;
  
  if (inputMode.value === 'text') {
    sendTextMessage();
  } else {
    sendImageMessage();
  }
};

// 处理键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  // Enter 键发送（Shift+Enter 换行）
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

// 模拟 AI 响应（开发用）
const simulateAIResponse = async (userText: string) => {
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
  
  // 添加 AI 响应
  addMessage({
    role: 'assistant',
    content: `收到您的消息："${userText}"。这是一个模拟的 AI 响应。在实际应用中，这里会显示 AI 生成的图片或分析结果。`,
    type: 'text',
    status: 'sent'
  });
};

// 模拟图片分析（开发用）
const simulateImageAnalysis = async (_file: File) => {
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
  
  // 添加 AI 响应
  addMessage({
    role: 'assistant',
    content: '图片分析完成！这是一个模拟的分析结果。在实际应用中，这里会显示从图片中提取的 JSON 结构。',
    type: 'text',
    status: 'sent'
  });
};

// 自动调整文本框高度
const autoResizeTextarea = () => {
  if (textInputRef.value) {
    textInputRef.value.style.height = 'auto';
    textInputRef.value.style.height = Math.min(textInputRef.value.scrollHeight, 150) + 'px';
  }
};

// 监听输入变化
watch(inputText, () => {
  autoResizeTextarea();
});

// 组件挂载
onMounted(() => {
  // 聚焦输入框
  textInputRef.value?.focus();
});
</script>

<template>
  <div class="ai-chat-interface">
    <!-- 消息列表区域 -->
    <div 
      ref="messagesContainerRef"
      class="messages-container"
    >
      <!-- 空状态 -->
      <div v-if="isEmpty" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="empty-text">{{ t('chat.emptyState') }}</p>
      </div>

      <!-- 消息列表 -->
      <div v-else class="messages-list">
        <ChatMessage
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />
      </div>

      <!-- 打字指示器 -->
      <TypingIndicator 
        :visible="isProcessing"
        :text="inputMode === 'image' ? t('chat.analyzing') : t('chat.generating')"
      />
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <!-- 图片预览 -->
      <Transition name="preview-fade">
        <div v-if="pendingImagePreview" class="image-preview">
          <img :src="pendingImagePreview" alt="Preview" class="preview-image" />
          <button 
            type="button"
            class="preview-remove"
            :aria-label="t('common.cancel')"
            @click="clearPendingImage"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </Transition>

      <!-- 输入控制栏 -->
      <div class="input-controls">
        <!-- 模式切换 -->
        <InputModeToggle
          :model-value="inputMode"
          :disabled="isProcessing"
          @update:model-value="handleModeChange"
          @file-selected="handleFileSelected"
        />

        <!-- 文本输入框 -->
        <div class="text-input-wrapper">
          <textarea
            ref="textInputRef"
            v-model="inputText"
            class="text-input"
            :class="{ 'text-input--hidden': inputMode === 'image' && pendingImage }"
            :placeholder="t('chat.placeholder')"
            :disabled="isProcessing || (inputMode === 'image' && !!pendingImage)"
            rows="1"
            @keydown="handleKeyDown"
          />
        </div>

        <!-- 发送按钮 -->
        <SendButton
          :disabled="!canSend"
          :loading="isProcessing"
          @click="sendMessage"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

/* 消息容器 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  scroll-behavior: smooth;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-text {
  font-size: 14px;
  max-width: 280px;
}

/* 消息列表 */
.messages-list {
  display: flex;
  flex-direction: column;
}

/* 输入区域 */
.input-area {
  flex-shrink: 0;
  padding: var(--spacing-md);
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border-top: 1px solid var(--border-glass);
}

/* 图片预览 */
.image-preview {
  position: relative;
  display: inline-block;
  margin-bottom: var(--spacing-sm);
}

.preview-image {
  max-width: 200px;
  max-height: 150px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.preview-remove {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--error);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast) ease-out;
}

.preview-remove:hover {
  transform: scale(1.1);
}

.preview-remove svg {
  width: 16px;
  height: 16px;
}

/* 预览过渡动画 */
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: all var(--transition-normal) ease-out;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 输入控制栏 */
.input-controls {
  display: flex;
  align-items: flex-end;
  gap: var(--spacing-sm);
}

/* 文本输入包装器 */
.text-input-wrapper {
  flex: 1;
  min-width: 0;
}

/* 文本输入框 */
.text-input {
  width: 100%;
  min-height: 40px;
  max-height: 150px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  transition: 
    border-color var(--transition-fast) ease-out,
    box-shadow var(--transition-fast) ease-out;
}

.text-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.text-input::placeholder {
  color: var(--text-muted);
}

.text-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-input--hidden {
  opacity: 0.3;
}

/* 响应式 */
@media (max-width: 768px) {
  .messages-container {
    padding: var(--spacing-sm);
  }
  
  .input-area {
    padding: var(--spacing-sm);
    /* Safe area support for devices with notches */
    padding-bottom: max(var(--spacing-sm), env(safe-area-inset-bottom, 0px));
  }
  
  .input-controls {
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }
  
  .text-input-wrapper {
    order: 1;
    flex-basis: 100%;
    margin-bottom: var(--spacing-xs);
  }
  
  /* Ensure text input is large enough for touch */
  .text-input {
    min-height: var(--touch-target-min, 44px);
    font-size: 16px; /* Prevents iOS zoom on focus */
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  /* Larger touch targets for buttons */
  .preview-remove {
    width: 32px;
    height: 32px;
    top: -10px;
    right: -10px;
  }
  
  .preview-remove svg {
    width: 20px;
    height: 20px;
  }
  
  /* Adjust image preview for mobile */
  .preview-image {
    max-width: 150px;
    max-height: 120px;
  }
  
  /* Empty state adjustments */
  .empty-icon {
    width: 48px;
    height: 48px;
  }
  
  .empty-text {
    font-size: 13px;
    max-width: 240px;
  }
}

/* Small mobile devices */
@media (max-width: 375px) {
  .input-area {
    padding: var(--spacing-xs);
  }
  
  .text-input {
    padding: var(--spacing-xs) var(--spacing-sm);
  }
}
</style>
