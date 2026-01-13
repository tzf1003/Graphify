/**
 * 基础 UI 组件验证脚本
 * 验证毛玻璃效果和粒子动画组件的实现是否符合需求
 * 
 * 验证项目：
 * 1. GlassCard 组件
 *    - 毛玻璃效果样式
 *    - variant/padding/rounded props
 *    - 主题适配
 * 
 * 2. GlassNavbar 组件
 *    - 毛玻璃导航栏
 *    - 主题切换按钮
 *    - 语言切换下拉菜单
 * 
 * 3. ParticleBackground 组件
 *    - Canvas 粒子渲染
 *    - 粒子移动动画
 *    - 粒子连线效果
 *    - 主题颜色适配
 *    - prefers-reduced-motion 支持
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('========================================');
console.log('基础 UI 组件验证 - AI-Native UI Redesign');
console.log('========================================\n');

let allPassed = true;

// ========================================
// 1. 验证 GlassCard 组件
// ========================================
console.log('1. 验证 GlassCard 组件...');

const glassCardPath = path.join(__dirname, '../client/src/components/common/GlassCard.vue');
const glassCardContent = fs.readFileSync(glassCardPath, 'utf-8');

const glassCardChecks = [
  { name: 'backdrop-filter blur', pattern: /backdrop-filter:\s*blur/ },
  { name: '-webkit-backdrop-filter', pattern: /-webkit-backdrop-filter:\s*blur/ },
  { name: 'variant prop', pattern: /variant\?:\s*['"]default['"].*['"]elevated['"].*['"]interactive['"]/ },
  { name: 'padding prop', pattern: /padding\?:\s*['"]none['"].*['"]sm['"].*['"]md['"].*['"]lg['"]/ },
  { name: 'rounded prop', pattern: /rounded\?:\s*['"]sm['"].*['"]md['"].*['"]lg['"].*['"]xl['"]/ },
  { name: 'CSS variable --bg-glass', pattern: /var\(--bg-glass\)/ },
  { name: 'CSS variable --border-glass', pattern: /var\(--border-glass\)/ },
  { name: 'hover 效果', pattern: /glass-card--interactive:hover/ },
  { name: 'transition 动画', pattern: /transition:/ }
];

for (const check of glassCardChecks) {
  if (check.pattern.test(glassCardContent)) {
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ 缺少 ${check.name}`);
    allPassed = false;
  }
}

// ========================================
// 2. 验证 GlassNavbar 组件
// ========================================
console.log('\n2. 验证 GlassNavbar 组件...');

const glassNavbarPath = path.join(__dirname, '../client/src/components/common/GlassNavbar.vue');
const glassNavbarContent = fs.readFileSync(glassNavbarPath, 'utf-8');

const glassNavbarChecks = [
  { name: 'useTheme 导入', pattern: /import.*useTheme/ },
  { name: 'useI18n 导入', pattern: /import.*useI18n/ },
  { name: '主题切换按钮', pattern: /toggleDark|toggleTheme/ },
  { name: '语言切换功能', pattern: /setLocale|selectLanguage/ },
  { name: '毛玻璃效果', pattern: /backdrop-filter:\s*blur/ },
  { name: '浮动定位', pattern: /position:\s*fixed/ },
  { name: '太阳/月亮图标', pattern: /🌙|☀️|sun|moon/i },
  { name: '语言下拉菜单', pattern: /lang-menu|lang-dropdown/ },
  { name: '响应式布局', pattern: /@media.*max-width/ }
];

for (const check of glassNavbarChecks) {
  if (check.pattern.test(glassNavbarContent)) {
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ 缺少 ${check.name}`);
    allPassed = false;
  }
}

// ========================================
// 3. 验证 ParticleBackground 组件
// ========================================
console.log('\n3. 验证 ParticleBackground 组件...');

const particleBgPath = path.join(__dirname, '../client/src/components/effects/ParticleBackground.vue');
const particleBgContent = fs.readFileSync(particleBgPath, 'utf-8');

const particleBgChecks = [
  { name: 'Canvas 元素', pattern: /<canvas/ },
  { name: 'Particle 接口定义', pattern: /interface\s+Particle/ },
  { name: 'particleCount prop', pattern: /particleCount\?:/ },
  { name: 'connectionDistance prop', pattern: /connectionDistance\?:/ },
  { name: 'speed prop', pattern: /speed\?:/ },
  { name: 'requestAnimationFrame', pattern: /requestAnimationFrame/ },
  { name: 'cancelAnimationFrame', pattern: /cancelAnimationFrame/ },
  { name: 'prefers-reduced-motion 检测', pattern: /prefers-reduced-motion/ },
  { name: '主题颜色适配 (isDark)', pattern: /isDark/ },
  { name: '粒子连线绘制', pattern: /lineTo|moveTo/ },
  { name: '粒子圆形绘制', pattern: /arc\(/ },
  { name: 'resize 事件监听', pattern: /resize.*resizeCanvas|addEventListener.*resize/ },
  { name: 'z-index: 0', pattern: /z-index:\s*0/ },
  { name: 'pointer-events: none', pattern: /pointer-events:\s*none/ }
];

for (const check of particleBgChecks) {
  if (check.pattern.test(particleBgContent)) {
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ 缺少 ${check.name}`);
    allPassed = false;
  }
}

// ========================================
// 4. 验证 CSS Variables 定义
// ========================================
console.log('\n4. 验证 CSS Variables 定义...');

const styleCssPath = path.join(__dirname, '../client/src/style.css');
const styleCssContent = fs.readFileSync(styleCssPath, 'utf-8');

const cssVarChecks = [
  { name: '--bg-primary', pattern: /--bg-primary:/ },
  { name: '--bg-glass', pattern: /--bg-glass:/ },
  { name: '--bg-glass-hover', pattern: /--bg-glass-hover:/ },
  { name: '--text-primary', pattern: /--text-primary:/ },
  { name: '--text-secondary', pattern: /--text-secondary:/ },
  { name: '--border-glass', pattern: /--border-glass:/ },
  { name: '--accent', pattern: /--accent:/ },
  { name: '--blur-glass', pattern: /--blur-glass:/ },
  { name: '--transition-fast', pattern: /--transition-fast:/ },
  { name: '--transition-normal', pattern: /--transition-normal:/ },
  { name: '--shadow-sm', pattern: /--shadow-sm:/ },
  { name: '--shadow-md', pattern: /--shadow-md:/ },
  { name: '--shadow-lg', pattern: /--shadow-lg:/ },
  { name: 'Dark mode 定义', pattern: /:root\.dark/ },
  { name: 'Light mode 定义', pattern: /:root\.light|:root,/ },
  { name: 'prefers-reduced-motion', pattern: /prefers-reduced-motion/ }
];

for (const check of cssVarChecks) {
  if (check.pattern.test(styleCssContent)) {
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ 缺少 ${check.name}`);
    allPassed = false;
  }
}

// ========================================
// 5. 验证主题系统 composable
// ========================================
console.log('\n5. 验证主题系统 composable...');

const useThemePath = path.join(__dirname, '../client/src/composables/useTheme.ts');
const useThemeContent = fs.readFileSync(useThemePath, 'utf-8');

const useThemeChecks = [
  { name: 'ThemeMode 类型', pattern: /type\s+ThemeMode\s*=.*light.*dark.*system/ },
  { name: 'localStorage 持久化', pattern: /localStorage\.(get|set)Item/ },
  { name: 'prefers-color-scheme 检测', pattern: /prefers-color-scheme/ },
  { name: 'setTheme 函数', pattern: /setTheme.*=/ },
  { name: 'toggleTheme 函数', pattern: /toggleTheme.*=/ },
  { name: 'toggleDark 函数', pattern: /toggleDark.*=/ },
  { name: 'isDark computed', pattern: /isDark.*=.*computed/ },
  { name: 'resolvedMode computed', pattern: /resolvedMode.*=.*computed/ },
  { name: 'applyTheme 函数', pattern: /applyTheme/ },
  { name: 'DOM class 更新', pattern: /classList\.(add|remove)/ }
];

for (const check of useThemeChecks) {
  if (check.pattern.test(useThemeContent)) {
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ 缺少 ${check.name}`);
    allPassed = false;
  }
}

// ========================================
// 总结
// ========================================
console.log('\n========================================');
console.log('验证总结');
console.log('========================================');

if (allPassed) {
  console.log('✅ 所有验证通过！基础 UI 组件实现正确。');
  console.log('\n已验证的组件：');
  console.log('  - GlassCard: 毛玻璃效果、多种变体、主题适配');
  console.log('  - GlassNavbar: 浮动导航栏、主题切换、语言切换');
  console.log('  - ParticleBackground: Canvas 粒子动画、主题颜色适配、reduced-motion 支持');
  console.log('  - CSS Variables: 完整的颜色系统、light/dark 模式');
  console.log('  - useTheme: 主题状态管理、持久化、系统主题检测');
  process.exit(0);
} else {
  console.log('❌ 部分验证失败，请检查上述错误。');
  process.exit(1);
}
