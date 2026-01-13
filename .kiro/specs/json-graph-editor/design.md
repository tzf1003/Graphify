# Design Document: JSON Graph Editor

## Overview

本设计将现有的Monaco JSON编辑器升级为可视化关系图谱编辑器。采用Vue Flow（@vue-flow/core）作为图谱渲染引擎，实现CanonicalJSON数据的可视化编辑。系统支持图谱视图和JSON视图的双向切换，所有编辑操作实时同步到数据模型。

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GraphJsonEditor.vue                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    ViewSwitcher                          ││
│  │              [Graph View] [JSON View]                    ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                          ││
│  │   ┌─────────────────────┐  ┌──────────────────────────┐ ││
│  │   │                     │  │                          │ ││
│  │   │    GraphCanvas      │  │     NodeDetailPanel      │ ││
│  │   │    (Vue Flow)       │  │                          │ ││
│  │   │                     │  │  - Element Info          │ ││
│  │   │   ┌───┐    ┌───┐   │  │  - Geometry Editor       │ ││
│  │   │   │ A │────│ B │   │  │  - Appearance Editor     │ ││
│  │   │   └───┘    └───┘   │  │  - Constraints Editor    │ ││
│  │   │      \      /      │  │  - Relations List        │ ││
│  │   │       ┌───┐        │  │                          │ ││
│  │   │       │ C │        │  │                          │ ││
│  │   │       └───┘        │  └──────────────────────────┘ ││
│  │   │                     │                               ││
│  │   └─────────────────────┘                               ││
│  │                                                          ││
│  │   ┌─────────────────────────────────────────────────────┐││
│  │   │              CanvasControls                          │││
│  │   │  [Zoom In] [Zoom Out] [Fit View] [Reset]            │││
│  │   └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    Toolbar                               ││
│  │  [Format] [Reset] [Save]                    [Modified]   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. GraphJsonEditor.vue (主组件)

替换现有的JsonEditor.vue，作为图谱编辑器的入口组件。

```typescript
interface Props {
  modelValue: CanonicalJSON | null;
  readonly?: boolean;
  saving?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: CanonicalJSON): void;
  (e: 'save', jsonString: string): void;
  (e: 'error', error: string): void;
}

interface State {
  viewMode: 'graph' | 'json';
  selectedNodeId: string | null;
  hasChanges: boolean;
  parseError: string | null;
  internalData: CanonicalJSON | null;
}
```

### 2. GraphCanvas.vue (图谱画布组件)

基于Vue Flow实现的图谱渲染组件。

```typescript
interface Props {
  elements: CanonicalElement[];
  relations: CanonicalRelation[];
  selectedNodeId: string | null;
  readonly?: boolean;
}

interface Emits {
  (e: 'node-click', nodeId: string): void;
  (e: 'node-drag', nodeId: string, position: { x: number; y: number }): void;
  (e: 'edge-click', edgeId: string): void;
  (e: 'edge-create', from: string, to: string): void;
  (e: 'edge-delete', edgeId: string): void;
}

// Vue Flow节点类型
interface GraphNode {
  id: string;
  type: 'element';
  position: { x: number; y: number };
  data: {
    element: CanonicalElement;
    isSelected: boolean;
  };
}

// Vue Flow边类型
interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'relation';
  data: {
    relation: CanonicalRelation;
  };
  label: string;
  animated?: boolean;
}
```

### 3. ElementNode.vue (自定义节点组件)

Vue Flow的自定义节点渲染组件。

```typescript
interface Props {
  id: string;
  data: {
    element: CanonicalElement;
    isSelected: boolean;
  };
}

// 节点样式映射
const nodeStyles: Record<ElementType, NodeStyle> = {
  subject: { color: '#3b82f6', icon: 'user' },
  object: { color: '#10b981', icon: 'box' },
  text: { color: '#f59e0b', icon: 'type' },
  background: { color: '#6366f1', icon: 'image' },
  effect: { color: '#ec4899', icon: 'sparkles' },
};
```

### 4. RelationEdge.vue (自定义边组件)

Vue Flow的自定义边渲染组件。

```typescript
interface Props {
  id: string;
  source: string;
  target: string;
  data: {
    relation: CanonicalRelation;
  };
}

// 边样式映射
const edgeStyles: Record<RelationType, EdgeStyle> = {
  occludes: { color: '#ef4444', strokeDasharray: 'none' },
  attached_to: { color: '#3b82f6', strokeDasharray: '5,5' },
  in_front_of: { color: '#10b981', strokeDasharray: 'none' },
  part_of: { color: '#8b5cf6', strokeDasharray: '2,2' },
};
```

### 5. NodeDetailPanel.vue (节点详情面板)

用于编辑选中节点的详细配置。

```typescript
interface Props {
  element: CanonicalElement | null;
  relations: CanonicalRelation[];
  allElements: CanonicalElement[];
  readonly?: boolean;
}

interface Emits {
  (e: 'update', element: CanonicalElement): void;
  (e: 'close'): void;
  (e: 'add-relation', relation: CanonicalRelation): void;
  (e: 'remove-relation', relationIndex: number): void;
}

interface State {
  activeTab: 'basic' | 'geometry' | 'appearance' | 'constraints' | 'relations';
  validationErrors: Record<string, string>;
}
```

### 6. ViewSwitcher.vue (视图切换组件)

```typescript
interface Props {
  modelValue: 'graph' | 'json';
  disabled?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: 'graph' | 'json'): void;
}
```

### 7. RelationTypeSelector.vue (关系类型选择器)

创建新关系时的类型选择弹窗。

```typescript
interface Props {
  visible: boolean;
  position: { x: number; y: number };
}

interface Emits {
  (e: 'select', type: RelationType): void;
  (e: 'cancel'): void;
}
```

## Data Models

### 图谱数据转换

```typescript
// CanonicalJSON -> Vue Flow格式
interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function canonicalToGraph(data: CanonicalJSON): GraphData {
  const nodes: GraphNode[] = data.elements.map((element, index) => ({
    id: element.id,
    type: 'element',
    position: calculateInitialPosition(element, index, data.elements.length),
    data: { element, isSelected: false },
  }));

  const edges: GraphEdge[] = data.relations.map((relation, index) => ({
    id: `edge-${index}`,
    source: relation.from,
    target: relation.to,
    type: 'relation',
    data: { relation },
    label: relation.type,
  }));

  return { nodes, edges };
}

// 根据bbox计算初始位置
function calculateInitialPosition(
  element: CanonicalElement,
  index: number,
  total: number
): { x: number; y: number } {
  // 使用bbox中心点作为参考，映射到画布坐标
  const [x1, y1, x2, y2] = element.geometry.bbox;
  const centerX = (x1 + x2) / 2;
  const centerY = (y1 + y2) / 2;
  
  // 映射到画布坐标系 (假设画布800x600)
  return {
    x: centerX * 800,
    y: centerY * 600,
  };
}
```

### 节点位置存储

节点位置不存储在CanonicalJSON中，而是在组件内部维护：

```typescript
interface NodePositions {
  [nodeId: string]: { x: number; y: number };
}

// 使用localStorage持久化位置（可选）
const POSITIONS_KEY = 'graph-editor-positions';
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Graph Rendering Consistency

*For any* valid CanonicalJSON input, the rendered graph SHALL have exactly as many nodes as there are elements in the input, and exactly as many edges as there are relations in the input.

**Validates: Requirements 1.1, 1.2**

### Property 2: Data Synchronization Integrity

*For any* modification made through the graph interface (node edit, edge create, edge delete), the underlying CanonicalJSON data SHALL immediately reflect that change with the correct values.

**Validates: Requirements 3.2, 4.3, 4.4, 6.1, 6.4**

### Property 3: Bbox Validation

*For any* bbox value modification, if any coordinate is outside the range [0, 1], the modification SHALL be rejected and the original value preserved.

**Validates: Requirements 3.3, 3.4**

### Property 4: View Switch Round-trip

*For any* valid CanonicalJSON, switching from JSON View to Graph View and back to JSON View SHALL produce semantically equivalent JSON (same elements and relations, order may differ).

**Validates: Requirements 5.3, 5.4**

### Property 5: Reset Round-trip

*For any* sequence of modifications followed by a reset operation, the resulting data SHALL be equal to the original input data.

**Validates: Requirements 6.3**

### Property 6: Node Panel Field Completeness

*For any* CanonicalElement, when displayed in the Node_Panel, all editable fields (name, description, type, geometry, appearance, constraints) SHALL be present and editable.

**Validates: Requirements 3.1**

## Error Handling

### Validation Errors

| Error Type | Trigger | User Feedback | Recovery |
|------------|---------|---------------|----------|
| Invalid bbox | Coordinate outside [0,1] | Red border + error message | Revert to previous value |
| Invalid JSON | Syntax error in JSON view | Error banner + line highlight | Stay in JSON view |
| Missing required field | Empty name/id | Field highlight + tooltip | Block save until fixed |
| Duplicate element ID | ID collision | Error message | Auto-generate unique ID |
| Invalid relation | Reference to non-existent element | Edge highlight + warning | Remove invalid edge |

### Error Display Strategy

```typescript
interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// 错误显示在对应字段旁边
// 严重错误阻止保存
// 警告允许保存但显示提示
```

## Testing Strategy

### Unit Tests

- 测试数据转换函数 `canonicalToGraph` 和 `graphToCanonical`
- 测试验证函数 `validateBbox`, `validateElement`
- 测试节点位置计算 `calculateInitialPosition`

### Property-Based Tests

使用 fast-check 库进行属性测试：

1. **Graph Rendering Consistency**: 生成随机CanonicalJSON，验证节点/边数量匹配
2. **Data Synchronization**: 生成随机修改操作，验证数据同步
3. **Bbox Validation**: 生成随机bbox值，验证边界检查
4. **View Switch Round-trip**: 生成随机JSON，验证视图切换后数据等价
5. **Reset Round-trip**: 生成随机修改序列，验证重置后数据恢复

### Integration Tests

- 测试完整的编辑流程：打开 -> 编辑 -> 保存
- 测试视图切换流程
- 测试错误处理流程

### Test Configuration

```typescript
// fast-check 配置
const fcConfig = {
  numRuns: 100,  // 每个属性测试运行100次
  seed: Date.now(),
};
```

