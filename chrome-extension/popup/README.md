# Popup 模块拆分说明

## 📁 文件结构

```
popup/
├── styles/              # CSS 样式文件
│   ├── variables.css    # 全局变量和基础样式 (66行)
│   ├── main.css         # 主页面样式 (567行)
│   └── modal.css        # 任务队列弹窗样式 (444行)
├── js/                  # JavaScript 模块
│   ├── TaskManager.js   # 任务管理模块 (433行)
│   ├── QueueController.js # 队列控制模块 (194行)
│   └── PopupController.js # 主控制器 (435行)
├── popup.html           # 主页面
├── popup.css.bak        # 原始CSS文件备份 (1078行)
└── popup.js.bak         # 原始JS文件备份 (1038行)
```

## 🎯 拆分目的

### 原文件规模
- **popup.css**: 1078 行
- **popup.js**: 1038 行

### 拆分优势
1. **代码组织更清晰** - 按功能模块分离，易于查找和维护
2. **降低文件复杂度** - 每个文件专注于单一职责
3. **提升开发效率** - 多人协作时减少冲突
4. **便于代码复用** - 模块化设计，组件可独立使用

## 📋 CSS 文件说明

### `styles/variables.css` (66行)
**职责**: 全局变量和基础样式
- CSS变量定义（颜色、渐变、阴影、圆角等）
- 全局重置样式
- body 和 container 基础样式
- 滚动条样式

### `styles/main.css` (567行)
**职责**: 主页面样式
- 头部（header）样式
- Logo 和导航
- 模式选择器
- URL 输入区域
- 立即提取按钮
- 提取选项
- 模型选择器
- 页面卡片
- 最近提取列表

### `styles/modal.css` (444行)
**职责**: 任务队列弹窗样式
- 弹窗容器和遮罩
- 弹窗头部和尾部
- 按钮样式（继续、暂停、清除）
- 任务列表样式
- 任务项样式和状态
- 自定义复选框
- 任务统计
- 新增任务输入框

## 💻 JS 模块说明

### `js/TaskManager.js` (433行)
**职责**: 任务管理相关功能

#### 核心方法
- `loadTasks()` - 加载任务列表
- `displayTasks(tasks)` - 显示任务列表（包含域名分组）
- `createAddTaskInput(domain)` - 创建新增任务输入框
- `createTaskItem(task)` - 创建单个任务项
- `updateStats()` - 更新统计信息
- `addNewTask(domain, inputElement)` - 新增任务
- `editTask(task)` - 编辑任务

#### 特性
- 支持按域名分组显示任务
- 每个域名分组内可添加新任务
- 支持路径自动补全（输入 `/path` 自动补全为完整 URL）

### `js/QueueController.js` (194行)
**职责**: 队列控制相关功能

#### 核心方法
- `clearCompleted()` - 清除已完成任务
- `clearSelected()` - 清除选中的任务
- `toggleSelectAll()` - 全选/取消全选
- `updateClearButton()` - 更新清除按钮文本
- `updateSelectAllButton()` - 更新全选按钮文本
- `updateQueueState()` - 更新队列状态（暂停/继续）
- `pauseQueue()` - 暂停队列
- `resumeQueue()` - 继续队列

#### 特性
- 智能识别清除模式（选中优先）
- 实时更新按钮状态
- 支持队列暂停/继续控制

### `js/PopupController.js` (435行)
**职责**: 主控制器，协调各模块

#### 核心方法
- `init()` - 初始化应用
- `displayPageInfo(tab)` - 显示页面信息
- `loadConfig()` - 加载配置
- `displayModelSelector()` - 显示模型选择器
- `bindEvents()` - 绑定所有事件
- `switchMode(mode)` - 切换模式（当前页面/所有页面）
- `openTasksModal()` / `closeTasksModal()` - 打开/关闭任务弹窗
- `extract()` - 执行提取
- `extractCurrent()` - 提取当前页面
- `extractAll()` - 提取所有页面
- `listenTaskUpdates()` - 监听任务更新
- `showNotification()` - 显示通知

#### 模块协调
```javascript
constructor() {
  // 初始化子模块
  this.taskManager = new TaskManager(this);
  this.queueController = new QueueController(this);
}
```

## 🔗 模块依赖关系

```
PopupController (主控制器)
    ├── TaskManager (任务管理)
    │   └── 调用 QueueController 的方法
    └── QueueController (队列控制)
        └── 调用 TaskManager 的方法
```

### 加载顺序
HTML 中的脚本加载顺序很重要：
```html
<script src="js/TaskManager.js"></script>       <!-- 1. 先加载子模块 -->
<script src="js/QueueController.js"></script>   <!-- 2. 再加载另一个子模块 -->
<script src="js/PopupController.js"></script>   <!-- 3. 最后加载主控制器 -->
```

## ✅ 验证清单

拆分后需要验证的功能：

### 基础功能
- [ ] 页面正常加载
- [ ] 样式显示正确
- [ ] 模式切换正常

### 任务管理
- [ ] 任务列表显示正常
- [ ] 域名分组功能正常
- [ ] 新增任务功能正常
- [ ] 任务进度显示正常

### 队列控制
- [ ] 暂停/继续功能正常
- [ ] 全选/取消全选正常
- [ ] 清除任务功能正常
- [ ] 按钮状态更新正常

### 提取功能
- [ ] 当前页面提取正常
- [ ] 所有页面提取正常
- [ ] 自定义 URL 提取正常

## 📝 维护建议

### 添加新功能时
1. **CSS**: 根据功能所属，添加到对应的 CSS 文件
   - 全局变量 → `variables.css`
   - 主页面相关 → `main.css`
   - 弹窗相关 → `modal.css`

2. **JavaScript**: 根据职责，添加到对应的模块
   - 任务相关 → `TaskManager.js`
   - 队列控制 → `QueueController.js`
   - 主流程控制 → `PopupController.js`

### 代码规范
- 保持模块单一职责
- 通过主控制器协调模块间交互
- 避免循环依赖
- 添加必要的注释说明

## 🔄 回退方案

如需回退到原始版本：
```bash
cd chrome-extension/popup
mv popup.css.bak popup.css
mv popup.js.bak popup.js
```

然后在 `popup.html` 中恢复原始引用：
```html
<link rel="stylesheet" href="popup.css">
<script src="popup.js"></script>
```

---

**拆分日期**: 2025-11-24  
**版本**: 1.0
