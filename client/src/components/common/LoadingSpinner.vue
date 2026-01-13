<script setup lang="ts">
interface Props {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  color: '#3b82f6',
});

const sizeMap = {
  small: '16px',
  medium: '32px',
  large: '48px',
};
</script>

<template>
  <div class="loading-spinner" :style="{ '--spinner-size': sizeMap[props.size], '--spinner-color': props.color }">
    <div class="spinner"></div>
  </div>
</template>

<style scoped>
.loading-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: var(--spinner-size);
  height: var(--spinner-size);
  border: 3px solid #e5e7eb;
  border-top-color: var(--spinner-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
