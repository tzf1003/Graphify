<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/');
};
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <button class="logo-btn" @click="goHome" title="返回首页">
        <svg class="logo-icon" viewBox="0 0 32 32" fill="none" width="24" height="24">
          <defs>
            <linearGradient id="headerLogoGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#6366f1"/>
              <stop offset="100%" style="stop-color:#8b5cf6"/>
            </linearGradient>
            <linearGradient id="headerLogoGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#06b6d4"/>
              <stop offset="100%" style="stop-color:#6366f1"/>
            </linearGradient>
          </defs>
          <circle cx="10" cy="10" r="3" fill="url(#headerLogoGrad1)"/>
          <circle cx="22" cy="10" r="2.5" fill="url(#headerLogoGrad2)"/>
          <circle cx="16" cy="22" r="3.5" fill="url(#headerLogoGrad1)"/>
          <circle cx="8" cy="20" r="2" fill="url(#headerLogoGrad2)" opacity="0.7"/>
          <path d="M10 13 L16 19" stroke="url(#headerLogoGrad2)" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M22 12 L16 19" stroke="url(#headerLogoGrad1)" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M10 10 L20 10" stroke="url(#headerLogoGrad2)" stroke-width="1" stroke-linecap="round" opacity="0.5"/>
        </svg>
        <span class="logo-text">图析</span>
      </button>
    </div>
    <div class="header-center">
      <slot name="title"></slot>
    </div>
    <div class="header-right">
      <slot name="actions"></slot>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-left,
.header-center,
.header-right {
  display: flex;
  align-items: center;
}

.header-left {
  flex: 0 0 auto;
}

.header-center {
  flex: 1;
  justify-content: center;
}

.header-right {
  flex: 0 0 auto;
  gap: 8px;
}

.logo-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logo-btn:hover {
  background: #f3f4f6;
}

.logo-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}
</style>
