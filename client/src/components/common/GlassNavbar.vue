<script setup lang="ts">
/**
 * GlassNavbar 组件
 * 毛玻璃效果导航栏，集成主题切换和语言切换功能
 * 使用SVG图标，禁止emoji
 * 
 * Requirements: 3.3, 6.1
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from '../../composables/useTheme';
import { useI18n } from '../../composables/useI18n';

export interface GlassNavbarProps {
  /** 标题 */
  title?: string;
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 是否显示菜单按钮 */
  showMenu?: boolean;
}

const props = withDefaults(defineProps<GlassNavbarProps>(), {
  title: 'Image Editor',
  showBack: false,
  showMenu: false
});

const emit = defineEmits<{
  (e: 'toggle-menu'): void;
}>();

const router = useRouter();
const { isDark, toggleDark } = useTheme();
const { locale, setLocale, availableLocales, t } = useI18n();

// 语言下拉菜单状态
const isLangMenuOpen = ref(false);

// 下拉菜单 DOM 引用
const langDropdownRef = ref<HTMLElement | null>(null);

// 当前语言显示名称
const currentLangName = computed(() => {
  const lang = availableLocales.find(l => l.code === locale.value);
  return lang?.nativeName || locale.value;
});

const themeTitle = computed(() => isDark.value ? t('theme.light') : t('theme.dark'));

const goHome = () => {
  router.push('/');
};

const goBack = () => {
  router.back();
};

const toggleLangMenu = () => {
  isLangMenuOpen.value = !isLangMenuOpen.value;
};

const selectLanguage = (code: string) => {
  setLocale(code as 'zh-CN' | 'en');
  isLangMenuOpen.value = false;
};

// 点击外部关闭下拉菜单
const closeLangMenu = () => {
  isLangMenuOpen.value = false;
};

// 处理点击外部事件
const handleClickOutside = (event: MouseEvent) => {
  if (langDropdownRef.value && !langDropdownRef.value.contains(event.target as Node)) {
    closeLangMenu();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <nav class="glass-navbar" @click.self="closeLangMenu">
    <div class="navbar-content">
      <!-- 左侧：菜单/返回 + Logo -->
      <div class="navbar-left">
        <!-- 菜单按钮 -->
        <button 
          v-if="showMenu" 
          class="nav-btn menu-btn" 
          @click="emit('toggle-menu')"
          :title="t('common.menu') || '菜单'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <!-- 返回按钮 -->
        <button 
          v-if="showBack" 
          class="nav-btn" 
          @click="goBack"
          :title="t('common.back') || '返回'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="logo-btn" @click="goHome" :title="t('common.home') || '首页'">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
            <path d="M21 15l-5-5L5 21" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="logo-text">{{ title }}</span>
        </button>
      </div>

      <!-- 中间：插槽 -->
      <div class="navbar-center">
        <slot name="center"></slot>
      </div>

      <!-- 右侧：主题切换 + 语言切换 -->
      <div class="navbar-right">
        <slot name="actions"></slot>
        
        <!-- 主题切换按钮 -->
        <button 
          class="nav-btn theme-btn" 
          @click="toggleDark"
          :title="themeTitle"
        >
          <!-- 太阳图标 (浅色模式) -->
          <svg v-if="!isDark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <!-- 月亮图标 (暗色模式) -->
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- 语言切换下拉菜单 -->
        <div ref="langDropdownRef" class="lang-dropdown">
          <button 
            class="nav-btn lang-btn" 
            @click="toggleLangMenu"
            :title="t('language.title') || '语言'"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="lang-text">{{ currentLangName }}</span>
            <svg class="dropdown-arrow" :class="{ open: isLangMenuOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          
          <Transition name="dropdown">
            <div v-if="isLangMenuOpen" class="lang-menu">
              <button
                v-for="lang in availableLocales"
                :key="lang.code"
                class="lang-option"
                :class="{ active: locale === lang.code }"
                @click="selectLanguage(lang.code)"
              >
                <span class="lang-native">{{ lang.nativeName }}</span>
                <span class="lang-name">{{ lang.name }}</span>
                <svg v-if="locale === lang.code" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* 毛玻璃导航栏 - 浮动效果 */
.glass-navbar {
  position: fixed;
  top: var(--spacing-md);
  left: var(--spacing-md);
  right: var(--spacing-md);
  z-index: 100;
  
  /* Glassmorphism 效果 */
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  
  transition: 
    background-color var(--transition-normal) ease-out,
    border-color var(--transition-normal) ease-out,
    box-shadow var(--transition-normal) ease-out;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 var(--spacing-md);
}

.navbar-left,
.navbar-center,
.navbar-right {
  display: flex;
  align-items: center;
}

.navbar-left {
  flex: 0 0 auto;
  gap: var(--spacing-sm);
}

.navbar-center {
  flex: 1;
  justify-content: center;
}

.navbar-right {
  flex: 0 0 auto;
  gap: var(--spacing-sm);
}

/* Logo 按钮 */
.logo-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast) ease-out;
}

.logo-btn:hover {
  background: var(--accent-light);
}

.logo-icon {
  width: 24px;
  height: 24px;
  color: var(--accent);
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 导航按钮通用样式 */
.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  min-width: 40px;
  height: 40px;
  padding: 0 var(--spacing-sm);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--text-primary);
  transition: 
    background-color var(--transition-fast) ease-out,
    transform var(--transition-fast) ease-out;
}

.nav-btn:hover {
  background: var(--accent-light);
}

.nav-btn:active {
  transform: scale(0.95);
}

.nav-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.nav-btn svg {
  width: 20px;
  height: 20px;
}

/* 主题切换按钮 */
.theme-btn svg {
  width: 20px;
  height: 20px;
}

/* 语言切换下拉菜单 */
.lang-dropdown {
  position: relative;
}

.lang-btn {
  padding: 0 var(--spacing-md);
}

.lang-text {
  font-size: 14px;
  font-weight: 500;
}

.dropdown-arrow {
  width: 16px;
  height: 16px;
  transition: transform var(--transition-fast) ease-out;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.lang-menu {
  position: absolute;
  top: calc(100% + var(--spacing-sm));
  right: 0;
  min-width: 160px;
  padding: var(--spacing-xs);
  
  /* Glassmorphism 效果 */
  background: var(--bg-glass);
  backdrop-filter: blur(var(--blur-glass));
  -webkit-backdrop-filter: blur(var(--blur-glass));
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.lang-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  text-align: left;
  color: var(--text-primary);
  transition: background-color var(--transition-fast) ease-out;
}

.lang-option:hover {
  background: var(--accent-light);
}

.lang-option.active {
  background: var(--accent-light);
}

.lang-native {
  font-weight: 500;
  flex: 1;
}

.lang-name {
  font-size: 12px;
  color: var(--text-secondary);
}

.check-icon {
  width: 16px;
  height: 16px;
  color: var(--accent);
}

/* 下拉菜单动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: 
    opacity var(--transition-fast) ease-out,
    transform var(--transition-fast) ease-out;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .glass-navbar {
    top: var(--spacing-sm);
    left: var(--spacing-sm);
    right: var(--spacing-sm);
  }
  
  .navbar-content {
    height: 48px;
    padding: 0 var(--spacing-sm);
  }
  
  .logo-text {
    display: none;
  }
  
  .lang-text {
    display: none;
  }
  
  /* Ensure touch targets are large enough */
  .nav-btn {
    min-width: var(--touch-target-min, 44px);
    min-height: var(--touch-target-min, 44px);
  }
  
  .logo-btn {
    min-height: var(--touch-target-min, 44px);
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .logo-icon {
    width: 20px;
    height: 20px;
  }
  
  /* Adjust dropdown for mobile */
  .lang-menu {
    min-width: 140px;
    right: -var(--spacing-sm);
  }
  
  .lang-option {
    min-height: var(--touch-target-min, 44px);
    padding: var(--spacing-sm) var(--spacing-md);
  }
}

/* Small mobile devices */
@media (max-width: 375px) {
  .glass-navbar {
    left: var(--spacing-xs);
    right: var(--spacing-xs);
  }
  
  .navbar-content {
    padding: 0 var(--spacing-xs);
  }
  
  .navbar-left,
  .navbar-right {
    gap: var(--spacing-xs);
  }
}
</style>
