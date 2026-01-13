# Requirements Document

## Introduction

将现有的JSON编辑器升级为可视化关系图谱编辑器，让用户能够以图形化方式查看和编辑CanonicalJSON中的元素及其关系。用户可以通过点击节点查看/编辑元素详情，通过连线表示元素间的关系，所有修改自动同步到JSON数据，同时保留原始JSON查看功能。

## Glossary

- **Graph_Editor**: 关系图谱编辑器组件，负责渲染和管理图谱视图
- **Node**: 图谱中的节点，代表CanonicalJSON中的一个Element
- **Edge**: 图谱中的连线，代表CanonicalJSON中的一个Relation
- **Node_Panel**: 节点详情面板，用于编辑单个元素的配置
- **Canvas**: 图谱画布，承载节点和连线的可交互区域
- **View_Switcher**: 视图切换器，用于在图谱视图和JSON视图之间切换

## Requirements

### Requirement 1: 图谱视图渲染

**User Story:** As a user, I want to see JSON elements displayed as a visual graph, so that I can understand the structure and relationships at a glance.

#### Acceptance Criteria

1. WHEN the Graph_Editor receives CanonicalJSON data, THE Graph_Editor SHALL render each element as a Node on the Canvas
2. WHEN the Graph_Editor receives CanonicalJSON data, THE Graph_Editor SHALL render each relation as an Edge connecting the corresponding Nodes
3. THE Node SHALL display the element's name and type with distinct visual styling based on element type (subject, object, text, background, effect)
4. THE Edge SHALL display the relation type (occludes, attached_to, in_front_of, part_of) with distinct visual styling
5. WHEN the Canvas is rendered, THE Graph_Editor SHALL automatically layout Nodes to minimize edge crossings and provide clear visibility

### Requirement 2: 节点交互

**User Story:** As a user, I want to interact with graph nodes, so that I can view and edit element details.

#### Acceptance Criteria

1. WHEN a user clicks on a Node, THE Graph_Editor SHALL open the Node_Panel displaying the element's full configuration
2. WHEN a user drags a Node, THE Graph_Editor SHALL update the Node's position on the Canvas in real-time
3. WHEN a user hovers over a Node, THE Graph_Editor SHALL highlight the Node and its connected Edges
4. WHEN a user double-clicks on a Node, THE Graph_Editor SHALL enable inline editing of the element's name

### Requirement 3: 节点详情编辑

**User Story:** As a user, I want to edit element details through a panel, so that I can modify element configurations without editing raw JSON.

#### Acceptance Criteria

1. WHEN the Node_Panel is opened, THE Node_Panel SHALL display all editable fields of the element (name, description, type, geometry, appearance, constraints)
2. WHEN a user modifies a field in the Node_Panel, THE Graph_Editor SHALL update the corresponding CanonicalJSON data immediately
3. WHEN a user modifies geometry.bbox in the Node_Panel, THE Graph_Editor SHALL validate that values are within valid ranges (0-1 for normalized coordinates)
4. IF a user enters invalid data in the Node_Panel, THEN THE Node_Panel SHALL display an error message and prevent the invalid change from being applied
5. WHEN a user clicks outside the Node_Panel or presses Escape, THE Node_Panel SHALL close

### Requirement 4: 关系管理

**User Story:** As a user, I want to manage relationships between elements, so that I can define how elements interact with each other.

#### Acceptance Criteria

1. WHEN a user drags from one Node's connection point to another Node, THE Graph_Editor SHALL create a new Edge and prompt for relation type selection
2. WHEN a user clicks on an Edge, THE Graph_Editor SHALL display options to change the relation type or delete the Edge
3. WHEN a user deletes an Edge, THE Graph_Editor SHALL remove the corresponding relation from CanonicalJSON
4. WHEN a user creates a new Edge, THE Graph_Editor SHALL add the corresponding relation to CanonicalJSON

### Requirement 5: 视图切换

**User Story:** As a user, I want to switch between graph view and JSON view, so that I can use the most appropriate editing method for my task.

#### Acceptance Criteria

1. THE View_Switcher SHALL provide toggle buttons for "Graph View" and "JSON View"
2. WHEN a user switches from Graph View to JSON View, THE Graph_Editor SHALL display the current CanonicalJSON in the Monaco editor
3. WHEN a user switches from JSON View to Graph View, THE Graph_Editor SHALL parse the JSON and render the updated graph
4. WHEN a user makes changes in JSON View, THE Graph_Editor SHALL validate the JSON before allowing switch to Graph View
5. IF the JSON is invalid when switching to Graph View, THEN THE Graph_Editor SHALL display an error and remain in JSON View

### Requirement 6: 数据同步与保存

**User Story:** As a user, I want my graph edits to be saved, so that I can persist my changes.

#### Acceptance Criteria

1. WHEN a user makes any change in Graph View, THE Graph_Editor SHALL mark the data as modified
2. WHEN a user clicks the Save button, THE Graph_Editor SHALL emit the updated CanonicalJSON for persistence
3. WHEN a user clicks the Reset button, THE Graph_Editor SHALL revert all changes to the last saved state
4. THE Graph_Editor SHALL maintain bidirectional sync between graph representation and JSON data

### Requirement 7: 画布操作

**User Story:** As a user, I want to navigate and manipulate the canvas, so that I can work with complex graphs effectively.

#### Acceptance Criteria

1. WHEN a user scrolls on the Canvas, THE Canvas SHALL zoom in or out centered on the cursor position
2. WHEN a user drags on empty Canvas space, THE Canvas SHALL pan the view
3. WHEN a user clicks the "Fit to View" button, THE Canvas SHALL adjust zoom and position to show all Nodes
4. WHEN a user clicks the "Reset View" button, THE Canvas SHALL reset to default zoom level and center position
