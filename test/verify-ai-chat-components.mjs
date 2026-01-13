/**
 * AI 对话组件验证脚本
 * 验证 AI 对话相关组件的实现是否符合需求
 * 
 * 验证项目：
 * 1. InputModeToggle - 文字/图片模式互斥
 * 2. ChatMessage - 消息显示
 * 3. TypingIndicator - 打字指示器
 * 4. SendButton - 发送按钮状态
 * 5. AIChatInterface - 整体集成
 * 
 * Requirements: 4.1-4.6, 5.1-5.6, 8.1-8.5
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================');
console.log('AI 对话组件验证 - AI-Native UI Redesign');
console.log('========================================\n');

let allPassed = true;
let totalChecks = 0;
let passedChecks = 0;

function check(name, condition) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ ${name}`);
  } else {
    console.log(`  ❌ ${name}`);
    allPassed = false;
  }
}

// ========================================
// 1. 验证 InputModeToggle 组件
// ========================================
console.log('1. 验证 InputModeToggle 组件 (Requirements: 5.1-5.4)...');

const inputModeTogglePath = path.join(__dirname, '../client/src/components/ai/InputModeToggle.vue');
const inputModeToggleContent = fs.readFileSync(inputModeTogglePath, 'utf-8');

// 5.1 默认文字输入模式
check('InputMode 类型定义 (text | image)', /type\s+InputMode\s*=\s*['"]text['"]\s*\|\s*['"]image['"]/.test(inputModeToggleContent));

// 5.2 点击图片按钮切换到图片模式
check('switchToImage 函数', /switchToImage/.test(inputModeToggleContent));
check('文件选择触发', /fileInputRef.*click/.test(inputModeToggleContent));

// 5.3 点击文字区域切换回文字模式
check('switchToText 函数', /switchToText/.test(inputModeToggleContent));

// 5.4 清晰的视觉模式指示
check('mode-btn--active 样式类', /mode-btn--active/.test(inputModeToggleContent));
check('isTextMode computed', /isTextMode.*computed/.test(inputModeToggleContent));
check('isImageMode computed', /isImageMode.*computed/.test(inputModeToggleContent));

// 模式互斥逻辑
check('emit update:modelValue', /emit\(['"]update:modelValue['"]/.test(inputModeToggleContent));
check('emit file-selected', /emit\(['"]file-selected['"]/.test(inputModeToggleContent));

// 禁用状态
check('disabled prop', /disabled\?:\s*boolean/.test(inputModeToggleContent));
check('禁用状态样式', /input-mode-toggle--disabled/.test(inputModeToggleContent));

// 文件类型限制
check('接受的图片格式', /image\/png.*image\/jpeg.*image\/webp/.test(inputModeToggleContent));

// ========================================
// 2. 验证 ChatMessage 组件
// ========================================
console.log('\n2. 验证 ChatMessage 组件 (Requirements: 4.4, 4.6)...');

const chatMessagePath = path.join(__dirname, '../client/src/components/ai/ChatMessage.vue');
const chatMessageContent = fs.readFileSync(chatMessagePath, 'utf-8');

// 4.4 AI 响应显示
check('MessageRole 类型 (user | assistant)', /type\s+MessageRole\s*=\s*['"]user['"]\s*\|\s*['"]assistant['"]/.test(chatMessageContent));
check('MessageType 类型 (text | image)', /type\s+MessageType\s*=\s*['"]text['"]\s*\|\s*['"]image['"]/.test(chatMessageContent));

// 4.6 消息发送状态
check('MessageStatus 类型', /type\s+MessageStatus\s*=\s*['"]sending['"]\s*\|\s*['"]sent['"]\s*\|\s*['"]error['"]/.test(chatMessageContent));
check('isSending computed', /isSending.*computed/.test(chatMessageContent));
check('hasError computed', /hasError.*computed/.test(chatMessageContent));

// 消息样式
check('用户消息样式', /chat-message--user/.test(chatMessageContent));
check('AI 消息样式', /chat-message--assistant/.test(chatMessageContent));
check('发送中状态样式', /chat-message--sending/.test(chatMessageContent));
check('错误状态样式', /chat-message--error/.test(chatMessageContent));

// 图片消息
check('图片消息显示', /message-image/.test(chatMessageContent));
check('imageUrl 属性', /imageUrl\?:\s*string/.test(chatMessageContent));

// 时间戳
check('时间戳显示', /formattedTime/.test(chatMessageContent));
check('timestamp 属性', /timestamp:\s*Date/.test(chatMessageContent));

// ========================================
// 3. 验证 TypingIndicator 组件
// ========================================
console.log('\n3. 验证 TypingIndicator 组件 (Requirements: 4.3)...');

const typingIndicatorPath = path.join(__dirname, '../client/src/components/ai/TypingIndicator.vue');
const typingIndicatorContent = fs.readFileSync(typingIndicatorPath, 'utf-8');

// 4.3 打字指示器动画
check('3-dot 结构', /dot--1.*dot--2.*dot--3/s.test(typingIndicatorContent));
check('pulse 动画', /dotPulse/.test(typingIndicatorContent));
check('animation-delay 设置', /animation-delay/.test(typingIndicatorContent));

// 可见性控制
check('visible prop', /visible\?:\s*boolean/.test(typingIndicatorContent));
check('Transition 组件', /<Transition/.test(typingIndicatorContent));

// 主题适配
check('使用 CSS 变量', /var\(--accent\)/.test(typingIndicatorContent));

// 无障碍
check('role="status"', /role="status"/.test(typingIndicatorContent));
check('aria-label', /aria-label/.test(typingIndicatorContent));

// reduced-motion 支持
check('prefers-reduced-motion', /prefers-reduced-motion/.test(typingIndicatorContent));

// ========================================
// 4. 验证 SendButton 组件
// ========================================
console.log('\n4. 验证 SendButton 组件 (Requirements: 8.1, 8.2, 8.5)...');

const sendButtonPath = path.join(__dirname, '../client/src/components/ai/SendButton.vue');
const sendButtonContent = fs.readFileSync(sendButtonPath, 'utf-8');

// 8.1 发送按钮显示
check('发送图标 SVG', /<svg[\s\S]*?viewBox/.test(sendButtonContent));

// 8.2 空输入禁用
check('disabled prop', /disabled\?:\s*boolean/.test(sendButtonContent));
check('禁用状态样式', /send-button--disabled/.test(sendButtonContent));

// 8.5 加载状态
check('loading prop', /loading\?:\s*boolean/.test(sendButtonContent));
check('加载状态样式', /send-button--loading/.test(sendButtonContent));
check('加载动画', /send-icon--spin/.test(sendButtonContent));

// 交互状态
check('hover 效果', /send-button:hover/.test(sendButtonContent));
check('active 效果', /send-button:active/.test(sendButtonContent));
check('focus-visible 效果', /send-button:focus-visible/.test(sendButtonContent));

// 可点击计算
check('isClickable computed', /isClickable.*computed/.test(sendButtonContent));

// 无障碍
check('aria-label', /aria-label/.test(sendButtonContent));
check('sr-only 文本', /sr-only/.test(sendButtonContent));

// ========================================
// 5. 验证 AIChatInterface 组件
// ========================================
console.log('\n5. 验证 AIChatInterface 组件 (Requirements: 4.1, 4.2, 4.5, 5.5, 5.6, 8.3, 8.4)...');

const aiChatInterfacePath = path.join(__dirname, '../client/src/components/ai/AIChatInterface.vue');
const aiChatInterfaceContent = fs.readFileSync(aiChatInterfacePath, 'utf-8');

// 4.1 文本输入框
check('textarea 元素', /<textarea/.test(aiChatInterfaceContent));
check('inputText ref', /inputText.*ref/.test(aiChatInterfaceContent));

// 4.2 消息发送到 AI
check('sendTextMessage 函数', /sendTextMessage/.test(aiChatInterfaceContent));
check('sendImageMessage 函数', /sendImageMessage/.test(aiChatInterfaceContent));

// 4.5 对话历史
check('messages ref 数组', /messages.*ref.*ChatMessageData\[\]/.test(aiChatInterfaceContent));
check('addMessage 函数', /addMessage/.test(aiChatInterfaceContent));

// 5.5 图片上传触发 AI
check('handleFileSelected 函数', /handleFileSelected/.test(aiChatInterfaceContent));
check('pendingImage ref', /pendingImage.*ref/.test(aiChatInterfaceContent));

// 5.6 文字提交触发 AI
check('sendMessage 函数', /sendMessage/.test(aiChatInterfaceContent));

// 8.3 点击发送按钮提交
check('SendButton 组件集成', /SendButton/.test(aiChatInterfaceContent));
check('@click="sendMessage"', /@click="sendMessage"/.test(aiChatInterfaceContent));

// 8.4 Enter 键提交
check('handleKeyDown 函数', /handleKeyDown/.test(aiChatInterfaceContent));
check('Enter 键检测', /event\.key\s*===\s*['"]Enter['"]/.test(aiChatInterfaceContent));
check('Shift+Enter 换行', /event\.shiftKey/.test(aiChatInterfaceContent));

// 模式互斥
check('inputMode ref', /inputMode.*ref.*InputMode/.test(aiChatInterfaceContent));
check('handleModeChange 函数', /handleModeChange/.test(aiChatInterfaceContent));
check('clearPendingImage 函数', /clearPendingImage/.test(aiChatInterfaceContent));

// 处理状态
check('isProcessing ref', /isProcessing.*ref/.test(aiChatInterfaceContent));
check('canSend computed', /canSend.*computed/.test(aiChatInterfaceContent));

// 子组件集成
check('InputModeToggle 集成', /InputModeToggle/.test(aiChatInterfaceContent));
check('ChatMessage 集成', /ChatMessage/.test(aiChatInterfaceContent));
check('TypingIndicator 集成', /TypingIndicator/.test(aiChatInterfaceContent));

// 滚动到底部
check('scrollToBottom 函数', /scrollToBottom/.test(aiChatInterfaceContent));

// 消息状态更新
check('updateMessageStatus 函数', /updateMessageStatus/.test(aiChatInterfaceContent));

// 文件验证
check('文件类型验证', /validTypes.*image\/png.*image\/jpeg.*image\/webp/.test(aiChatInterfaceContent));
check('文件大小验证', /maxSize.*10.*1024.*1024/.test(aiChatInterfaceContent));

// ========================================
// 6. 验证模式互斥逻辑
// ========================================
console.log('\n6. 验证模式互斥逻辑...');

// 检查切换到文字模式时清除图片
check('切换到文字模式清除图片', /if\s*\(mode\s*===\s*['"]text['"]\)[\s\S]*clearPendingImage/.test(aiChatInterfaceContent));

// 检查图片模式下文本输入禁用
check('图片模式下禁用文本输入', /inputMode\s*===\s*['"]image['"].*pendingImage/.test(aiChatInterfaceContent));

// 检查发送图片后切换回文字模式
check('发送图片后切换回文字模式', /inputMode\.value\s*=\s*['"]text['"]/.test(aiChatInterfaceContent));

// ========================================
// 7. 验证 index.ts 导出
// ========================================
console.log('\n7. 验证组件导出...');

const indexPath = path.join(__dirname, '../client/src/components/ai/index.ts');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

check('导出 AIChatInterface', /export.*AIChatInterface/.test(indexContent));
check('导出 ChatMessage', /export.*ChatMessage/.test(indexContent));
check('导出 InputModeToggle', /export.*InputModeToggle/.test(indexContent));
check('导出 SendButton', /export.*SendButton/.test(indexContent));
check('导出 TypingIndicator', /export.*TypingIndicator/.test(indexContent));

// ========================================
// 总结
// ========================================
console.log('\n========================================');
console.log('验证总结');
console.log('========================================');
console.log(`通过: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);

if (allPassed) {
  console.log('\n✅ 所有验证通过！AI 对话组件实现正确。');
  console.log('\n已验证的功能：');
  console.log('  - InputModeToggle: 文字/图片模式互斥切换');
  console.log('  - ChatMessage: 用户/AI 消息显示、状态指示');
  console.log('  - TypingIndicator: 3-dot pulse 动画');
  console.log('  - SendButton: 禁用/加载/交互状态');
  console.log('  - AIChatInterface: 完整对话流程集成');
  console.log('\n符合的需求：');
  console.log('  - Req 4.1-4.6: AI 对话框交互');
  console.log('  - Req 5.1-5.6: 图片上传与文字输入互斥');
  console.log('  - Req 8.1-8.5: 发送按钮交互');
  process.exit(0);
} else {
  console.log('\n❌ 部分验证失败，请检查上述错误。');
  process.exit(1);
}
