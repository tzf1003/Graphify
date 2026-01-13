<script setup lang="ts">
/**
 * TechBackground.vue - 科技感背景效果
 * 流动网格 + 中心光晕 + 脉冲动画
 */
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useTheme } from '../../composables/useTheme';

const { isDark } = useTheme();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationId: number | null = null;
let time = 0;

// 网格配置
const GRID_SIZE = 40;
const PULSE_SPEED = 0.02;
const WAVE_SPEED = 0.015;
const GLOW_INTENSITY = 0.6;

interface Point {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  offset: number;
}

let points: Point[] = [];
let width = 0;
let height = 0;
let centerX = 0;
let centerY = 0;
let dpr = 1;

/**
 * 初始化网格点
 */
function initGrid(w: number, h: number): void {
  points = [];
  const cols = Math.ceil(w / GRID_SIZE) + 2;
  const rows = Math.ceil(h / GRID_SIZE) + 2;
  
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = j * GRID_SIZE - GRID_SIZE;
      const y = i * GRID_SIZE - GRID_SIZE;
      points.push({
        x,
        y,
        baseX: x,
        baseY: y,
        offset: Math.random() * Math.PI * 2
      });
    }
  }
}

/**
 * 更新点位置 - 波动效果
 */
function updatePoints(): void {
  const waveTime = time * WAVE_SPEED;
  
  points.forEach(point => {
    const distFromCenter = Math.sqrt(
      Math.pow(point.baseX - centerX, 2) + 
      Math.pow(point.baseY - centerY, 2)
    );
    
    const wave = Math.sin(waveTime + distFromCenter * 0.01 + point.offset) * 3;
    const wave2 = Math.cos(waveTime * 0.7 + point.offset) * 2;
    
    point.x = point.baseX + wave;
    point.y = point.baseY + wave2;
  });
}

/**
 * 绘制背景
 */
function draw(ctx: CanvasRenderingContext2D): void {
  const dark = isDark.value;
  
  // 清空画布
  ctx.clearRect(0, 0, width, height);
  
  // 绘制中心光晕
  const pulseIntensity = (Math.sin(time * PULSE_SPEED) + 1) / 2;
  const glowRadius = Math.min(width, height) * (0.4 + pulseIntensity * 0.1);
  
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, glowRadius
  );
  
  if (dark) {
    gradient.addColorStop(0, `rgba(0, 217, 255, ${0.08 * GLOW_INTENSITY * (0.7 + pulseIntensity * 0.3)})`);
    gradient.addColorStop(0.3, `rgba(0, 217, 255, ${0.04 * GLOW_INTENSITY})`);
    gradient.addColorStop(0.6, `rgba(124, 58, 237, ${0.02 * GLOW_INTENSITY})`);
    gradient.addColorStop(1, 'transparent');
  } else {
    gradient.addColorStop(0, `rgba(59, 130, 246, ${0.06 * GLOW_INTENSITY * (0.7 + pulseIntensity * 0.3)})`);
    gradient.addColorStop(0.3, `rgba(59, 130, 246, ${0.03 * GLOW_INTENSITY})`);
    gradient.addColorStop(0.6, `rgba(139, 92, 246, ${0.015 * GLOW_INTENSITY})`);
    gradient.addColorStop(1, 'transparent');
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // 绘制网格线
  const cols = Math.ceil(width / GRID_SIZE) + 2;
  const rows = Math.ceil(height / GRID_SIZE) + 2;
  
  ctx.strokeStyle = dark 
    ? `rgba(0, 217, 255, ${0.06 + pulseIntensity * 0.02})`
    : `rgba(59, 130, 246, ${0.08 + pulseIntensity * 0.02})`;
  ctx.lineWidth = 0.5;
  
  // 水平线
  for (let i = 0; i < rows; i++) {
    ctx.beginPath();
    for (let j = 0; j < cols; j++) {
      const idx = i * cols + j;
      if (idx < points.length) {
        const point = points[idx];
        if (j === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
    }
    ctx.stroke();
  }
  
  // 垂直线
  for (let j = 0; j < cols; j++) {
    ctx.beginPath();
    for (let i = 0; i < rows; i++) {
      const idx = i * cols + j;
      if (idx < points.length) {
        const point = points[idx];
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      }
    }
    ctx.stroke();
  }
  
  // 绘制网格交点光点
  const dotColor = dark ? 'rgba(0, 217, 255, 0.3)' : 'rgba(59, 130, 246, 0.25)';
  ctx.fillStyle = dotColor;
  
  points.forEach((point) => {
    const distFromCenter = Math.sqrt(
      Math.pow(point.x - centerX, 2) + 
      Math.pow(point.y - centerY, 2)
    );
    
    // 越靠近中心，点越亮
    const brightness = Math.max(0, 1 - distFromCenter / (Math.min(width, height) * 0.5));
    const size = 1 + brightness * 1.5;
    
    if (brightness > 0.1) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  // 绘制流动光线
  drawFlowingLines(ctx, dark, pulseIntensity);
}

/**
 * 绘制流动光线效果
 */
function drawFlowingLines(ctx: CanvasRenderingContext2D, dark: boolean, pulse: number): void {
  const lineCount = 3;
  const baseColor = dark ? [0, 217, 255] : [59, 130, 246];
  
  for (let i = 0; i < lineCount; i++) {
    const angle = (time * 0.001 + (i * Math.PI * 2) / lineCount) % (Math.PI * 2);
    const length = Math.min(width, height) * 0.3;
    const startDist = 50;
    
    const startX = centerX + Math.cos(angle) * startDist;
    const startY = centerY + Math.sin(angle) * startDist;
    const endX = centerX + Math.cos(angle) * (startDist + length);
    const endY = centerY + Math.sin(angle) * (startDist + length);
    
    const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
    gradient.addColorStop(0, `rgba(${baseColor.join(',')}, ${0.2 * pulse})`);
    gradient.addColorStop(0.5, `rgba(${baseColor.join(',')}, ${0.05})`);
    gradient.addColorStop(1, 'transparent');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

/**
 * 动画循环
 */
function animate(): void {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  time++;
  updatePoints();
  draw(ctx);
  
  animationId = requestAnimationFrame(animate);
}

/**
 * 调整画布大小
 */
function resizeCanvas(): void {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  width = rect.width;
  height = rect.height;
  centerX = width / 2;
  centerY = height / 2;
  
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(dpr, dpr);
  }
  
  initGrid(width, height);
}

// 监听主题变化
watch(isDark, () => {
  const canvas = canvasRef.value;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      draw(ctx);
    }
  }
});

onMounted(() => {
  resizeCanvas();
  animate();
  window.addEventListener('resize', resizeCanvas);
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener('resize', resizeCanvas);
});
</script>

<template>
  <canvas 
    ref="canvasRef" 
    class="tech-background"
    aria-hidden="true"
  />
</template>

<style scoped>
.tech-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
</style>
