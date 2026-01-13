<script setup lang="ts">
/**
 * ChatMessage 组件
 * 显示用户和 AI 的对话消息，支持文字和图片类型
 * 
 * Requirements: 4.4, 4.6
 */
import { computed } from 'vue';
import { useI18n } from '../../composables/useI18n';

export type MessageRole = 'user' | 'assistant';
export type MessageType = 'text' | 'image';
export type MessageStatus = 'sending' | 'sent' | 'error';

export interface ChatMessageData {
  id: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  imageUrl?: string;
  timestamp: Date;
  status: MessageStatus;
}

export interface ChatMessageProps {
  message: ChatMessageData;
}

const props = defineProps<ChatMessageProps>();

const { t } = useI18n();

// 计算消息角色
const isUser = computed(() => props.message.role === 'user');
// isAssistant 保留用于未来扩展

// 计算消息类型
const isTextMessage = computed(() => props.message.type === 'text');
const isImageMessage = computed(() => props.message.type === 'image');

// 计算消息状态
const isSending = computed(() => props.message.status === 'sending');
const hasError = computed(() => props.message.status === 'error');

// 格式化时间
const formattedTime = computed(() => {
  const date = props.message.timestamp;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});
</script>

<template>
  <div 
    class="chat-message"
    :class="[
      `chat-message--${message.role}`,
      { 'chat-message--sending': isSending },
      { 'chat-message--error': hasError }
    ]"
  >
    <!-- 头像 -->
    <div class="message-avatar">
      <!-- 用户头像 -->
      <div v-if="isUser" class="avatar avatar--user">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
      <!-- AI 头像 -->
      <div v-else class="avatar avatar--assistant">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      </div>
    </div>

    <!-- 消息内容 -->
    <div class="message-content">
      <!-- 文字消息 -->
      <div v-if="isTextMessage" class="message-bubble">
        <p class="message-text">{{ message.content }}</p>
      </div>

      <!-- 图片消息 -->
      <div v-else-if="isImageMessage" class="message-bubble message-bubble--image">
        <img 
          v-if="message.imageUrl"
          :src="message.imageUrl" 
          :alt="message.content || 'Image'"
          class="message-image"
          loading="lazy"
        />
        <p v-if="message.content" class="message-caption">{{ message.content }}</p>
      </div>

      <!-- 消息元信息 -->
      <div class="message-meta">
        <span class="message-time">{{ formattedTime }}</span>
        
        <!-- 发送状态指示 -->
        <span v-if="isUser" class="message-status">
          <!-- 发送中 -->
          <span v-if="isSending" class="status-sending">
            <svg class="status-icon status-icon--spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32" />
            </svg>
          </span>
          <!-- 已发送 -->
          <span v-else-if="!hasError" class="status-sent">
            <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <!-- 发送失败 -->
          <span v-else class="status-error" :title="t('common.error')">
            <svg class="status-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-message {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  animation: messageSlideIn var(--transition-normal) ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 用户消息 - 右对齐 */
.chat-message--user {
  flex-direction: row-reverse;
}

/* 发送中状态 */
.chat-message--sending {
  opacity: 0.7;
}

/* 错误状态 */
.chat-message--error .message-bubble {
  border-color: var(--error);
}

/* 头像 */
.message-avatar {
  flex-shrink: 0;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.avatar svg {
  width: 20px;
  height: 20px;
}

.avatar--user {
  background: var(--accent);
}

.avatar--assistant {
  background: linear-gradient(135deg, var(--accent), var(--accent-hover));
}

/* 消息内容区域 */
.message-content {
  max-width: 70%;
  min-width: 100px;
}

/* 消息气泡 */
.message-bubble {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-glass);
  word-wrap: break-word;
}

/* 用户消息气泡 */
.chat-message--user .message-bubble {
  background: var(--accent);
  color: white;
  border-color: transparent;
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg);
}

/* AI 消息气泡 */
.chat-message--assistant .message-bubble {
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg) var(--radius-sm);
}

/* 消息文本 */
.message-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

/* 图片消息 */
.message-bubble--image {
  padding: var(--spacing-xs);
  overflow: hidden;
}

.message-image {
  display: block;
  max-width: 100%;
  max-height: 300px;
  border-radius: var(--radius-md);
  object-fit: contain;
}

.message-caption {
  margin: var(--spacing-xs) var(--spacing-xs) 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.chat-message--user .message-caption {
  color: rgba(255, 255, 255, 0.9);
}

/* 消息元信息 */
.message-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-xs);
  padding: 0 var(--spacing-xs);
}

.chat-message--user .message-meta {
  justify-content: flex-end;
}

.message-time {
  font-size: 11px;
  color: var(--text-muted);
}

/* 状态图标 */
.message-status {
  display: flex;
  align-items: center;
}

.status-icon {
  width: 14px;
  height: 14px;
}

.status-sending .status-icon {
  color: var(--text-muted);
}

.status-icon--spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.status-sent .status-icon {
  color: var(--success);
}

.status-error .status-icon {
  color: var(--error);
}

/* 响应式 */
@media (max-width: 768px) {
  .message-content {
    max-width: 85%;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
  }
  
  .avatar svg {
    width: 18px;
    height: 18px;
  }
}
</style>
