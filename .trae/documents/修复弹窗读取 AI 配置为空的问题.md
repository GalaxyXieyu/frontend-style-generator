## 根因分析
- 设置页使用 `StorageManager` 以 `sg_` 前缀写入，如 `sg_aiModels`、`sg_generateConfig`（chrome-extension/options/js/utils/storage.js:10）。
- 弹窗与分析器直接读取未加前缀的键，导致读不到配置：
  - `chrome-extension/popup/js/PopupController.js:71` 读取 `aiModels`。
  - `chrome-extension/lib/ai-analyzer.js:14` 读取 `aiModels`、`generateConfig`。
- 结果：弹窗判定为“未配置”，出现空态（`chrome-extension/popup/js/PopupController.js:90-103`）。

## 修复方案（向后兼容）
- 统一读取逻辑，兼容旧键与新键：
  1. 弹窗：`loadConfig()` 改为同时读取 `['aiModels','sg_aiModels','generateConfig','sg_generateConfig']`，优先使用带前缀的值。
  2. 分析器：`AIAnalyzer.loadConfig()` 同样兼容两种键，选择默认模型与生成配置。
- 保留现有写入（仍由设置页写入 `sg_*`），避免双写；读取层面提供兼容即可。

## 具体改动
- `chrome-extension/popup/js/PopupController.js`
  - 将第 `71-77` 行修改为：
    - `const result = await chrome.storage.local.get(['aiModels','sg_aiModels','generateConfig','sg_generateConfig']);`
    - `const aiModels = result.sg_aiModels || result.aiModels || [];`
    - `const defaultModel = aiModels.find(m => m.isDefault) || aiModels[0] || null;`
- `chrome-extension/lib/ai-analyzer.js`
  - 将第 `14-21` 行修改为：
    - 同时读取 `['aiModels','sg_aiModels','generateConfig','sg_generateConfig']`。
    - 组装 `this.config = { ai: defaultModel || {}, generate: result.sg_generateConfig || result.generateConfig || {} }`。

## 验证步骤
- 在设置页新增/编辑模型并设为默认，确认已写入 `sg_aiModels`。
- 打开弹窗应显示模型卡片而非空态；点击可跳转设置。
- 运行一次分析流程，确认能使用默认模型与生成配置。

## 后续优化（可选）
- 抽取 `StorageManager` 为共享工具，弹窗也使用统一封装；逐步去除对非前缀键的读取。