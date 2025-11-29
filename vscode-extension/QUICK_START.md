# Design-Learn VSCode 扩展 - 快速开始指南

## 📥 安装方式

### 方式 1：使用 VSIX 文件安装（推荐）

```bash
# 从命令行安装
code --install-extension design-learn-1.0.0.vsix

# 或在 VSCode 中：
# 1. 打开命令面板 (⇧⌘P)
# 2. 搜索 "Extensions: Install from VSIX"
# 3. 选择 design-learn-1.0.0.vsix 文件
```

### 方式 2：本地调试运行

```bash
# 1. 进入扩展目录
cd vscode-extension

# 2. 安装依赖
npm install

# 3. 启动监听编译
npm run watch

# 4. 在 VSCode 中按 F5 启动调试窗口
# （会自动打开一个新的 VSCode 窗口加载该扩展）
```

### 方式 3：从源代码打包

```bash
cd vscode-extension

# 编译 TypeScript
npm run compile

# 全局安装打包工具（如果还没有）
npm install -g @vscode/vsce

# 打包为 VSIX
vsce package

# 或直接发布到 VSCode 市场
vsce publish
```

## 🚀 第一次使用

### 1️⃣ 打开设置面板
- 点击左侧活动栏的 "Design-Learn" 图标
- 或按 ⇧⌘P 搜索 "Design-Learn: 打开设置面板"

### 2️⃣ 配置 AI 模型
1. 在设置面板中选择 "AI 模型" 页面
2. 点击 "添加模型" 按钮
3. 填入您的 AI 配置：
   - **模型名称**：例如 "GPT-4"
   - **API 类型**：选择 OpenAI / Anthropic / 自定义
   - **API 密钥**：输入您的 API Key
   - **Model ID**：例如 "gpt-4" 或 "claude-3-opus"
   - **Base URL（可选）**：仅在使用自定义 API 时需要

### 3️⃣ 配置提取和分析选项
1. 切换到 "生成配置" 页面
2. 根据需要勾选：
   - **提取选项**：内联 CSS、包含图片、包含字体
   - **分析内容**：选择要分析的设计元素
   - **报告语言**：选择输出语言
3. 点击 "保存配置"

### 4️⃣ 开始提取
1. 按 ⇧⌘P 打开命令面板
2. 选择以下命令之一：
   - "Design-Learn: 提取网页设计风格" - 仅提取（无 AI）
   - "Design-Learn: 提取并分析网页设计风格（AI）" - 提取 + AI 分析
3. 输入网页 URL
4. 等待完成（进度会显示在左下角）

## 📁 文件结构

第一次提取后，会自动创建：

```
.designlearn/
├── snapshots/              # 提取的网页快照
│   ├── example.com/
│   │   ├── snapshot-1.html
│   │   ├── snapshot-1.css
│   │   ├── snapshot-1.json
│   │   └── snapshot-1.md   (AI 分析报告)
│   └── ...
├── templates/              # 静态页面模板（可选）
└── rules/                  # 规则和配置（可选）
```

## ⌨️ 常用命令

| 命令 | 快捷方式 |
|------|---------|
| 打开设置面板 | ⇧⌘P → "openSettings" |
| 提取网页 | ⇧⌘P → "extract" |
| 提取 + AI 分析 | ⇧⌘P → "extractWithAI" |
| 刷新快照列表 | ⇧⌘P → "refreshSnapshots" |
| 打开快照文件夹 | 在快照树中右键 → "打开文件夹" |

## 🔧 常见问题

### Q: 如何更新已有的 AI 模型配置？
A: 在设置面板的 "AI 模型" 页面中，点击模型卡片右上角的编辑按钮（铅笔图标）。

### Q: 如何删除模型或模板？
A: 点击模型/模板卡片右上角的删除按钮（垃圾桶图标）。

### Q: 支持哪些 AI 模型？
A: 支持任何兼容 OpenAI API 的模型服务，包括：
- OpenAI GPT-4 系列
- Anthropic Claude 系列
- 本地运行的 LLM（使用 base URL）
- 其他 OpenAI 兼容的 API

### Q: 如何使用自定义提示词？
A:
1. 在设置面板中创建新的提示词模板
2. 标记为 "活跃"
3. 进行 AI 提取时会使用该模板

### Q: 快照保存在哪里？
A: 保存在项目工作区中的 `.designlearn/snapshots/` 目录，可以通过命令 "Design-Learn: 打开 .designlearn/snapshots" 快速打开。

### Q: 如何在不同项目间共享快照？
A: 将 `.designlearn` 目录复制或软链接到其他项目即可。

## 📞 获取帮助

- 📖 完整文档：查看 README.md
- 🐛 报告 Bug：提交 GitHub Issue
- 💡 功能建议：参与 Discussion 或提交 PR

## 🎉 开始体验

现在您已经准备好了！打开一个 VSCode 项目，点击左侧的 Design-Learn 图标开始使用吧！

---

**需要帮助？** 查看完整的 [README.md](./README.md)
