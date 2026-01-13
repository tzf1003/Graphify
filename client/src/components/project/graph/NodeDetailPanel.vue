<script setup lang="ts">
/**
 * 节点详情面板组件
 * 用于编辑选中节点的详细配置
 * 
 * 功能：
 * - 基本信息编辑（name, description, type）
 * - 几何信息编辑（bbox, polygon, depth_hint）
 * - 外观编辑（material, color, texture, text）
 * - 约束编辑（keep_identity, preserve_text_legibility）
 * - 关系列表显示和管理
 * 
 * Requirements: 3.1, 3.2, 3.5
 */
import { ref, computed, watch } from 'vue';
import type { 
  CanonicalElement, 
  CanonicalRelation, 
  ElementType,
  RelationType,
  ElementGeometry,
  ElementAppearance,
  ElementConstraints,
  TextAppearance,
} from '@/types';
import { validateBbox, validateElement } from '@/utils/graphValidation';
import { NODE_STYLES } from '@/utils/graphTransform';

// ==================== Props ====================
interface Props {
  element: CanonicalElement | null;
  relations: CanonicalRelation[];
  allElements: CanonicalElement[];
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
});

// ==================== Emits ====================
const emit = defineEmits<{
  (e: 'update', element: CanonicalElement): void;
  (e: 'close'): void;
  (e: 'add-relation', relation: CanonicalRelation): void;
  (e: 'remove-relation', relationIndex: number): void;
}>();

// ==================== 状态 ====================

/** 当前激活的标签页 */
type TabType = 'basic' | 'geometry' | 'appearance' | 'constraints' | 'relations';
const activeTab = ref<TabType>('basic');

/** 验证错误 */
const validationErrors = ref<Record<string, string>>({});

/** 本地编辑数据（深拷贝，避免直接修改 props） */
const localElement = ref<CanonicalElement | null>(null);

/** 新关系表单 */
const newRelation = ref<{
  targetId: string;
  type: RelationType;
}>({
  targetId: '',
  type: 'attached_to',
});

/** 是否显示添加关系表单 */
const showAddRelation = ref(false);

// ==================== 常量 ====================

/** 元素类型选项 */
const elementTypes: { value: ElementType; label: string }[] = [
  { value: 'subject', label: '主体' },
  { value: 'object', label: '物体' },
  { value: 'text', label: '文本' },
  { value: 'background', label: '背景' },
  { value: 'effect', label: '特效' },
];

/** 关系类型选项 */
const relationTypes: { value: RelationType; label: string; description: string }[] = [
  { value: 'occludes', label: '遮挡', description: '前者遮挡后者' },
  { value: 'attached_to', label: '附着', description: '前者附着在后者上' },
  { value: 'in_front_of', label: '在前面', description: '前者在后者前面' },
  { value: 'part_of', label: '属于', description: '前者是后者的一部分' },
];

/** 标签页配置 */
const tabs: { key: TabType; label: string; icon: string }[] = [
  { key: 'basic', label: '基本', icon: 'info' },
  { key: 'geometry', label: '几何', icon: 'box' },
  { key: 'appearance', label: '外观', icon: 'palette' },
  { key: 'constraints', label: '约束', icon: 'lock' },
  { key: 'relations', label: '关系', icon: 'link' },
];

// ==================== 计算属性 ====================

/** 当前元素相关的关系（作为 from 或 to） */
const elementRelations = computed(() => {
  if (!localElement.value) return [];
  const elementId = localElement.value.id;
  return props.relations
    .map((rel, index) => ({ ...rel, index }))
    .filter(rel => rel.from === elementId || rel.to === elementId);
});

/** 可选的目标元素（排除当前元素） */
const availableTargets = computed(() => {
  if (!localElement.value) return [];
  return props.allElements.filter(el => el.id !== localElement.value?.id);
});

/** 当前元素类型的样式 */
const currentTypeStyle = computed(() => {
  if (!localElement.value) return NODE_STYLES.object;
  return NODE_STYLES[localElement.value.type] ?? NODE_STYLES.object;
});

/** 是否有验证错误 */
const hasErrors = computed(() => Object.keys(validationErrors.value).length > 0);

// ==================== 监听器 ====================

/** 监听 element prop 变化，同步到本地状态 */
watch(
  () => props.element,
  (newElement) => {
    if (newElement) {
      // 深拷贝避免直接修改 props
      localElement.value = JSON.parse(JSON.stringify(newElement));
      validationErrors.value = {};
      activeTab.value = 'basic';
    } else {
      localElement.value = null;
    }
  },
  { immediate: true, deep: true }
);

// ==================== 方法 ====================

/** 关闭面板 */
function handleClose() {
  emit('close');
}

/** 处理 Escape 键关闭 */
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    handleClose();
  }
}

/** 更新基本信息字段 */
function updateBasicField(field: 'name' | 'description' | 'type', value: string) {
  if (!localElement.value || props.readonly) return;
  
  if (field === 'type') {
    localElement.value.type = value as ElementType;
  } else {
    localElement.value[field] = value;
  }
  
  // 验证并发出更新
  validateAndEmit();
}

/** 更新几何信息 */
function updateGeometry(field: keyof ElementGeometry, value: unknown) {
  if (!localElement.value || props.readonly) return;
  
  if (field === 'bbox' && Array.isArray(value)) {
    // 验证 bbox
    const bboxValue = value as [number, number, number, number];
    const bboxResult = validateBbox(bboxValue);
    
    if (!bboxResult.valid) {
      const errorMessages = bboxResult.errors
        .filter(e => e.severity === 'error')
        .map(e => e.message)
        .join('; ');
      validationErrors.value['geometry.bbox'] = errorMessages || '无效的边界框值';
      return;
    }
    
    delete validationErrors.value['geometry.bbox'];
    localElement.value.geometry.bbox = bboxValue;
  } else if (field === 'depth_hint' && typeof value === 'number') {
    localElement.value.geometry.depth_hint = value;
  } else if (field === 'polygon' && Array.isArray(value)) {
    localElement.value.geometry.polygon = value as number[][];
  }
  
  validateAndEmit();
}

/** 更新单个 bbox 坐标 */
function updateBboxCoord(index: number, value: string) {
  if (!localElement.value || props.readonly) return;
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return;
  
  const newBbox = [...localElement.value.geometry.bbox] as [number, number, number, number];
  newBbox[index] = numValue;
  
  updateGeometry('bbox', newBbox);
}

/** 更新外观信息 */
function updateAppearance(field: keyof ElementAppearance, value: unknown) {
  if (!localElement.value || props.readonly) return;
  
  if (field === 'text' && typeof value === 'object') {
    localElement.value.appearance.text = value as TextAppearance;
  } else if (field !== 'text' && typeof value === 'string') {
    (localElement.value.appearance as Record<string, unknown>)[field] = value;
  }
  
  validateAndEmit();
}

/** 更新文本外观 */
function updateTextAppearance(field: keyof TextAppearance, value: string) {
  if (!localElement.value || props.readonly) return;
  
  if (!localElement.value.appearance.text) {
    localElement.value.appearance.text = {
      content: '',
      font_hint: '',
      language: 'zh',
    };
  }
  
  localElement.value.appearance.text[field] = value;
  validateAndEmit();
}

/** 更新约束信息 */
function updateConstraint(field: keyof ElementConstraints, value: boolean) {
  if (!localElement.value || props.readonly) return;
  
  localElement.value.constraints[field] = value;
  validateAndEmit();
}

/** 验证并发出更新事件 */
function validateAndEmit() {
  if (!localElement.value) return;
  
  // 执行完整验证
  const elementResult = validateElement(localElement.value);
  if (!elementResult.valid) {
    const errorMessages = elementResult.errors
      .filter(e => e.severity === 'error')
      .map(e => e.message)
      .join('; ');
    validationErrors.value['element'] = errorMessages || '元素数据无效';
    return;
  }
  
  delete validationErrors.value['element'];
  
  // 发出更新事件
  emit('update', JSON.parse(JSON.stringify(localElement.value)));
}

/** 添加新关系 */
function handleAddRelation() {
  if (!localElement.value || !newRelation.value.targetId) return;
  
  const relation: CanonicalRelation = {
    from: localElement.value.id,
    to: newRelation.value.targetId,
    type: newRelation.value.type,
  };
  
  emit('add-relation', relation);
  
  // 重置表单
  newRelation.value = { targetId: '', type: 'attached_to' };
  showAddRelation.value = false;
}

/** 删除关系 */
function handleRemoveRelation(index: number) {
  emit('remove-relation', index);
}

/** 获取元素名称 */
function getElementName(elementId: string): string {
  const element = props.allElements.find(el => el.id === elementId);
  return element?.name ?? elementId;
}

/** 获取关系类型标签 */
function getRelationTypeLabel(type: RelationType): string {
  const found = relationTypes.find(rt => rt.value === type);
  return found?.label ?? type;
}

/** 切换标签页 */
function switchTab(tab: TabType) {
  activeTab.value = tab;
}
</script>

<template>
  <div 
    v-if="localElement" 
    class="node-detail-panel"
    @keydown="handleKeydown"
    tabindex="0"
  >
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="panel-header__title">
        <div 
          class="panel-header__icon"
          :style="{ backgroundColor: `${currentTypeStyle.color}20`, color: currentTypeStyle.color }"
        >
          <!-- 根据类型显示图标 -->
          <svg v-if="localElement.type === 'subject'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <svg v-else-if="localElement.type === 'object'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <svg v-else-if="localElement.type === 'text'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
          <svg v-else-if="localElement.type === 'background'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
          </svg>
        </div>
        <span class="panel-header__name">{{ localElement.name || '未命名元素' }}</span>
      </div>
      <button class="panel-header__close" @click="handleClose" title="关闭 (Esc)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <!-- 标签页导航 -->
    <div class="panel-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="panel-tabs__item"
        :class="{ 'panel-tabs__item--active': activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 面板内容 -->
    <div class="panel-content">
      <!-- 基本信息标签页 -->
      <div v-show="activeTab === 'basic'" class="panel-section">
        <div class="form-group">
          <label class="form-label">名称</label>
          <input
            type="text"
            class="form-input"
            :value="localElement.name"
            :disabled="readonly"
            @input="updateBasicField('name', ($event.target as HTMLInputElement).value)"
            placeholder="输入元素名称"
          />
        </div>

        <div class="form-group">
          <label class="form-label">描述</label>
          <textarea
            class="form-textarea"
            :value="localElement.description"
            :disabled="readonly"
            @input="updateBasicField('description', ($event.target as HTMLTextAreaElement).value)"
            placeholder="输入元素描述"
            rows="3"
          />
        </div>

        <div class="form-group">
          <label class="form-label">类型</label>
          <select
            class="form-select"
            :value="localElement.type"
            :disabled="readonly"
            @change="updateBasicField('type', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="et in elementTypes" :key="et.value" :value="et.value">
              {{ et.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">ID</label>
          <input
            type="text"
            class="form-input form-input--readonly"
            :value="localElement.id"
            disabled
          />
          <span class="form-hint">元素唯一标识符，不可修改</span>
        </div>
      </div>

      <!-- 几何信息标签页 -->
      <div v-show="activeTab === 'geometry'" class="panel-section">
        <div class="form-group">
          <label class="form-label">边界框 (Bbox)</label>
          <div class="bbox-grid">
            <div class="bbox-item">
              <label class="bbox-label">X1</label>
              <input
                type="number"
                class="form-input form-input--small"
                :class="{ 'form-input--error': validationErrors['geometry.bbox'] }"
                :value="localElement.geometry.bbox[0]"
                :disabled="readonly"
                step="0.01"
                min="0"
                max="1"
                @input="updateBboxCoord(0, ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="bbox-item">
              <label class="bbox-label">Y1</label>
              <input
                type="number"
                class="form-input form-input--small"
                :class="{ 'form-input--error': validationErrors['geometry.bbox'] }"
                :value="localElement.geometry.bbox[1]"
                :disabled="readonly"
                step="0.01"
                min="0"
                max="1"
                @input="updateBboxCoord(1, ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="bbox-item">
              <label class="bbox-label">X2</label>
              <input
                type="number"
                class="form-input form-input--small"
                :class="{ 'form-input--error': validationErrors['geometry.bbox'] }"
                :value="localElement.geometry.bbox[2]"
                :disabled="readonly"
                step="0.01"
                min="0"
                max="1"
                @input="updateBboxCoord(2, ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="bbox-item">
              <label class="bbox-label">Y2</label>
              <input
                type="number"
                class="form-input form-input--small"
                :class="{ 'form-input--error': validationErrors['geometry.bbox'] }"
                :value="localElement.geometry.bbox[3]"
                :disabled="readonly"
                step="0.01"
                min="0"
                max="1"
                @input="updateBboxCoord(3, ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
          <span v-if="validationErrors['geometry.bbox']" class="form-error">
            {{ validationErrors['geometry.bbox'] }}
          </span>
          <span v-else class="form-hint">归一化坐标，范围 [0, 1]</span>
        </div>

        <div class="form-group">
          <label class="form-label">深度提示 (Depth Hint)</label>
          <input
            type="number"
            class="form-input"
            :value="localElement.geometry.depth_hint"
            :disabled="readonly"
            step="0.1"
            @input="updateGeometry('depth_hint', parseFloat(($event.target as HTMLInputElement).value))"
          />
          <span class="form-hint">值越大表示越靠前</span>
        </div>

        <div class="form-group">
          <label class="form-label">多边形顶点 (Polygon)</label>
          <div class="polygon-info">
            <span class="polygon-count">{{ localElement.geometry.polygon.length }} 个顶点</span>
          </div>
          <span class="form-hint">多边形编辑功能开发中</span>
        </div>
      </div>

      <!-- 外观标签页 -->
      <div v-show="activeTab === 'appearance'" class="panel-section">
        <div class="form-group">
          <label class="form-label">材质</label>
          <input
            type="text"
            class="form-input"
            :value="localElement.appearance.material"
            :disabled="readonly"
            @input="updateAppearance('material', ($event.target as HTMLInputElement).value)"
            placeholder="如：金属、木材、玻璃"
          />
        </div>

        <div class="form-group">
          <label class="form-label">颜色</label>
          <input
            type="text"
            class="form-input"
            :value="localElement.appearance.color"
            :disabled="readonly"
            @input="updateAppearance('color', ($event.target as HTMLInputElement).value)"
            placeholder="如：红色、#FF0000"
          />
        </div>

        <div class="form-group">
          <label class="form-label">纹理</label>
          <input
            type="text"
            class="form-input"
            :value="localElement.appearance.texture"
            :disabled="readonly"
            @input="updateAppearance('texture', ($event.target as HTMLInputElement).value)"
            placeholder="如：光滑、粗糙、条纹"
          />
        </div>

        <!-- 文本外观（仅当类型为 text 时显示） -->
        <template v-if="localElement.type === 'text' || localElement.appearance.text">
          <div class="form-divider">
            <span>文本属性</span>
          </div>

          <div class="form-group">
            <label class="form-label">文本内容</label>
            <textarea
              class="form-textarea"
              :value="localElement.appearance.text?.content ?? ''"
              :disabled="readonly"
              @input="updateTextAppearance('content', ($event.target as HTMLTextAreaElement).value)"
              placeholder="输入文本内容"
              rows="2"
            />
          </div>

          <div class="form-group">
            <label class="form-label">字体提示</label>
            <input
              type="text"
              class="form-input"
              :value="localElement.appearance.text?.font_hint ?? ''"
              :disabled="readonly"
              @input="updateTextAppearance('font_hint', ($event.target as HTMLInputElement).value)"
              placeholder="如：宋体、黑体、手写体"
            />
          </div>

          <div class="form-group">
            <label class="form-label">语言</label>
            <input
              type="text"
              class="form-input"
              :value="localElement.appearance.text?.language ?? 'zh'"
              :disabled="readonly"
              @input="updateTextAppearance('language', ($event.target as HTMLInputElement).value)"
              placeholder="如：zh、en"
            />
          </div>
        </template>
      </div>

      <!-- 约束标签页 -->
      <div v-show="activeTab === 'constraints'" class="panel-section">
        <div class="form-group form-group--checkbox">
          <label class="checkbox-label">
            <input
              type="checkbox"
              class="form-checkbox"
              :checked="localElement.constraints.keep_identity"
              :disabled="readonly"
              @change="updateConstraint('keep_identity', ($event.target as HTMLInputElement).checked)"
            />
            <span class="checkbox-text">保持身份特征</span>
          </label>
          <span class="form-hint">启用后，生成时将尽量保持元素的原始特征</span>
        </div>

        <div class="form-group form-group--checkbox">
          <label class="checkbox-label">
            <input
              type="checkbox"
              class="form-checkbox"
              :checked="localElement.constraints.preserve_text_legibility"
              :disabled="readonly"
              @change="updateConstraint('preserve_text_legibility', ($event.target as HTMLInputElement).checked)"
            />
            <span class="checkbox-text">保持文本可读性</span>
          </label>
          <span class="form-hint">启用后，生成时将确保文本清晰可读</span>
        </div>
      </div>

      <!-- 关系标签页 -->
      <div v-show="activeTab === 'relations'" class="panel-section">
        <!-- 关系列表 -->
        <div class="relations-list">
          <div v-if="elementRelations.length === 0" class="relations-empty">
            暂无关系
          </div>
          <div
            v-for="rel in elementRelations"
            :key="rel.index"
            class="relation-item"
          >
            <div class="relation-item__content">
              <span class="relation-item__from">
                {{ rel.from === localElement.id ? '当前元素' : getElementName(rel.from) }}
              </span>
              <span class="relation-item__type" :title="getRelationTypeLabel(rel.type)">
                {{ getRelationTypeLabel(rel.type) }}
              </span>
              <span class="relation-item__to">
                {{ rel.to === localElement.id ? '当前元素' : getElementName(rel.to) }}
              </span>
            </div>
            <button
              v-if="!readonly"
              class="relation-item__delete"
              @click="handleRemoveRelation(rel.index)"
              title="删除关系"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 添加关系 -->
        <div v-if="!readonly" class="add-relation">
          <button
            v-if="!showAddRelation"
            class="add-relation__trigger"
            @click="showAddRelation = true"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加关系
          </button>

          <div v-else class="add-relation__form">
            <div class="form-group">
              <label class="form-label">目标元素</label>
              <select
                v-model="newRelation.targetId"
                class="form-select"
              >
                <option value="">选择目标元素</option>
                <option v-for="el in availableTargets" :key="el.id" :value="el.id">
                  {{ el.name }} ({{ el.type }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">关系类型</label>
              <select
                v-model="newRelation.type"
                class="form-select"
              >
                <option v-for="rt in relationTypes" :key="rt.value" :value="rt.value">
                  {{ rt.label }} - {{ rt.description }}
                </option>
              </select>
            </div>

            <div class="add-relation__actions">
              <button
                class="btn btn--secondary"
                @click="showAddRelation = false"
              >
                取消
              </button>
              <button
                class="btn btn--primary"
                :disabled="!newRelation.targetId"
                @click="handleAddRelation"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="hasErrors" class="panel-errors">
      <div v-for="(error, key) in validationErrors" :key="key" class="panel-error">
        {{ error }}
      </div>
    </div>
  </div>
</template>


<style scoped>
.node-detail-panel {
  display: flex;
  flex-direction: column;
  width: 320px;
  max-height: 100%;
  background: #1a1a2e;
  border-left: 1px solid #333;
  overflow: hidden;
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #0d0d1a;
  border-bottom: 1px solid #333;
}

.panel-header__title {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.panel-header__icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.panel-header__icon svg {
  width: 18px;
  height: 18px;
}

.panel-header__name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-header__close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #888;
  cursor: pointer;
  transition: all 0.15s ease;
}

.panel-header__close:hover {
  background: #333;
  color: #fff;
}

.panel-header__close svg {
  width: 16px;
  height: 16px;
}

/* 标签页导航 */
.panel-tabs {
  display: flex;
  padding: 0 8px;
  background: #0d0d1a;
  border-bottom: 1px solid #333;
  overflow-x: auto;
}

.panel-tabs__item {
  flex-shrink: 0;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #888;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.panel-tabs__item:hover {
  color: #fff;
}

.panel-tabs__item--active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* 面板内容 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 表单组件 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group--checkbox {
  gap: 4px;
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: #888;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 8px 10px;
  background: #0d0d1a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  transition: border-color 0.15s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.form-input:disabled,
.form-textarea:disabled,
.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input--readonly {
  background: #1a1a2e;
  color: #666;
}

.form-input--small {
  padding: 6px 8px;
  font-size: 12px;
}

.form-input--error {
  border-color: #ef4444;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-select {
  cursor: pointer;
}

.form-hint {
  font-size: 11px;
  color: #666;
}

.form-error {
  font-size: 11px;
  color: #ef4444;
}

.form-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0;
  color: #666;
  font-size: 11px;
}

.form-divider::before,
.form-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #333;
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #3b82f6;
  cursor: pointer;
}

.checkbox-text {
  font-size: 13px;
  color: #fff;
}

/* Bbox 网格 */
.bbox-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.bbox-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bbox-label {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
}

/* Polygon 信息 */
.polygon-info {
  padding: 8px 10px;
  background: #0d0d1a;
  border: 1px solid #333;
  border-radius: 6px;
}

.polygon-count {
  font-size: 13px;
  color: #888;
}

/* 关系列表 */
.relations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.relations-empty {
  padding: 20px;
  text-align: center;
  color: #666;
  font-size: 13px;
}

.relation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #0d0d1a;
  border: 1px solid #333;
  border-radius: 6px;
}

.relation-item__content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.relation-item__from,
.relation-item__to {
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.relation-item__type {
  flex-shrink: 0;
  padding: 2px 6px;
  background: #3b82f620;
  border-radius: 4px;
  font-size: 10px;
  color: #3b82f6;
}

.relation-item__delete {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  transition: all 0.15s ease;
}

.relation-item__delete:hover {
  background: #ef444420;
  color: #ef4444;
}

.relation-item__delete svg {
  width: 14px;
  height: 14px;
}

/* 添加关系 */
.add-relation {
  margin-top: 8px;
}

.add-relation__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px dashed #333;
  border-radius: 6px;
  color: #888;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-relation__trigger:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.add-relation__trigger svg {
  width: 16px;
  height: 16px;
}

.add-relation__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #0d0d1a;
  border: 1px solid #333;
  border-radius: 6px;
}

.add-relation__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 按钮 */
.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: #3b82f6;
  color: #fff;
}

.btn--primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn--secondary {
  background: #333;
  color: #fff;
}

.btn--secondary:hover:not(:disabled) {
  background: #444;
}

/* 错误提示 */
.panel-errors {
  padding: 12px 16px;
  background: #ef444420;
  border-top: 1px solid #ef4444;
}

.panel-error {
  font-size: 12px;
  color: #ef4444;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #444;
}
</style>
