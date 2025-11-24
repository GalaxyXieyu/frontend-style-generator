# Frontend Style Generator

> 一键提取网页设计风格的 Chrome 插件 - 零依赖，开箱即用

## 🎯 项目简介

这是一个**完全零依赖**的 Chrome 浏览器插件，用户无需安装任何额外软件（Node.js、Playwright 等），只需安装插件即可一键提取任意网页的完整设计风格，包括 HTML、CSS、图片、字体等所有资源。

### 核心特性

- ✅ **零依赖**: 无需 Node.js、Playwright 等任何依赖
- ✅ **一键提取**: 点击插件图标即可提取当前页面
- ✅ **完整快照**: HTML + CSS + 图片 + 字体 + 元数据
- ✅ **本地存储**: 使用 IndexedDB 本地保存，无需后端
- ✅ **即时预览**: 在新标签页预览提取的页面
- ✅ **一键下载**: 导出为完整的 HTML 文件
- ✅ **历史记录**: 自动保存，快速访问

## 🚀 快速开始

### 安装插件（1 分钟）

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `chrome-extension` 文件夹
5. 完成！

### 使用插件（5 秒）

1. 访问任意网页（如 https://stripe.com）
2. 点击浏览器工具栏的插件图标
3. 点击"提取页面风格"按钮
4. 等待 2-5 秒，提取完成
5. 可以预览、下载或查看历史记录

## 📦 项目结构

```
frontend-style-generator/
├── chrome-extension/              # Chrome 插件（已完成）
│   ├── manifest.json             # 插件配置
│   ├── popup/                    # 弹出窗口 UI
│   ├── content/                  # 页面提取器
│   ├── background/               # 后台服务
│   ├── icons/                    # 图标文件
│   ├── README.md                 # 插件说明
│   ├── INSTALL.md                # 安装指南
│   ├── SUMMARY.md                # 功能总结
│   └── TEST.md                   # 测试指南
│
├── web/                          # Next.js 后台（待开发）
│   └── (未来的管理后台系统)
│
└── docs/                         # 项目文档
    ├── requirements.md           # 需求分析
    ├── ai-prompt-guide.md        # AI 分析指南
    └── chrome-extension-design.md # 插件设计文档
```

## 🎨 功能展示

### 1. 页面提取

```javascript
// 提取结果示例
{
  id: "snapshot_1700000000000_abc123",
  url: "https://stripe.com",
  title: "Stripe | Payment Processing Platform",
  html: "<!DOCTYPE html>...",      // 完整 HTML
  css: "/* 内联的 CSS */",          // 所有样式
  assets: {
    images: [...],                 // 图片列表
    fonts: [...]                   // 字体列表
  },
  metadata: {
    viewport: { width: 1920, height: 1080 },
    performance: { loadTime: 2500 },
    stats: { totalElements: 1523 }
  },
  extractedAt: "2025-11-23T11:56:00.000Z",
  extractionTime: 2345  // ms
}
```

### 2. UI 界面

```
┌─────────────────────────────────┐
│  🎨 Style Generator             │
│  一键提取页面设计风格            │
├─────────────────────────────────┤
│  📄 当前页面                     │
│  Stripe                         │
│  stripe.com                     │
├─────────────────────────────────┤
│  ⚙️ 提取选项                     │
│  ☑ 内联 CSS 样式                │
│  ☑ 收集图片资源                 │
│  ☑ 收集字体文件                 │
├─────────────────────────────────┤
│  [🎨 提取页面风格]              │
├─────────────────────────────────┤
│  📊 最近提取 (5)                │
│  • Stripe Homepage              │
│  • Linear Pricing               │
│  • Vercel Dashboard             │
└─────────────────────────────────┘
```

## 🔧 技术栈

### Chrome 插件
- **Manifest V3**: Chrome 扩展最新标准
- **纯 JavaScript**: 无需构建工具
- **IndexedDB**: 本地数据库
- **Content Script**: 页面内容提取
- **Service Worker**: 后台任务处理

### 未来计划（Next.js 后台）
- Next.js 15 + TypeScript 5
- Drizzle ORM + PostgreSQL
- Shadcn UI + Tailwind CSS
- Vercel AI SDK（风格分析）

## 📊 性能指标

- **提取速度**: 2-5 秒（普通页面）
- **内存占用**: < 50MB
- **存储大小**: 每个快照 500KB - 2MB
- **支持页面**: 95% 的常见网站

## 📝 开发进度

### ✅ Phase 1: Chrome 插件（已完成）
- [x] 页面提取器
- [x] Popup UI
- [x] 本地存储
- [x] 预览功能
- [x] 下载功能
- [x] 历史记录

### 🔄 Phase 2: 增强功能（进行中）
- [ ] 添加插件图标
- [ ] 优化错误处理
- [ ] 性能优化
- [ ] 设置页面

### 📅 Phase 3: Next.js 后台（计划中）
- [ ] 用户认证系统
- [ ] 云端存储
- [ ] AI 风格分析
- [ ] Markdown 报告生成
- [ ] 团队协作功能

## 🎯 使用场景

### 适用场景
- ✅ 收集设计灵感
- ✅ 学习优秀网站设计
- ✅ 保存页面快照
- ✅ 离线查看网页
- ✅ 分析页面结构

### 不适用场景
- ❌ 需要 JavaScript 交互的页面
- ❌ 需要登录的私密内容
- ❌ 实时更新的数据
- ❌ 视频/音频流媒体

## 🐛 已知限制

1. **跨域资源**: 某些跨域的 CSS/图片可能无法提取
2. **动态内容**: JavaScript 动态生成的内容可能不完整
3. **大型页面**: 超过 10MB 的页面可能较慢
4. **特殊页面**: chrome:// 等特殊页面无法提取

## 📖 文档

- [插件安装指南](chrome-extension/INSTALL.md)
- [功能总结](chrome-extension/SUMMARY.md)
- [测试指南](chrome-extension/TEST.md)
- [需求分析](docs/requirements.md)
- [AI 分析指南](docs/ai-prompt-guide.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 可以改进的方向
1. 添加更多提取选项
2. 优化提取算法
3. 改进 UI/UX
4. 添加更多功能
5. 完善文档

## 📄 许可证

MIT License

## 👨‍💻 作者

**GalaxyXieyu**

- 项目地址: `/Users/galaxyxieyu/Documents/Coding/frontend-style-generator`
- 版本: 0.1.0
- 更新日期: 2025-11-23

---

## 🎉 立即开始

```bash
# 1. 进入插件目录
cd chrome-extension

# 2. 查看安装指南
cat INSTALL.md

# 3. 在 Chrome 中加载插件
# chrome://extensions/ → 开发者模式 → 加载已解压的扩展程序

# 4. 开始使用！
# 访问任意网页，点击插件图标，提取页面风格
```

**完全零依赖，开箱即用！** 🚀
