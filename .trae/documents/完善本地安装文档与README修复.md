## 更新范围
- 完整补齐“本地安装”与首次使用说明，面向普通用户与开发者
- 修复 README 中指向不存在文档的链接
- 保留现有结构与风格，避免不必要的文件新增

## 现状与问题
- 根 README 已有“极简安装步骤”，但指向的文档不存在：
  - `chrome-extension/INSTALL.md`（README.md:261-268 引用）不存在
  - `chrome-extension/SUMMARY.md`、`chrome-extension/TEST.md`也不存在
- 实际扩展路径为 `chrome-extension/`，入口 `manifest.json` 已就绪（chrome-extension/manifest.json:1-45）

## 拟做修改
1. 在根 `README.md` 中扩充“本地安装”章节
   - 浏览器要求：Chrome 115+，Manifest v3；兼容 Edge/Brave（给出对应入口）
   - 安装步骤：`chrome://extensions/` → 开启开发者模式 → 加载已解压 → 选择 `chrome-extension` 目录
   - 安装验证：扩展页显示 `Design-Learn v3.0.0`、图标可见、Service Worker 正常
   - 首次配置：通过扩展选项页设置 AI API Key、模型、生成配置
   - 更新与重载：代码改动后点击“重新加载”，内容脚本需刷新页面；Service Worker重启说明
   - 权限说明：`activeTab`、`storage`、`downloads`
   - 卸载与清理：如何移除扩展与数据
   - 常见问题与排错：
     - 未显示图标/加载失败（目录选择错误、未开启开发者模式、Manifest错误）
     - 内容脚本不生效（特殊页面如 `chrome://`、需刷新）
     - AI 调用失败（未配置密钥/模型；网络/跨域限制）
     - Service Worker 状态与日志查看
   - 兼容浏览器差异：Edge 使用 `edge://extensions/`；Brave 使用 `brave://extensions/`
2. 修复 README 的“文档”索引
   - 移除指向不存在的 `chrome-extension/INSTALL.md`、`SUMMARY.md`、`TEST.md`
   - 保留有效文档链接：`chrome-extension/options/TEMPLATE_FEATURE.md`、`docs/requirements.md`、`docs/ai-prompt-guide.md`、`docs/chrome-extension-design.md`
3. 不新增文件，直接在 README 就地完善，确保零跳转即可完成安装

## 输出内容要点（示例结构）
- 前提条件与兼容性
- 本地安装步骤（带路径与按钮名称）
- 安装成功验证
- 首次使用配置（进入 Options、设置 API Key 等）
- 更新与重载说明（Service Worker/内容脚本）
- 权限列表与用途
- 常见问题与排错
- Edge/Brave 安装入口说明

## 验证方式
- 按文档操作，在本机完成一次“加载已解压”与“提取页面+AI分析”的端到端流程
- 在扩展页确认版本号与图标、查看控制台日志是否正常

## 可选增强（如你同意）
- 补充 2 张示意图（开发者模式入口、加载已解压按钮）
- 增加“隐私与数据存储”一节，说明本地存储范围与不上传云端

确认后，我将直接更新根 `README.md`，并移除失效链接，交付完整的本地安装与使用指南。