# Implementation Plan: JSON Graph Editor

## Overview

将现有JSON编辑器升级为可视化关系图谱编辑器。采用增量开发方式，先实现核心图谱渲染，再逐步添加交互和编辑功能。

## Tasks

- [x] 1. 安装依赖和项目配置
  - 安装 @vue-flow/core 和 @vue-flow/background
  - 安装 fast-check 用于属性测试
  - _Requirements: 技术基础设施_

- [x] 2. 实现数据转换层
  - [x] 2.1 创建 `client/src/utils/graphTransform.ts`
    - 实现 `canonicalToGraph` 函数：CanonicalJSON -> Vue Flow格式
    - 实现 `graphToCanonical` 函数：Vue Flow格式 -> CanonicalJSON
    - 实现 `calculateInitialPosition` 函数：根据bbox计算节点位置
    - _Requirements: 1.1, 1.2, 6.4_
  - [ ]* 2.2 编写数据转换属性测试
    - **Property 1: Graph Rendering Consistency**
    - **Validates: Requirements 1.1, 1.2**

- [x] 3. 实现验证层
  - [x] 3.1 创建 `client/src/utils/graphValidation.ts`
    - 实现 `validateBbox` 函数：验证bbox坐标在[0,1]范围
    - 实现 `validateElement` 函数：验证元素完整性
    - 实现 `validateRelation` 函数：验证关系引用有效性
    - _Requirements: 3.3, 3.4_
  - [ ]* 3.2 编写验证属性测试
    - **Property 3: Bbox Validation**
    - **Validates: Requirements 3.3, 3.4**

- [x] 4. Checkpoint - 确保数据层测试通过
  - 确保所有测试通过，如有问题请询问用户

- [x] 5. 实现自定义节点组件
  - [x] 5.1 创建 `client/src/components/project/graph/ElementNode.vue`
    - 根据元素类型显示不同颜色和图标
    - 显示元素名称
    - 支持选中状态高亮
    - 提供连接点用于创建关系
    - _Requirements: 1.3, 2.3_

- [x] 6. 实现自定义边组件
  - [x] 6.1 创建 `client/src/components/project/graph/RelationEdge.vue`
    - 根据关系类型显示不同样式
    - 显示关系类型标签
    - 支持点击选中
    - _Requirements: 1.4, 4.2_

- [x] 7. 实现图谱画布组件
  - [x] 7.1 创建 `client/src/components/project/graph/GraphCanvas.vue`
    - 集成Vue Flow
    - 注册自定义节点和边类型
    - 实现节点拖拽
    - 实现画布缩放和平移
    - 实现节点/边点击事件
    - _Requirements: 1.5, 2.1, 2.2, 7.1, 7.2_

- [x] 8. 实现节点详情面板
  - [x] 8.1 创建 `client/src/components/project/graph/NodeDetailPanel.vue`
    - 实现基本信息编辑（name, description, type）
    - 实现几何信息编辑（bbox, polygon, depth_hint）
    - 实现外观编辑（material, color, texture, text）
    - 实现约束编辑（keep_identity, preserve_text_legibility）
    - 实现关系列表显示和管理
    - _Requirements: 3.1, 3.2, 3.5_
  - [ ]* 8.2 编写面板字段完整性测试
    - **Property 6: Node Panel Field Completeness**
    - **Validates: Requirements 3.1**

- [x] 9. 实现视图切换组件
  - [x] 9.1 创建 `client/src/components/project/graph/ViewSwitcher.vue`
    - 实现Graph View和JSON View切换按钮
    - 切换时验证数据有效性
    - _Requirements: 5.1, 5.4, 5.5_

- [x] 10. 实现关系类型选择器
  - [x] 10.1 创建 `client/src/components/project/graph/RelationTypeSelector.vue`
    - 显示四种关系类型选项
    - 支持键盘选择
    - _Requirements: 4.1_

- [x] 11. Checkpoint - 确保组件渲染正常
  - 确保所有组件能正常渲染，如有问题请询问用户

- [x] 12. 实现主编辑器组件
  - [x] 12.1 创建 `client/src/components/project/GraphJsonEditor.vue`
    - 集成所有子组件
    - 实现视图切换逻辑
    - 实现数据双向同步
    - 实现保存/重置功能
    - 实现修改状态追踪
    - _Requirements: 5.2, 5.3, 6.1, 6.2, 6.3_
  - [ ]* 12.2 编写数据同步属性测试
    - **Property 2: Data Synchronization Integrity**
    - **Validates: Requirements 3.2, 4.3, 4.4, 6.1, 6.4**
  - [ ]* 12.3 编写视图切换往返测试
    - **Property 4: View Switch Round-trip**
    - **Validates: Requirements 5.3, 5.4**
  - [ ]* 12.4 编写重置往返测试
    - **Property 5: Reset Round-trip**
    - **Validates: Requirements 6.3**

- [x] 13. 集成到项目视图
  - [x] 13.1 更新 `client/src/views/ProjectView.vue`
    - 替换JsonEditor为GraphJsonEditor
    - 保持现有的保存逻辑
    - _Requirements: 集成_

- [x] 14. 实现画布控制按钮
  - [x] 14.1 在GraphCanvas中添加控制按钮
    - 添加Zoom In/Out按钮
    - 添加Fit to View按钮
    - 添加Reset View按钮
    - _Requirements: 7.3, 7.4_

- [x] 15. Final Checkpoint - 完整功能验证
  - 确保所有功能正常工作
  - 确保所有测试通过
  - 如有问题请询问用户

## Notes

- 任务标记 `*` 为可选测试任务，可跳过以加快MVP开发
- 每个任务都引用了具体的需求条款以便追溯
- Checkpoint任务用于阶段性验证
- 属性测试验证核心正确性属性
