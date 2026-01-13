import { ref, computed, onMounted } from 'vue';
import { messages, supportedLanguages, type LocaleCode, type LocaleMessages, type Language } from '../locales';

const STORAGE_KEY = 'locale';

// 全局状态 - 单例模式
const locale = ref<LocaleCode>('zh-CN');
let initialized = false;

/**
 * 检测浏览器语言偏好
 */
function detectBrowserLanguage(): LocaleCode {
  if (typeof navigator === 'undefined') return 'zh-CN';
  
  const browserLang = navigator.language || (navigator as any).userLanguage;
  
  // 精确匹配
  if (browserLang === 'zh-CN' || browserLang === 'zh') {
    return 'zh-CN';
  }
  if (browserLang.startsWith('en')) {
    return 'en';
  }
  
  // 检查是否为中文变体
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  
  // 默认返回英文
  return 'en';
}

/**
 * 从 localStorage 读取语言设置
 */
function loadStoredLocale(): LocaleCode | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'zh-CN' || stored === 'en') {
    return stored;
  }
  return null;
}

/**
 * 保存语言设置到 localStorage
 */
function saveLocale(localeCode: LocaleCode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, localeCode);
}

/**
 * 更新 HTML lang 属性
 */
function updateHtmlLang(localeCode: LocaleCode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = localeCode;
}

/**
 * 获取嵌套对象的值
 * @param obj 对象
 * @param path 路径，如 'common.send'
 */
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }
  
  return typeof result === 'string' ? result : undefined;
}

/**
 * 国际化系统 composable
 * 支持中英文切换、浏览器语言检测和 localStorage 持久化
 */
export function useI18n() {
  // 当前语言的消息
  const currentMessages = computed<LocaleMessages>(() => {
    return messages[locale.value];
  });

  // 翻译函数
  const t = (key: string, params?: Record<string, string>): string => {
    let text = getNestedValue(currentMessages.value, key);
    
    if (text === undefined) {
      // 如果找不到翻译，返回 key
      console.warn(`[i18n] Missing translation for key: ${key}`);
      return key;
    }
    
    // 替换参数
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), value);
      });
    }
    
    return text;
  };

  // 设置语言
  const setLocale = (newLocale: LocaleCode) => {
    if (!supportedLanguages.some(lang => lang.code === newLocale)) {
      console.warn(`[i18n] Unsupported locale: ${newLocale}`);
      return;
    }
    locale.value = newLocale;
    saveLocale(newLocale);
    updateHtmlLang(newLocale);
  };

  // 切换语言（在支持的语言之间循环）
  const toggleLocale = () => {
    const currentIndex = supportedLanguages.findIndex(lang => lang.code === locale.value);
    const nextIndex = (currentIndex + 1) % supportedLanguages.length;
    setLocale(supportedLanguages[nextIndex].code);
  };

  // 初始化
  const initialize = () => {
    if (initialized) return;
    
    // 优先使用存储的语言设置
    const storedLocale = loadStoredLocale();
    if (storedLocale) {
      locale.value = storedLocale;
    } else {
      // 否则检测浏览器语言
      locale.value = detectBrowserLanguage();
    }
    
    // 更新 HTML lang 属性
    updateHtmlLang(locale.value);
    
    initialized = true;
  };

  // 组件挂载时初始化
  onMounted(() => {
    initialize();
  });

  return {
    locale,
    t,
    setLocale,
    toggleLocale,
    availableLocales: supportedLanguages,
    messages: currentMessages,
    initialize
  };
}

export type { LocaleCode, LocaleMessages, Language };
export { supportedLanguages };
export default useI18n;
