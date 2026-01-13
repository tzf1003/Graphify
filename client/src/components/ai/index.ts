/**
 * AI 对话组件导出
 */

export { default as InputModeToggle } from './InputModeToggle.vue';
export { default as ChatMessage } from './ChatMessage.vue';
export { default as TypingIndicator } from './TypingIndicator.vue';
export { default as SendButton } from './SendButton.vue';
export { default as AIChatInterface } from './AIChatInterface.vue';
export { default as OnboardingHints } from './OnboardingHints.vue';

// 类型导出
export type { InputMode } from './InputModeToggle.vue';
export type { 
  ChatMessageData, 
  MessageRole, 
  MessageType, 
  MessageStatus 
} from './ChatMessage.vue';
export type { 
  HintContext, 
  Hint, 
  OnboardingHintsProps 
} from './OnboardingHints.vue';
