import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'theme-mode';

// 全局状态 - 单例模式
const mode = ref<ThemeMode>('system');
const systemPreference = ref<ResolvedTheme>('light');
let mediaQuery: MediaQueryList | null = null;
let initialized = false;

/**
 * 检测系统主题偏好
 */
function detectSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 从 localStorage 读取主题设置
 */
function loadStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

/**
 * 保存主题设置到 localStorage
 */
function saveTheme(themeMode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, themeMode);
}

/**
 * 应用主题到 DOM
 */
function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  
  // 移除旧的主题类
  root.classList.remove('light', 'dark');
  // 添加新的主题类
  root.classList.add(resolved);
  
  // 设置 color-scheme 以支持原生表单元素
  root.style.colorScheme = resolved;
}

/**
 * 主题系统 composable
 * 实现 light/dark/system 三种模式，支持系统主题检测和 localStorage 持久化
 */
export function useTheme() {
  // 计算解析后的主题
  const resolvedMode = computed<ResolvedTheme>(() => {
    if (mode.value === 'system') {
      return systemPreference.value;
    }
    return mode.value;
  });

  // 是否为暗色模式
  const isDark = computed(() => resolvedMode.value === 'dark');

  // 系统主题变化处理器
  const handleSystemThemeChange = (e: MediaQueryListEvent) => {
    systemPreference.value = e.matches ? 'dark' : 'light';
  };

  // 初始化
  const initialize = () => {
    if (initialized) return;
    
    // 检测系统主题
    systemPreference.value = detectSystemTheme();
    
    // 加载存储的主题设置
    mode.value = loadStoredTheme();
    
    // 监听系统主题变化
    if (typeof window !== 'undefined') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    }
    
    // 应用初始主题
    applyTheme(resolvedMode.value);
    
    initialized = true;
  };

  // 设置主题
  const setTheme = (newMode: ThemeMode) => {
    mode.value = newMode;
    saveTheme(newMode);
  };

  // 切换主题 (light -> dark -> system -> light)
  const toggleTheme = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(mode.value);
    const nextIndex = (currentIndex + 1) % modes.length;
    setTheme(modes[nextIndex]);
  };

  // 在 light 和 dark 之间快速切换
  const toggleDark = () => {
    setTheme(isDark.value ? 'light' : 'dark');
  };

  // 监听 resolvedMode 变化，应用主题
  watch(resolvedMode, (newResolved) => {
    applyTheme(newResolved);
  });

  // 组件挂载时初始化
  onMounted(() => {
    initialize();
  });

  // 组件卸载时清理（仅在最后一个使用者卸载时）
  onUnmounted(() => {
    // 保持监听器，因为主题是全局状态
  });

  return {
    mode,
    resolvedMode,
    isDark,
    setTheme,
    toggleTheme,
    toggleDark,
    initialize
  };
}

export default useTheme;
