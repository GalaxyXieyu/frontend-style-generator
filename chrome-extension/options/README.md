# Options 页面架构说明

## 📁 目录结构

```
options/
├── js/
│   ├── components/          # UI 组件
│   │   ├── ModelManager.js      # AI 模型管理组件
│   │   └── PromptPreview.js     # 提示词预览组件
│   ├── utils/              # 工具模块
│   │   ├── storage.js          # Storage 管理
│   │   └── notification.js     # 通知工具
│   └── main.js             # 主控制器
├── options.html            # HTML 结构
├── options.css             # 样式文件
└── README.md              # 本文档
```

## 🎯 设计原则

### 1. **模块化**
- 每个功能独立成模块
- 通过 ES6 Module 导入导出
- 降低耦合度，提高可维护性

### 2. **组件化**
- UI 组件独立管理自己的状态和逻辑
- 组件间通过事件和回调通信
- 易于测试和复用

### 3. **单一职责**
- 每个模块只负责一个功能
- Storage 只管数据存取
- Notification 只管通知显示
- ModelManager 只管模型 CRUD

## 📦 模块说明

### Storage Manager (`utils/storage.js`)
**职责:** 统一管理 Chrome Storage 和 IndexedDB

**主要方法:**
- `getConfig(keys)` - 获取配置
- `setConfig(data)` - 保存配置
- `getAllSnapshots()` - 获取所有快照
- `getSnapshotCount()` - 获取快照数量
- `calculateStorageSize()` - 计算存储大小

### Notification (`utils/notification.js`)
**职责:** 显示 Toast 通知

**主要方法:**
- `Notification.success(message)` - 成功提示
- `Notification.error(message)` - 错误提示
- `Notification.info(message)` - 信息提示

### ModelManager (`components/ModelManager.js`)
**职责:** AI 模型的增删改查和 UI 渲染

**主要功能:**
- 多模型卡片式管理
- 添加/编辑/删除模型
- 设置默认模型
- 测试模型连接

**数据结构:**
```javascript
{
  id: string,           // 唯一标识
  name: string,         // 模型名称
  apiKey: string,       // API Key
  baseUrl: string,      // Base URL
  modelId: string,      // 模型 ID
  temperature: number,  // 温度参数
  maxTokens: number,    // 最大 Token 数
  isDefault: boolean    // 是否默认
}
```

### PromptPreview (`components/PromptPreview.js`)
**职责:** 根据配置生成和显示 AI 提示词

**主要功能:**
- 实时生成提示词
- 监听配置变化
- 支持中英文切换

### Main Controller (`main.js`)
**职责:** 整合所有模块，管理页面导航和全局状态

**主要功能:**
- 初始化所有组件
- 页面路由管理
- 历史记录管理
- 数据导入导出

## 🔄 数据流

```
用户操作
   ↓
组件事件处理
   ↓
Storage Manager (数据持久化)
   ↓
组件状态更新
   ↓
UI 重新渲染
```

## 🚀 如何扩展

### 添加新组件

1. 在 `js/components/` 创建新组件文件
2. 导出组件类
3. 在 `main.js` 中导入和初始化

示例:
```javascript
// js/components/NewComponent.js
export class NewComponent {
  constructor() {
    this.init();
  }
  
  async init() {
    // 初始化逻辑
  }
}

// js/main.js
import { NewComponent } from './components/NewComponent.js';

class OptionsApp {
  async initComponents() {
    this.newComponent = new NewComponent();
  }
}
```

### 添加新工具模块

1. 在 `js/utils/` 创建新工具文件
2. 导出工具类或函数
3. 在需要的地方导入使用

## 🐛 调试技巧

### 1. 使用 Chrome DevTools
```javascript
// 在组件中添加调试日志
console.log('[ModelManager] 当前模型:', this.models);
```

### 2. 查看 Storage 数据
```javascript
// 在 Console 中执行
chrome.storage.local.get(null, (data) => console.log(data));
```

### 3. 查看 IndexedDB 数据
- 打开 DevTools → Application → IndexedDB → StyleGenerator

## 📝 注意事项

1. **ES6 Module 语法**
   - 必须使用 `type="module"` 加载
   - 支持 `import/export`
   - 自动启用严格模式

2. **Chrome Extension 限制**
   - 不能使用 `eval()`
   - 不能使用内联脚本
   - 需要在 manifest.json 中声明权限

3. **异步操作**
   - Storage API 都是异步的
   - 使用 `async/await` 处理
   - 注意错误处理

## 🔧 维护建议

1. **保持模块独立**
   - 避免循环依赖
   - 明确模块边界
   - 减少全局变量

2. **统一代码风格**
   - 使用 ESLint
   - 遵循命名规范
   - 添加必要注释

3. **测试覆盖**
   - 为核心模块编写单元测试
   - 测试边界情况
   - 模拟 Chrome API

## 📚 参考资料

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## 🎨 UI 优化日志

### v3.0.1 - 2024-11-24
**优化历史与数据页面布局**

**改进内容：**
1. 合并"数据备份与恢复"和"数据管理"为单个卡片
2. 使用网格布局 (Grid) 让按钮自动排列
3. 响应式设计：
   - 桌面端：4列网格自适应
   - 平板端：2列网格
   - 手机端：单列布局
4. 改进视觉层次，减少卡片数量，界面更简洁

**技术实现：**
- 使用 `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` 实现响应式网格
- 媒体查询适配不同屏幕尺寸
- 保持按钮样式一致性，视觉更统一
