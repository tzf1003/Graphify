# Design Document: AI-Native UI Redesign

## Overview

本设计文档描述了前端界面重构的技术架构和实现方案。新界面采用 Vue 3 Composition API + TypeScript 技术栈，实现 Glassmorphism 风格的 AI-Native 交互界面。核心特性包括动态粒子背景、主题自适应、AI 对话交互、图片上传/文字输入互斥模式、多语言支持和创意引导提示。

### 设计原则

- **AI-Native**: 以 AI 对话为核心交互方式，简化用户操作流程
- **Glassmorphism**: 毛玻璃效果营造高级感和层次感
- **Performance First**: 动画效果需考虑性能，支持 reduced-motion
- **Accessibility**: 确保 4.5:1 对比度，支持键盘导航

### 技术选型

- **框架**: Vue 3 + Composition API + TypeScript
- **状态管理**: Pinia
- **样式**: CSS Variables + Scoped CSS
- **粒子效果**: Canvas API (自定义实现，轻量级)
- **国际化**: vue-i18n
- **字体**: Inter (正文) + DM Sans (标题)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.vue                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   ParticleBackground                        ││
│  │  (Canvas 粒子动画层 - 固定定位，z-index: 0)                  ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    MainLayout                               ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │  GlassNavbar (主题切换 + 语言切换)                   │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  │  ┌─────────────────────────────────────────────────────┐   ││
│  │  │  RouterView (HomeView / ProjectView)                │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘

HomeView (首页 - AI 对话入口)
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  OnboardingHints (创意引导提示)                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  AIChatInterface                                        │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  ChatHistory (对话历史)                          │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  InputArea                                       │   │   │
│  │  │  [ImageUploadBtn] [TextInput] [SendBtn]         │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ProjectList (项目列表 - 可折叠)                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. ParticleBackground 组件

```typescript
// components/effects/ParticleBackground.vue
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

interface ParticleBackgroundProps {
  particleCount?: number;      // 默认 50
  particleColor?: string;      // 从主题获取
  connectionDistance?: number; // 粒子连线距离，默认 150
  speed?: number;              // 移动速度，默认 0.5
}

// 核心逻辑
// - 使用 Canvas 2D API 渲染
// - requestAnimationFrame 驱动动画
// - 监听 prefers-reduced-motion 媒体查询
// - 响应主题变化更新粒子颜色
```

### 2. ThemeProvider 组合式函数

```typescript
// composables/useTheme.ts
interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  resolvedMode: 'light' | 'dark';
}

interface UseThemeReturn {
  mode: Ref<ThemeState['mode']>;
  resolvedMode: ComputedRef<'light' | 'dark'>;
  isDark: ComputedRef<boolean>;
  toggleTheme: () => void;
  setTheme: (mode: ThemeState['mode']) => void;
}

// CSS Variables 定义
:root {
  /* Light Mode */
  --bg-primary: #F8FAFC;
  --bg-glass: rgba(255, 255, 255, 0.8);
  --bg-glass-hover: rgba(255, 255, 255, 0.9);
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --border-glass: rgba(255, 255, 255, 0.3);
  --particle-color: rgba(59, 130, 246, 0.3);
  --accent: #3B82F6;
  --accent-hover: #2563EB;
}

:root.dark {
  /* Dark Mode */
  --bg-primary: #0F172A;
  --bg-glass: rgba(30, 41, 59, 0.8);
  --bg-glass-hover: rgba(30, 41, 59, 0.9);
  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --border-glass: rgba(255, 255, 255, 0.1);
  --particle-color: rgba(99, 102, 241, 0.4);
  --accent: #6366F1;
  --accent-hover: #4F46E5;
}
```

### 3. GlassNavbar 组件

```typescript
// components/common/GlassNavbar.vue
interface GlassNavbarProps {
  title?: string;
}

// 结构
// - Logo/标题区域
// - 主题切换按钮 (太阳/月亮图标)
// - 语言切换下拉菜单
// - 毛玻璃效果样式
```

### 4. AIChatInterface 组件

```typescript
// components/ai/AIChatInterface.vue
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'image';
  imageUrl?: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
}

interface AIChatInterfaceProps {
  projectId?: string;
}

interface AIChatInterfaceEmits {
  (e: 'image-generated', imageUrl: string, jsonData: object): void;
  (e: 'image-uploaded', imageUrl: string): void;
}

// 状态管理
interface ChatState {
  messages: ChatMessage[];
  inputMode: 'text' | 'image';
  inputText: string;
  pendingImage: File | null;
  isProcessing: boolean;
}
```

### 5. InputModeToggle 组件

```typescript
// components/ai/InputModeToggle.vue
interface InputModeToggleProps {
  mode: 'text' | 'image';
  disabled?: boolean;
}

interface InputModeToggleEmits {
  (e: 'update:mode', mode: 'text' | 'image'): void;
  (e: 'file-selected', file: File): void;
}

// 视觉设计
// - 文字模式: 显示文本输入框，图片按钮为次要样式
// - 图片模式: 显示图片预览区域，文本输入隐藏
// - 切换时有平滑过渡动画
```

### 6. OnboardingHints 组件

```typescript
// components/ai/OnboardingHints.vue
interface Hint {
  id: string;
  titleKey: string;      // i18n key
  descriptionKey: string; // i18n key
  icon: string;
  action?: () => void;
}

interface OnboardingHintsProps {
  context: 'empty' | 'has-project' | 'generating';
}

// 提示内容示例
const hints: Record<string, Hint[]> = {
  empty: [
    { id: 'upload', titleKey: 'hints.upload.title', descriptionKey: 'hints.upload.desc', icon: 'upload' },
    { id: 'describe', titleKey: 'hints.describe.title', descriptionKey: 'hints.describe.desc', icon: 'sparkles' }
  ],
  'has-project': [
    { id: 'edit', titleKey: 'hints.edit.title', descriptionKey: 'hints.edit.desc', icon: 'edit' },
    { id: 'regenerate', titleKey: 'hints.regenerate.title', descriptionKey: 'hints.regenerate.desc', icon: 'refresh' }
  ]
};
```

### 7. LanguageSwitcher 组件

```typescript
// components/common/LanguageSwitcher.vue
interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const supportedLanguages: Language[] = [
  { code: 'zh-CN', name: 'Chinese', nativeName: '简体中文' },
  { code: 'en', name: 'English', nativeName: 'English' }
];

// composables/useI18n.ts
interface UseI18nReturn {
  locale: Ref<string>;
  t: (key: string, params?: Record<string, string>) => string;
  setLocale: (locale: string) => void;
  availableLocales: Language[];
}
```

### 8. GlassCard 组件

```typescript
// components/common/GlassCard.vue
interface GlassCardProps {
  variant?: 'default' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
}

// 样式实现
.glass-card {
  background: var(--bg-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius);
  transition: all 0.2s ease-out;
}

.glass-card--interactive:hover {
  background: var(--bg-glass-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

## Data Models

### 国际化文本结构

```typescript
// locales/zh-CN.ts
export default {
  common: {
    send: '发送',
    cancel: '取消',
    upload: '上传',
    loading: '加载中...',
    error: '出错了'
  },
  chat: {
    placeholder: '描述你想要生成的图片...',
    uploadHint: '或上传一张图片开始',
    generating: 'AI 正在生成图片...',
    analyzing: 'AI 正在分析图片...'
  },
  hints: {
    upload: {
      title: '上传图片',
      desc: '上传一张设计图，AI 将自动解析为可编辑的 JSON 结构'
    },
    describe: {
      title: '描述创意',
      desc: '用文字描述你想要的界面，AI 将为你生成设计'
    },
    edit: {
      title: '编辑 JSON',
      desc: '直接编辑 JSON 结构来调整设计细节'
    },
    regenerate: {
      title: '重新生成',
      desc: '不满意？让 AI 重新生成一个版本'
    }
  },
  theme: {
    light: '浅色模式',
    dark: '暗色模式',
    system: '跟随系统'
  },
  language: {
    title: '语言'
  }
};

// locales/en.ts
export default {
  common: {
    send: 'Send',
    cancel: 'Cancel',
    upload: 'Upload',
    loading: 'Loading...',
    error: 'Something went wrong'
  },
  chat: {
    placeholder: 'Describe the image you want to generate...',
    uploadHint: 'Or upload an image to start',
    generating: 'AI is generating your image...',
    analyzing: 'AI is analyzing the image...'
  },
  // ... 其他翻译
};
```

### 主题配置

```typescript
// types/theme.ts
interface ThemeConfig {
  colors: {
    bgPrimary: string;
    bgGlass: string;
    bgGlassHover: string;
    textPrimary: string;
    textSecondary: string;
    borderGlass: string;
    particleColor: string;
    accent: string;
    accentHover: string;
  };
  blur: {
    glass: string;  // '16px'
  };
  transition: {
    fast: string;   // '150ms'
    normal: string; // '200ms'
    slow: string;   // '300ms'
  };
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

经过分析，以下属性可以合并或简化：
- 主题相关的属性 (3.2, 3.3, 3.4) 可以合并为主题状态一致性属性
- 输入模式相关的属性 (5.2, 5.3) 可以合并为模式互斥属性
- 语言相关的属性 (6.2, 6.3) 可以合并为语言切换一致性属性
- 发送按钮相关的属性 (8.2, 8.3, 8.4, 8.5) 可以合并为发送按钮状态属性

### Properties

**Property 1: Theme State Consistency**

*For any* theme mode setting (light, dark, system), the resolved theme SHALL be correctly determined and persisted, and all theme-dependent CSS variables SHALL update accordingly.

**Validates: Requirements 3.2, 3.3, 3.4**

---

**Property 2: Input Mode Mutual Exclusion**

*For any* input mode state, when mode is 'text' the text input SHALL be enabled and image upload inactive, and when mode is 'image' the text input SHALL be disabled and image upload active. Switching between modes SHALL always result in a valid exclusive state.

**Validates: Requirements 5.2, 5.3**

---

**Property 3: Language Switch Consistency**

*For any* language selection, all translatable text elements SHALL update to the selected language, and the preference SHALL be persisted to localStorage.

**Validates: Requirements 6.2, 6.3**

---

**Property 4: Send Button State Machine**

*For any* combination of input content and processing state:
- Empty input → button disabled
- Non-empty input + not processing → button enabled
- Processing → button disabled with loading state
- Enter key press with valid input → triggers submission

**Validates: Requirements 8.2, 8.3, 8.4, 8.5**

---

**Property 5: Chat History Preservation**

*For any* sequence of messages sent in a session, all messages SHALL be preserved in the conversation history in chronological order.

**Validates: Requirements 4.5**

---

**Property 6: Hint Dismissal Persistence**

*For any* hint that is dismissed by the user, that hint SHALL not reappear during the current session.

**Validates: Requirements 7.4**

---

**Property 7: Contextual Hints Adaptation**

*For any* project state (empty, has-project, generating), the displayed hints SHALL match the expected hints for that state.

**Validates: Requirements 7.1, 7.5**

---

**Property 8: Particle Color Theme Adaptation**

*For any* theme change, the particle background color SHALL update to match the theme's particle color configuration.

**Validates: Requirements 2.2**

---

**Property 9: Responsive Layout Breakpoints**

*For any* viewport width, the layout SHALL not produce horizontal overflow, and components SHALL stack vertically when width is below 768px.

**Validates: Requirements 9.1, 9.4**

---

**Property 10: Glassmorphism Contrast Ratio**

*For any* theme mode, the text displayed on Glassmorphism cards SHALL maintain a minimum contrast ratio of 4.5:1 against the background.

**Validates: Requirements 1.4**

## Error Handling

### 网络错误处理

```typescript
// composables/useApiError.ts
interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
}

const errorMessages: Record<string, Record<string, string>> = {
  'zh-CN': {
    NETWORK_ERROR: '网络连接失败，请检查网络后重试',
    TIMEOUT: '请求超时，请稍后重试',
    SERVER_ERROR: '服务器错误，请稍后重试',
    INVALID_IMAGE: '图片格式不支持，请上传 PNG、JPG 或 WebP 格式',
    FILE_TOO_LARGE: '文件过大，请上传小于 10MB 的图片',
    GENERATION_FAILED: 'AI 生成失败，请重试或修改描述'
  },
  'en': {
    NETWORK_ERROR: 'Network connection failed, please check and retry',
    TIMEOUT: 'Request timeout, please try again later',
    SERVER_ERROR: 'Server error, please try again later',
    INVALID_IMAGE: 'Image format not supported, please upload PNG, JPG or WebP',
    FILE_TOO_LARGE: 'File too large, please upload an image under 10MB',
    GENERATION_FAILED: 'AI generation failed, please retry or modify your description'
  }
};
```

### 输入验证

```typescript
// utils/validation.ts
interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateImageFile(file: File): ValidationResult {
  const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'INVALID_IMAGE' };
  }
  if (file.size > maxSize) {
    return { valid: false, error: 'FILE_TOO_LARGE' };
  }
  return { valid: true };
}

function validateTextInput(text: string): ValidationResult {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'EMPTY_INPUT' };
  }
  if (trimmed.length > 1000) {
    return { valid: false, error: 'INPUT_TOO_LONG' };
  }
  return { valid: true };
}
```

### 错误边界

```typescript
// components/common/ErrorBoundary.vue
// 使用 Vue 的 onErrorCaptured 钩子捕获子组件错误
// 显示友好的错误提示界面
// 提供重试按钮
```

## Testing Strategy

### 测试框架选择

- **单元测试**: Vitest
- **组件测试**: Vue Test Utils + Vitest
- **属性测试**: fast-check
- **E2E 测试**: Playwright (可选)

### 单元测试覆盖

1. **Composables 测试**
   - `useTheme`: 主题切换、持久化、系统主题检测
   - `useI18n`: 语言切换、翻译函数、持久化
   - `useChat`: 消息管理、状态机

2. **工具函数测试**
   - `validation.ts`: 输入验证函数
   - `contrast.ts`: 对比度计算函数

### 属性测试配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    include: ['**/*.{test,spec,property}.{js,ts}'],
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
});

// 属性测试示例
// tests/properties/theme.property.ts
import { fc } from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Theme System Properties', () => {
  // Feature: ai-native-ui-redesign, Property 1: Theme State Consistency
  it('should maintain theme state consistency for any mode', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark', 'system'),
        (mode) => {
          // 设置主题
          setTheme(mode);
          // 验证 resolved mode 正确
          const resolved = getResolvedMode();
          expect(['light', 'dark']).toContain(resolved);
          // 验证 localStorage 持久化
          expect(localStorage.getItem('theme')).toBe(mode);
          // 验证 CSS 变量更新
          const bgColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--bg-primary');
          expect(bgColor).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 测试文件结构

```
test/
├── unit/
│   ├── composables/
│   │   ├── useTheme.test.ts
│   │   ├── useI18n.test.ts
│   │   └── useChat.test.ts
│   └── utils/
│       ├── validation.test.ts
│       └── contrast.test.ts
├── properties/
│   ├── theme.property.ts
│   ├── inputMode.property.ts
│   ├── language.property.ts
│   ├── sendButton.property.ts
│   ├── chatHistory.property.ts
│   ├── hints.property.ts
│   ├── particles.property.ts
│   ├── responsive.property.ts
│   └── glassmorphism.property.ts
└── components/
    ├── GlassCard.test.ts
    ├── AIChatInterface.test.ts
    └── OnboardingHints.test.ts
```
