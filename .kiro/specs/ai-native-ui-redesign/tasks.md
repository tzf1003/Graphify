# Implementation Plan: AI-Native UI Redesign

## Overview

本实现计划将前端界面重构为 AI-Native 风格，采用增量开发方式，从基础设施（主题系统、国际化）开始，逐步构建核心组件（粒子背景、毛玻璃卡片、AI 对话界面），最后整合到主视图中。

## Tasks

- [x] 1. 基础设施搭建
  - [x] 1.1 创建主题系统 composable (useTheme.ts)
    - 实现 light/dark/system 三种模式
    - 实现系统主题检测 (prefers-color-scheme)
    - 实现 localStorage 持久化
    - 定义 CSS Variables
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [ ]* 1.2 编写主题系统属性测试
    - **Property 1: Theme State Consistency**
    - **Validates: Requirements 3.2, 3.3, 3.4**
  - [x] 1.3 创建国际化系统 (useI18n.ts + locales)
    - 创建 zh-CN.ts 和 en.ts 语言文件
    - 实现语言切换 composable
    - 实现浏览器语言检测
    - 实现 localStorage 持久化
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  - [ ]* 1.4 编写语言切换属性测试
    - **Property 3: Language Switch Consistency**
    - **Validates: Requirements 6.2, 6.3**

- [x] 2. Checkpoint - 基础设施验证
  - 确保主题切换和语言切换功能正常
  - 确保所有测试通过，如有问题请询问用户

- [x] 3. 基础 UI 组件
  - [x] 3.1 创建 GlassCard 组件
    - 实现毛玻璃效果样式
    - 支持 variant/padding/rounded props
    - 实现主题适配 (light/dark 不同透明度)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - [ ]* 3.2 编写毛玻璃对比度属性测试
    - **Property 10: Glassmorphism Contrast Ratio**
    - **Validates: Requirements 1.4**
  - [x] 3.3 创建 GlassNavbar 组件
    - 实现毛玻璃导航栏
    - 集成主题切换按钮 (太阳/月亮图标)
    - 集成语言切换下拉菜单
    - 实现浮动效果 (top-4 spacing)
    - _Requirements: 3.3, 6.1_
  - [x] 3.4 创建 ParticleBackground 组件
    - 实现 Canvas 粒子渲染
    - 实现粒子移动动画
    - 实现粒子连线效果
    - 实现主题颜色适配
    - 实现 prefers-reduced-motion 支持
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [ ]* 3.5 编写粒子颜色主题适配属性测试
    - **Property 8: Particle Color Theme Adaptation**
    - **Validates: Requirements 2.2**

- [x] 4. Checkpoint - 基础组件验证
  - 确保毛玻璃效果在 light/dark 模式下正常显示
  - 确保粒子动画流畅运行
  - 确保所有测试通过，如有问题请询问用户

- [x] 5. AI 对话核心组件
  - [x] 5.1 创建 InputModeToggle 组件
    - 实现文字/图片模式切换
    - 实现模式互斥逻辑
    - 实现视觉状态指示
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [ ]* 5.2 编写输入模式互斥属性测试
    - **Property 2: Input Mode Mutual Exclusion**
    - **Validates: Requirements 5.2, 5.3**
  - [x] 5.3 创建 ChatMessage 组件
    - 实现用户消息样式
    - 实现 AI 消息样式
    - 实现图片消息展示
    - 实现发送状态指示
    - _Requirements: 4.4, 4.6_
  - [x] 5.4 创建 TypingIndicator 组件
    - 实现 3-dot pulse 动画
    - 实现主题适配
    - _Requirements: 4.3_
  - [x] 5.5 创建 SendButton 组件
    - 实现禁用状态 (空输入)
    - 实现加载状态 (处理中)
    - 实现 hover/focus 状态
    - _Requirements: 8.1, 8.2, 8.5_
  - [ ]* 5.6 编写发送按钮状态机属性测试
    - **Property 4: Send Button State Machine**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.5**
  - [x] 5.7 创建 AIChatInterface 组件
    - 集成 InputModeToggle
    - 集成 ChatMessage 列表
    - 集成 TypingIndicator
    - 集成 SendButton
    - 实现消息发送逻辑
    - 实现 Enter 键提交
    - 实现对话历史管理
    - _Requirements: 4.1, 4.2, 4.5, 5.5, 5.6, 8.3, 8.4_
  - [ ]* 5.8 编写对话历史保留属性测试
    - **Property 5: Chat History Preservation**
    - **Validates: Requirements 4.5**

- [x] 6. Checkpoint - AI 对话组件验证
  - 确保文字输入和图片上传模式正确互斥
  - 确保消息发送和显示正常
  - 确保所有测试通过，如有问题请询问用户

- [x] 7. 引导提示组件
  - [x] 7.1 创建 OnboardingHints 组件
    - 实现上下文提示逻辑
    - 实现提示卡片样式
    - 实现关闭/隐藏功能
    - 实现 session 级别持久化
    - 实现语言适配
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [ ]* 7.2 编写提示关闭持久化属性测试
    - **Property 6: Hint Dismissal Persistence**
    - **Validates: Requirements 7.4**
  - [ ]* 7.3 编写上下文提示适配属性测试
    - **Property 7: Contextual Hints Adaptation**
    - **Validates: Requirements 7.1, 7.5**

- [x] 8. 主视图整合
  - [x] 8.1 重构 App.vue
    - 集成 ParticleBackground
    - 集成 GlassNavbar
    - 更新全局样式
    - _Requirements: 1.1, 2.1, 3.1_
  - [x] 8.2 重构 HomeView.vue
    - 集成 AIChatInterface
    - 集成 OnboardingHints
    - 重构 ProjectList 为毛玻璃风格
    - 实现响应式布局
    - _Requirements: 4.1, 7.1, 9.1, 9.3_
  - [ ]* 8.3 编写响应式布局属性测试
    - **Property 9: Responsive Layout Breakpoints**
    - **Validates: Requirements 9.1, 9.4**

- [x] 9. 样式优化与收尾
  - [x] 9.1 创建全局 CSS Variables 文件
    - 定义完整的颜色系统
    - 定义间距和圆角变量
    - 定义过渡动画变量
    - _Requirements: 1.1, 1.2, 1.3, 3.5_
  - [x] 9.2 添加 Google Fonts 引入
    - 引入 Inter 字体
    - 引入 DM Sans 字体
    - 配置字体回退
  - [x] 9.3 优化移动端体验
    - 调整触摸目标大小
    - 优化输入框体验
    - 测试各断点布局
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 10. Final Checkpoint - 全面验证
  - 确保所有功能正常工作
  - 确保 light/dark 模式切换正常
  - 确保中英文切换正常
  - 确保响应式布局正常
  - 确保所有测试通过，如有问题请询问用户

## Notes

- 任务标记 `*` 为可选的属性测试任务，可跳过以加快 MVP 开发
- 每个 Checkpoint 用于验证阶段性成果
- 属性测试使用 fast-check 库，每个测试运行 100 次迭代
- 所有组件使用 Vue 3 Composition API + TypeScript
