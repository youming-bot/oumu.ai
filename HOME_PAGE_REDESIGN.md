# 首页重新设计方案

## 设计概述

基于现有的oumu.ai项目架构，重新设计首页以提供更好的用户体验和现代化的界面设计。新设计将保持现有的功能逻辑，同时优化视觉呈现和交互体验。

## 设计原则

1. **保持现有架构**：继续使用Next.js 15 + React 19 + shadcn/ui
2. **响应式设计**：适配移动端、平板和桌面设备
3. **主题一致性**：支持亮色/暗色主题无缝切换
4. **组件复用**：基于现有shadcn/ui组件库进行扩展
5. **状态管理**：继续使用现有的hooks状态管理模式

## 组件架构设计

### 1. 主题系统 (Theme System)

```typescript
// src/components/theme-provider.tsx
// 新增主题Provider，支持亮色/暗色主题
```

**CSS变量定义**：
```css
/* 亮色主题 */
:root {
  --background-color: #fff7e3;
  --text-color: #5c9d52;
  --card-background-color: #ffffff;
  --border-color: #e5e7eb;
  --button-color: #5c9d52;
  --button-text-color: #ffffff;
  --button-hover-color: #4a7e42;
  --inactive-icon-color: #a5d6a7;
}

/* 暗色主题 */
.dark {
  --background-color: #1e3432;
  --text-color: #fff7e3;
  --card-background-color: rgb(55, 70, 79);
  --border-color: #4b5563;
  --button-color: #84cc16;
  --button-text-color: #1e3432;
  --button-hover-color: #65a30d;
  --button-shadow-color: #4d7c0f;
}
```

### 2. 导航组件 (Navigation)

```typescript
// src/components/navigation.tsx
// 固定在顶部的圆形导航菜单
```

**功能特性**：
- 固定定位在页面顶部中央
- 圆形按钮设计，支持图标和头像
- 响应式设计，适配不同屏幕尺寸
- 支持主题切换按钮

### 3. 统计卡片组件 (StatsCards)

```typescript
// src/components/stats-cards.tsx
// 显示文件统计信息的卡片组件
```

**卡片内容**：
- 已上传文件数量
- 总音频时长
- 当前处理状态

**设计特点**：
- 使用CSS Grid布局
- 悬停效果和动画
- 响应式设计（移动端单列，平板双列，桌面三列）

### 4. 文件上传区域 (FileUploadArea)

```typescript
// src/components/file-upload-area.tsx
// 重新设计的文件上传区域
```

**功能特性**：
- 拖拽上传支持
- 文件选择按钮
- 上传进度显示
- 错误状态处理

**设计特点**：
- 虚线边框设计
- 居中对齐的图标和文字
- 响应式尺寸适配

### 5. 文件列表组件 (FileList)

```typescript
// src/components/file-list-new.tsx
// 重新设计的文件列表组件
```

**文件卡片设计**：
- 文件图标（根据文件类型显示不同图标）
- 文件名和状态信息
- 操作按钮（播放、重试、删除）
- 处理进度显示

**状态图标**：
- ✅ 成功状态（绿色勾选图标）
- ⚠️ 失败状态（橙色警告图标）
- 🔄 处理中（蓝色加载动画）

## 响应式设计

### 断点设置
- **移动端**：默认单列布局
- **平板**：768px以上双列布局
- **桌面**：1024px以上三列布局

### 布局适配
```css
/* 移动端 */
.grid {
  grid-template-columns: 1fr;
}

/* 平板 */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 桌面 */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## 动画和交互效果

### 1. 悬停效果
- 统计卡片悬停时上移效果
- 按钮悬停时颜色变化
- 文件卡片悬停时阴影效果

### 2. 点击效果
- 按钮点击时的下压效果
- 卡片点击时的缩放效果

### 3. 加载动画
- 文件处理中的旋转动画
- 上传进度条动画

## 颜色方案

### 亮色主题
- **主色调**：#5c9d52（绿色）
- **背景色**：#fff7e3（浅黄色）
- **文字色**：#4a4a4a（深灰色）
- **边框色**：#e5e7eb（浅灰色）

### 暗色主题
- **主色调**：#84cc16（酸橙色）
- **背景色**：#1e3432（深绿色）
- **文字色**：#fff7e3（浅黄色）
- **边框色**：#4b5563（灰色）

## 图标系统

使用 Material Symbols 图标库：
- 文件图标：`mic`, `graphic_eq`, `subtitles`
- 状态图标：`check_circle`, `warning`, `cloud_upload`
- 操作图标：`play_arrow`, `delete`, `replay`
- 导航图标：`home`, `settings`, `account_circle`, `dark_mode`

## 实现计划

### 第一阶段：基础组件
1. 创建主题Provider
2. 实现导航组件
3. 设计统计卡片组件

### 第二阶段：核心功能
1. 重新设计文件上传区域
2. 创建新的文件列表组件
3. 集成现有的文件管理功能

### 第三阶段：优化和完善
1. 添加响应式设计
2. 实现动画效果
3. 性能优化和测试

## 技术实现细节

### 1. 组件结构
```
src/
├── components/
│   ├── theme-provider.tsx          # 主题Provider
│   ├── navigation.tsx              # 导航组件
│   ├── stats-cards.tsx             # 统计卡片
│   ├── file-upload-area.tsx        # 文件上传区域
│   ├── file-list-new.tsx           # 新文件列表
│   └── file-card-new.tsx           # 新文件卡片
└── app/
    └── page.tsx                     # 主页面（更新）
```

### 2. 状态管理
- 继续使用现有的 `useAppState` hook
- 集成主题切换状态
- 保持文件管理状态逻辑不变

### 3. 样式集成
- 扩展现有的 Tailwind CSS 配置
- 添加新的CSS变量
- 保持与现有shadcn/ui组件的兼容性

### 4. 数据流
- 保持现有的 IndexedDB 数据结构
- 继续使用现有的文件上传和转录API
- 维护现有的状态管理模式

## 兼容性考虑

### 1. 向后兼容
- 保持现有的API接口不变
- 维护现有的数据结构
- 确保现有功能正常工作

### 2. 渐进式升级
- 可以逐步替换组件
- 支持新旧组件并存
- 提供迁移路径

### 3. 测试策略
- 确保所有现有测试通过
- 为新组件添加单元测试
- 进行集成测试验证

这个设计方案充分利用了现有的项目架构，同时提供了现代化的用户界面设计。通过分阶段实施，可以确保项目的稳定性和可维护性。