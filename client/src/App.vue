<script setup lang="ts">
/**
 * App.vue - 应用根组件
 * 集成 ParticleBackground 和 GlassNavbar
 * 
 * Requirements: 1.1, 2.1, 3.1
 */
import { RouterView, useRoute } from 'vue-router';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ParticleBackground from '@/components/effects/ParticleBackground.vue';
import GlassNavbar from '@/components/common/GlassNavbar.vue';
import { useTheme } from '@/composables/useTheme';
import { useI18n } from '@/composables/useI18n';

// 初始化主题和国际化
const { isDark } = useTheme();
const { t } = useI18n();

const route = useRoute();

// HomeView 组件引用
const homeViewRef = ref<{ toggleSidebar: () => void } | null>(null);

// 判断是否在项目详情页
const isProjectPage = computed(() => route.path.startsWith('/p/'));

// 判断是否在首页
const isHomePage = computed(() => route.path === '/' || route.path === '');

// 导航栏标题
const navbarTitle = computed(() => t('common.appName') || 'Image Editor');

// 处理菜单切换
function handleToggleMenu(): void {
  if (homeViewRef.value?.toggleSidebar) {
    homeViewRef.value.toggleSidebar();
  }
}

// v-click-outside 指令实现
const clickOutsideHandler = ref<((e: MouseEvent) => void) | null>(null);

onMounted(() => {
  // 注册全局点击事件用于关闭下拉菜单
  clickOutsideHandler.value = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    // 检查是否点击了下拉菜单外部
    if (!target.closest('.lang-dropdown')) {
      // 触发自定义事件
      document.dispatchEvent(new CustomEvent('click-outside-dropdown'));
    }
  };
  document.addEventListener('click', clickOutsideHandler.value);
});

onUnmounted(() => {
  if (clickOutsideHandler.value) {
    document.removeEventListener('click', clickOutsideHandler.value);
  }
});
</script>

<template>
  <div class="app-root" :class="{ 'dark': isDark }">
    <!-- 粒子背景层 -->
    <ParticleBackground 
      :particle-count="50"
      :connection-distance="150"
      :speed="0.5"
    />

    <!-- 主布局层 -->
    <div class="app-layout">
      <!-- 毛玻璃导航栏 -->
      <GlassNavbar 
        :title="navbarTitle"
        :show-back="isProjectPage"
        :show-menu="false"
        @toggle-menu="handleToggleMenu"
      >
        <template #center>
          <router-view name="header-title" />
        </template>
        <template #actions>
          <router-view name="header-actions" />
        </template>
      </GlassNavbar>

      <!-- 主内容区域 -->
      <main class="app-main">
        <RouterView v-slot="{ Component }">
          <component :is="Component" ref="homeViewRef" />
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style>
/* 全局重置和基础样式已在 style.css 中定义 */

/* 确保 html 和 body 占满全屏 */
html, body, #app {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
/* 应用根容器 */
.app-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  background-color: var(--bg-primary);
  overflow: hidden;
}

/* 主布局层 - 位于粒子背景之上 */
.app-layout {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 100vh;
}

/* 主内容区域 */
.app-main {
  flex: 1;
  overflow: hidden;
}

/* 响应式调整 */
@media (max-width: 768px) {
  /* 移动端无需额外调整 */
}
</style>
