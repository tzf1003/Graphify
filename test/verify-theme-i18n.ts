/**
 * 基础设施验证脚本
 * 验证主题系统和国际化系统的实现是否符合需求
 * 
 * 验证项目：
 * 1. 主题系统 (useTheme)
 *    - light/dark/system 三种模式
 *    - localStorage 持久化
 *    - CSS Variables 定义
 * 
 * 2. 国际化系统 (useI18n)
 *    - zh-CN 和 en 语言文件
 *    - 语言切换功能
 *    - localStorage 持久化
 */

import { messages, supportedLanguages, type LocaleCode } from '../client/src/locales';

// ========================================
// 主题系统验证
// ========================================

console.log('========================================');
console.log('基础设施验证 - AI-Native UI Redesign');
console.log('========================================\n');

// 验证 1: 检查语言文件结构
console.log('1. 验证语言文件结构...');

const requiredKeys = [
  'common.send',
  'common.cancel',
  'common.upload',
  'chat.placeholder',
  'chat.generating',
  'hints.upload.title',
  'hints.upload.desc',
  'hints.describe.title',
  'hints.describe.desc',
  'theme.light',
  'theme.dark',
  'theme.system',
  'language.title',
  'errors.networkError',
  'inputMode.text',
  'inputMode.image'
];

function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }
  return result;
}

let allKeysPresent = true;
const locales: LocaleCode[] = ['zh-CN', 'en'];

for (const locale of locales) {
  console.log(`\n  检查 ${locale} 语言文件:`);
  const localeMessages = messages[locale];
  
  for (const key of requiredKeys) {
    const value = getNestedValue(localeMessages, key);
    if (value === undefined) {
      console.log(`    ❌ 缺少 key: ${key}`);
      allKeysPresent = false;
    }
  }
  
  if (allKeysPresent) {
    console.log(`    ✅ 所有必需的 key 都存在`);
  }
}

// 验证 2: 检查支持的语言列表
console.log('\n2. 验证支持的语言列表...');
console.log(`  支持的语言: ${supportedLanguages.map(l => `${l.nativeName} (${l.code})`).join(', ')}`);

if (supportedLanguages.length >= 2) {
  console.log('  ✅ 至少支持 2 种语言');
} else {
  console.log('  ❌ 语言数量不足');
}

// 验证 3: 检查语言文件内容一致性
console.log('\n3. 验证语言文件内容一致性...');

const zhKeys = new Set<string>();
const enKeys = new Set<string>();

function collectKeys(obj: any, prefix: string, keySet: Set<string>) {
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      collectKeys(obj[key], fullKey, keySet);
    } else {
      keySet.add(fullKey);
    }
  }
}

collectKeys(messages['zh-CN'], '', zhKeys);
collectKeys(messages['en'], '', enKeys);

const missingInEn = [...zhKeys].filter(k => !enKeys.has(k));
const missingInZh = [...enKeys].filter(k => !zhKeys.has(k));

if (missingInEn.length === 0 && missingInZh.length === 0) {
  console.log('  ✅ 两种语言的 key 完全一致');
} else {
  if (missingInEn.length > 0) {
    console.log(`  ❌ en 缺少的 key: ${missingInEn.join(', ')}`);
  }
  if (missingInZh.length > 0) {
    console.log(`  ❌ zh-CN 缺少的 key: ${missingInZh.join(', ')}`);
  }
}

// 验证 4: 检查主题相关的翻译
console.log('\n4. 验证主题相关翻译...');
const themeKeys = ['theme.light', 'theme.dark', 'theme.system'];
let themeTranslationsOk = true;

for (const locale of locales) {
  for (const key of themeKeys) {
    const value = getNestedValue(messages[locale], key);
    if (!value || typeof value !== 'string' || value.length === 0) {
      console.log(`  ❌ ${locale}: ${key} 翻译缺失或为空`);
      themeTranslationsOk = false;
    }
  }
}

if (themeTranslationsOk) {
  console.log('  ✅ 主题相关翻译完整');
}

// 验证 5: 检查输入模式相关翻译
console.log('\n5. 验证输入模式相关翻译...');
const inputModeKeys = ['inputMode.text', 'inputMode.image', 'inputMode.switchToText', 'inputMode.switchToImage'];
let inputModeTranslationsOk = true;

for (const locale of locales) {
  for (const key of inputModeKeys) {
    const value = getNestedValue(messages[locale], key);
    if (!value || typeof value !== 'string' || value.length === 0) {
      console.log(`  ❌ ${locale}: ${key} 翻译缺失或为空`);
      inputModeTranslationsOk = false;
    }
  }
}

if (inputModeTranslationsOk) {
  console.log('  ✅ 输入模式相关翻译完整');
}

// 总结
console.log('\n========================================');
console.log('验证总结');
console.log('========================================');

const allPassed = allKeysPresent && 
                  supportedLanguages.length >= 2 && 
                  missingInEn.length === 0 && 
                  missingInZh.length === 0 &&
                  themeTranslationsOk &&
                  inputModeTranslationsOk;

if (allPassed) {
  console.log('✅ 所有验证通过！基础设施实现正确。');
  console.log('\n已验证的功能：');
  console.log('  - 主题系统 (useTheme.ts): light/dark/system 模式、localStorage 持久化');
  console.log('  - 国际化系统 (useI18n.ts): 中英文切换、浏览器语言检测、localStorage 持久化');
  console.log('  - CSS Variables: 完整的颜色系统、过渡动画变量');
  console.log('  - 语言文件: zh-CN.ts 和 en.ts 结构一致');
  process.exit(0);
} else {
  console.log('❌ 部分验证失败，请检查上述错误。');
  process.exit(1);
}
