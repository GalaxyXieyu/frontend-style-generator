/**
 * AI 风格分析器 - Node.js 版本
 * 复用 Chrome Extension 的 AI 分析逻辑
 */

import https from 'https';
import http from 'http';

/**
 * 使用原生 https 模块发送请求（解决代理环境下 fetch 不稳定问题）
 */
function httpRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 180000
    };

    const req = lib.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    if (body) req.write(body);
    req.end();
  });
}

export class AIAnalyzer {
  constructor(config = {}) {
    // 判断使用哪种 API 提供商
    const provider = config.provider || process.env.AI_PROVIDER || 'openai';
    
    this.config = {
      provider,
      // OpenAI 配置
      baseUrl: config.baseUrl || process.env.AI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: config.apiKey || process.env.AI_API_KEY,
      modelId: config.modelId || process.env.AI_MODEL_ID || 'gpt-4o',
      // Azure 配置
      azureEndpoint: config.azureEndpoint || process.env.AZURE_ENDPOINT,
      azureDeployment: config.azureDeployment || process.env.AZURE_DEPLOYMENT,
      azureApiVersion: config.azureApiVersion || process.env.AZURE_API_VERSION || '2024-02-15-preview',
      azureApiKey: config.azureApiKey || process.env.AZURE_API_KEY,
      // 通用配置
      maxTokens: parseInt(config.maxTokens || process.env.AI_MAX_TOKENS || '8000'),
      temperature: parseFloat(config.temperature || process.env.AI_TEMPERATURE || '0.3'),
      language: config.language || process.env.LANGUAGE || 'zh-CN',
      maxInputTokens: parseInt(config.maxInputTokens || '128000')
    };

    this.OUTPUT_TOKEN_RESERVE = 8000;
    this.SYSTEM_PROMPT_RESERVE = 3000;
  }

  /**
   * 估算 token 数量
   */
  estimateTokens(text) {
    if (!text) return 0;
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5) + Math.ceil(otherChars / 4);
  }

  /**
   * 分析单个快照
   */
  async analyze(snapshot) {
    this.validateConfig();

    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.buildUserPrompt(snapshot);
    const response = await this.callAI(systemPrompt, userPrompt);
    const markdown = this.wrapMarkdownReport(snapshot, response);

    return { analysis: { raw: true, content: response }, markdown, format: 'markdown' };
  }

  /**
   * 验证配置
   */
  validateConfig() {
    const { provider, apiKey, azureApiKey } = this.config;
    if (provider === 'azure') {
      if (!azureApiKey) {
        throw new Error('请在 .env 中配置 AZURE_API_KEY');
      }
    } else {
      if (!apiKey) {
        throw new Error('请在 .env 中配置 AI_API_KEY');
      }
    }
  }

  /**
   * 批量分析多个快照
   * @param {Array} snapshots - 快照数组
   * @param {Object} options - 选项
   * @param {string} options.screenshotRelDir - 截图相对目录名
   */
  async analyzeBatch(snapshots, options = {}) {
    const { screenshotRelDir = null } = options;
    
    this.validateConfig();

    const systemPrompt = this.getSystemPrompt();
    const availableTokens = this.config.maxInputTokens - this.OUTPUT_TOKEN_RESERVE - this.SYSTEM_PROMPT_RESERVE - this.estimateTokens(systemPrompt);

    const { selectedSnapshots, htmlLimit, cssLimit } = this.calculateBatchLimits(snapshots, availableTokens);
    const userPrompt = this.buildBatchPrompt(selectedSnapshots, htmlLimit, cssLimit);

    const response = await this.callAI(systemPrompt, userPrompt);
    const markdown = this.wrapBatchMarkdownReport(
      selectedSnapshots, 
      response, 
      snapshots.length !== selectedSnapshots.length ? snapshots.length : null,
      screenshotRelDir
    );

    return {
      analysis: { raw: true, content: response },
      markdown,
      format: 'markdown',
      stats: {
        originalCount: snapshots.length,
        analyzedCount: selectedSnapshots.length,
        htmlLimit,
        cssLimit
      }
    };
  }

  /**
   * 计算批量分析限制
   */
  calculateBatchLimits(snapshots, availableTokens) {
    const FIXED_OVERHEAD_PER_PAGE = 200;
    const BATCH_FIXED_OVERHEAD = 1000;
    const DEFAULT_HTML_LIMIT = 5000;
    const DEFAULT_CSS_LIMIT = 8000;
    const MIN_HTML_LIMIT = 1500;
    const MIN_CSS_LIMIT = 2000;

    let selectedSnapshots = [...snapshots];
    let htmlLimit = DEFAULT_HTML_LIMIT;
    let cssLimit = DEFAULT_CSS_LIMIT;

    const estimateConfigTokens = (count, html, css) => {
      const perPageTokens = FIXED_OVERHEAD_PER_PAGE + this.estimateTokens('x'.repeat(html)) + this.estimateTokens('x'.repeat(css));
      return BATCH_FIXED_OVERHEAD + count * perPageTokens;
    };

    let estimatedTokens = estimateConfigTokens(selectedSnapshots.length, htmlLimit, cssLimit);

    if (estimatedTokens <= availableTokens) {
      return { selectedSnapshots, htmlLimit, cssLimit };
    }

    while (estimatedTokens > availableTokens && (htmlLimit > MIN_HTML_LIMIT || cssLimit > MIN_CSS_LIMIT)) {
      htmlLimit = Math.max(MIN_HTML_LIMIT, Math.floor(htmlLimit * 0.8));
      cssLimit = Math.max(MIN_CSS_LIMIT, Math.floor(cssLimit * 0.8));
      estimatedTokens = estimateConfigTokens(selectedSnapshots.length, htmlLimit, cssLimit);
    }

    while (estimatedTokens > availableTokens && selectedSnapshots.length > 1) {
      selectedSnapshots = selectedSnapshots.slice(0, selectedSnapshots.length - 1);
      estimatedTokens = estimateConfigTokens(selectedSnapshots.length, htmlLimit, cssLimit);
    }

    return { selectedSnapshots, htmlLimit, cssLimit };
  }

  /**
   * 获取 System Prompt
   */
  getSystemPrompt() {
    const preferZh = this.config.language === 'zh-CN';

    if (preferZh) {
      return `你是一位资深的前端设计系统架构师，拥有 10 年以上的设计系统构建经验。你曾参与过 Ant Design、Shadcn UI、Radix UI 等知名设计系统的开发。你的任务是从网页源码中逆向工程出完整的设计系统规范。

## 🎯 核心任务
深入分析提供的网页 HTML 和 CSS 源码，输出一份**生产级别**的设计系统文档（STYLEGUIDE.md），确保开发团队可以直接基于此文档复刻该网站的视觉风格。

## 📋 分析方法论

### 第一步：整体设计语言识别
- 识别设计风格流派（扁平化/拟物化/玻璃态/新拟态等）
- 判断技术栈（Tailwind/CSS Modules/Styled Components 等）
- 分析主题机制（CSS 变量/data 属性/class 切换）
- 提取设计理念关键词（简约/活力/专业/科技感等）

### 第二步：设计令牌深度提取
从 CSS 中提取**所有**设计变量，必须包含具体数值：

#### 颜色系统（Color Tokens）
| 类别 | 变量名 | 色值 | 用途说明 |
|------|--------|------|----------|
| 品牌主色 | --primary | #具体色值 | 按钮、链接、强调 |
| 品牌辅色 | --secondary | #具体色值 | 次要操作、标签 |
| 成功色 | --success | #具体色值 | 成功状态 |
| 警告色 | --warning | #具体色值 | 警告状态 |
| 错误色 | --error | #具体色值 | 错误状态 |
| 文本主色 | --text-primary | #具体色值 | 标题、正文 |
| 文本次色 | --text-secondary | #具体色值 | 描述、placeholder |
| 文本禁用 | --text-disabled | #具体色值 | 禁用状态 |
| 背景色 | --bg-primary | #具体色值 | 页面背景 |
| 卡片背景 | --bg-card | #具体色值 | 卡片、弹窗 |
| 边框色 | --border | #具体色值 | 分割线、边框 |

#### 字体系统（Typography Tokens）
- 字体族：主字体、等宽字体、装饰字体（列出完整 font-family 值）
- 字号阶梯：xs/sm/base/lg/xl/2xl/3xl/4xl（具体 px 或 rem 值）
- 字重：light/normal/medium/semibold/bold（具体数值 300-700）
- 行高：tight/normal/relaxed（具体比例如 1.25/1.5/1.75）
- 字间距：如有特殊设置需列出

#### 间距系统（Spacing Tokens）
- 基础单位：4px/8px 网格系统
- 间距阶梯：0/1/2/3/4/5/6/8/10/12/16/20/24（对应 px 值）
- 容器内边距：移动端/平板/桌面
- 组件间距：紧凑/标准/宽松

#### 圆角系统（Border Radius Tokens）
- none/sm/md/lg/xl/2xl/full（具体 px 值）

#### 阴影系统（Shadow Tokens）
- sm/md/lg/xl/2xl（完整 box-shadow 值）
- 内阴影（如有）

#### 动效系统（Animation Tokens）
- 时长：fast/normal/slow（ms 值）
- 缓动函数：ease-in/ease-out/ease-in-out（具体 cubic-bezier）
- 常用动画：fade/slide/scale/bounce

## 📦 组件规范（每个组件必须包含以下内容）

### 组件模板
\`\`\`
## 组件名称

### 设计规范
- **用途**：何时使用此组件
- **变体**：primary/secondary/outline/ghost 等
- **尺寸**：sm/md/lg
- **状态**：default/hover/active/focus/disabled

### 视觉规格
| 属性 | 值 |
|------|-----|
| 背景色 | #xxx |
| 文字色 | #xxx |
| 边框 | 1px solid #xxx |
| 圆角 | 8px |
| 内边距 | 12px 24px |
| 字号 | 14px |
| 字重 | 500 |

### Tailwind 类名
\\\`\\\`\\\`
btn-primary: "bg-[#xxx] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#xxx] transition-colors"
\\\`\\\`\\\`

### React 组件代码
\\\`\\\`\\\`tsx
// 完整可运行的组件代码
\\\`\\\`\\\`
\`\`\`

### 必须分析的组件清单
1. **按钮 Button** - 所有变体和状态
2. **导航栏 Navbar** - 桌面端和移动端
3. **卡片 Card** - 图片卡片、内容卡片、交互卡片
4. **表单输入 Input** - 文本框、下拉框、复选框
5. **标签 Badge/Tag** - 状态标签、分类标签
6. **模态框 Modal/Dialog** - 弹窗样式
7. **Toast/Alert** - 提示消息
8. **列表项 List Item** - 如有
9. **分页 Pagination** - 如有
10. **面包屑 Breadcrumb** - 如有

## 🎨 特殊效果提取

### 玻璃态效果（Glassmorphism）
\`\`\`css
backdrop-filter: blur(10px);
background: rgba(255, 255, 255, 0.1);
border: 1px solid rgba(255, 255, 255, 0.2);
\`\`\`

### 渐变效果
- 线性渐变：方向、色标
- 径向渐变：中心点、扩散方式

### 特殊动画
- Hover 效果
- 加载动画
- 页面过渡

## ✅ 输出质量要求

1. **具体性**：所有数值必须是从 CSS 中提取的真实值，禁止使用 "适当的"、"合适的" 等模糊描述
2. **完整性**：覆盖页面中出现的所有视觉元素
3. **可用性**：提供的代码必须可以直接复制使用
4. **专业性**：使用标准的设计系统术语
5. **结构化**：使用表格、代码块、列表等格式化输出

## 📄 输出结构

1. **概览** - 设计语言总结、技术栈、主题机制
2. **设计令牌** - 完整的 Token 表格
3. **配色系统** - 语义化颜色映射
4. **排版系统** - 字体阶梯详细规格
5. **间距系统** - 间距使用规范
6. **组件库** - 每个组件的完整规格和代码
7. **特效集合** - 阴影、渐变、动画
8. **响应式规范** - 断点和自适应策略
9. **暗色模式** - 如支持，列出所有差异
10. **无障碍指南** - 对比度、焦点状态
11. **代码片段集** - 常用 Tailwind 组合
12. **最佳实践** - Do & Don't 对照表

请确保输出足够详尽，让一个不了解原网站的开发者也能完全复刻其视觉风格。`;
    }

    return `You are a senior frontend design system expert, skilled at extracting design specifications from web source code and producing professional design system documentation.

## Your Task
Analyze the provided HTML and CSS, and output a comprehensive STYLEGUIDE.md that helps developers understand and reuse the website's design system.

## Output Requirements
- Use clear Markdown format with multi-level headings
- Provide specific code examples (Tailwind classes, CSS code, component snippets)
- Extract specific values (e.g., #0076ff), font families, shadow values - no placeholders
- Use React + Tailwind CSS style for component code

Ensure the output is comprehensive, professional, and directly usable as a team development reference.`;
  }

  /**
   * 构建 User Prompt
   */
  buildUserPrompt(snapshot) {
    const vp = `${snapshot.metadata.viewport.width}x${snapshot.metadata.viewport.height}`;
    const preferZh = this.config.language === 'zh-CN';

    const sections = [];
    sections.push(preferZh
      ? `## 页面信息\n- 标题: ${snapshot.title}\n- URL: ${snapshot.url}\n- 视口: ${vp}`
      : `## Page Info\n- Title: ${snapshot.title}\n- URL: ${snapshot.url}\n- Viewport: ${vp}`);
    sections.push('');
    sections.push(preferZh ? '## 请分析以下内容：' : '## Please analyze:');
    sections.push('');
    sections.push(preferZh
      ? '1. 配色系统\n2. 字体系统\n3. 布局与间距\n4. 组件风格\n5. 无障碍建议\n6. 阴影、动效、圆角'
      : '1. Color System\n2. Typography\n3. Layout & Spacing\n4. Component Styles\n5. Accessibility\n6. Shadows, Animations, Border Radius');
    sections.push('');
    sections.push('---');
    sections.push('');
    sections.push(preferZh ? '## 页面快照数据' : '## Page Snapshot Data');
    sections.push('');
    sections.push(preferZh ? '### HTML（截断）' : '### HTML (truncated)');
    sections.push('```html');
    sections.push(snapshot.html.substring(0, 8000));
    sections.push('```');
    sections.push('');
    sections.push(preferZh ? '### CSS（截断）' : '### CSS (truncated)');
    sections.push('```css');
    sections.push(snapshot.css.substring(0, 12000));
    sections.push('```');

    return sections.join('\n');
  }

  /**
   * 构建批量分析 Prompt
   */
  buildBatchPrompt(snapshots, htmlLimit = 5000, cssLimit = 8000) {
    const preferZh = this.config.language === 'zh-CN';
    const sections = [];

    sections.push(preferZh
      ? `## 批量分析任务\n现在有 ${snapshots.length} 个同一网站的不同页面快照，请综合分析它们的**统一设计系统**。`
      : `## Batch Analysis Task\nAnalyze ${snapshots.length} pages from the same website to extract the **unified design system**.`);
    sections.push('');
    sections.push(preferZh ? '## 请分析以下内容：' : '## Please analyze:');
    sections.push('');
    sections.push(preferZh
      ? '1. 统一配色系统\n2. 统一字体系统\n3. 统一布局系统\n4. 通用组件风格\n5. 无障碍建议\n6. 设计一致性建议'
      : '1. Unified Color System\n2. Unified Typography\n3. Unified Layout System\n4. Common Component Styles\n5. Accessibility\n6. Design Consistency');
    sections.push('');
    sections.push('---');
    sections.push('');
    sections.push(preferZh ? '## 页面快照数据' : '## Page Snapshot Data');

    snapshots.forEach((snapshot, i) => {
      const vp = snapshot.metadata?.viewport ? `${snapshot.metadata.viewport.width}x${snapshot.metadata.viewport.height}` : 'unknown';
      sections.push('');
      sections.push(`### ${preferZh ? '页面' : 'Page'} ${i + 1}: ${snapshot.title}`);
      sections.push(`- URL: ${snapshot.url}`);
      sections.push(`- ${preferZh ? '视口' : 'Viewport'}: ${vp}`);
      sections.push('');
      sections.push('#### HTML');
      sections.push('```html');
      sections.push(snapshot.html.substring(0, htmlLimit));
      sections.push('```');
      sections.push('');
      sections.push('#### CSS');
      sections.push('```css');
      sections.push(snapshot.css.substring(0, cssLimit));
      sections.push('```');
    });

    return sections.join('\n');
  }

  /**
   * 包装 Markdown 报告
   */
  wrapMarkdownReport(snapshot, content) {
    const lines = [];
    lines.push(`# ${snapshot.title} - 设计风格分析报告`);
    lines.push('');
    lines.push(`> **分析时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`> **页面 URL**: ${snapshot.url}`);
    lines.push(`> **采集时间**: ${new Date(snapshot.extractedAt).toLocaleString('zh-CN')}`);
    lines.push(`> **视口尺寸**: ${snapshot.metadata.viewport.width} x ${snapshot.metadata.viewport.height}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(content);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`*本报告由 Frontend Style Generator 批量脚本自动生成*`);
    lines.push(`*生成时间: ${new Date().toLocaleString('zh-CN')}*`);
    return lines.join('\n');
  }

  /**
   * 包装批量分析报告（支持截图）
   * @param {Array} snapshots - 快照数组，每个快照可包含 screenshotPath
   * @param {string} content - AI 分析内容
   * @param {number|null} originalCount - 原始页面数量
   * @param {string} screenshotRelDir - 截图相对目录名（用于 markdown 引用）
   */
  wrapBatchMarkdownReport(snapshots, content, originalCount = null, screenshotRelDir = null) {
    const lines = [];
    lines.push(`# 批量设计风格分析报告`);
    lines.push('');
    lines.push(`> **分析时间**: ${new Date().toLocaleString('zh-CN')}`);
    if (originalCount && originalCount > snapshots.length) {
      lines.push(`> **页面数量**: ${snapshots.length}（原始 ${originalCount} 个，因 token 限制自动调整）`);
    } else {
      lines.push(`> **页面数量**: ${snapshots.length}`);
    }
    lines.push('');
    
    // 页面预览（带截图）
    lines.push('## 📸 分析页面预览');
    lines.push('');
    snapshots.forEach((s, i) => {
      lines.push(`### ${i + 1}. ${s.title}`);
      lines.push(`- **URL**: ${s.url}`);
      if (s.screenshotFile && screenshotRelDir) {
        lines.push('');
        lines.push(`![${s.title}](./${screenshotRelDir}/${s.screenshotFile})`);
      }
      lines.push('');
    });
    
    lines.push('---');
    lines.push('');
    lines.push(content);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`*本报告由 Frontend Style Generator 批量脚本自动生成*`);
    lines.push(`*生成时间: ${new Date().toLocaleString('zh-CN')}*`);
    return lines.join('\n');
  }

  /**
   * 调用 AI API（支持 OpenAI 和 Azure）
   */
  async callAI(systemPrompt, userPrompt) {
    const { provider, temperature, maxTokens } = this.config;

    if (provider === 'azure') {
      return this.callAzureAI(systemPrompt, userPrompt);
    }
    return this.callOpenAI(systemPrompt, userPrompt);
  }

  /**
   * 调用 OpenAI 兼容 API
   */
  async callOpenAI(systemPrompt, userPrompt) {
    const { apiKey, baseUrl, modelId, temperature, maxTokens } = this.config;

    if (!apiKey || !baseUrl || !modelId) {
      const missing = [];
      if (!apiKey) missing.push('AI_API_KEY');
      if (!baseUrl) missing.push('AI_BASE_URL');
      if (!modelId) missing.push('AI_MODEL_ID');
      throw new Error(`请在 .env 中配置: ${missing.join(', ')}`);
    }

    const endpoint = baseUrl + '/chat/completions';
    console.log(`[AIAnalyzer] 调用 OpenAI API: ${endpoint}`);
    console.log(`[AIAnalyzer] 模型: ${modelId}`);

    const body = JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature
    });

    try {
      const response = await httpRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body)
        }
      }, body);

      if (response.status !== 200) {
        let errorMsg = `AI 请求失败 (HTTP ${response.status})`;
        try {
          const error = JSON.parse(response.data);
          errorMsg = error.error?.message || error.message || errorMsg;
        } catch (e) {
          errorMsg = response.data || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = JSON.parse(response.data);
      return data.choices[0].message.content;
    } catch (error) {
      console.error('[AIAnalyzer] OpenAI 请求失败:', error.message);
      throw error;
    }
  }

  /**
   * 调用 Azure OpenAI API
   */
  async callAzureAI(systemPrompt, userPrompt) {
    const { azureEndpoint, azureDeployment, azureApiVersion, azureApiKey, temperature, maxTokens } = this.config;

    if (!azureEndpoint || !azureDeployment || !azureApiKey) {
      const missing = [];
      if (!azureEndpoint) missing.push('AZURE_ENDPOINT');
      if (!azureDeployment) missing.push('AZURE_DEPLOYMENT');
      if (!azureApiKey) missing.push('AZURE_API_KEY');
      throw new Error(`请在 .env 中配置: ${missing.join(', ')}`);
    }

    // Azure OpenAI API 格式
    const endpoint = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;
    console.log(`[AIAnalyzer] 调用 Azure OpenAI API`);
    console.log(`[AIAnalyzer] 部署: ${azureDeployment}`);

    const body = JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature
    });

    try {
      const response = await httpRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureApiKey,
          'Content-Length': Buffer.byteLength(body)
        }
      }, body);

      if (response.status !== 200) {
        let errorMsg = `Azure AI 请求失败 (HTTP ${response.status})`;
        try {
          const error = JSON.parse(response.data);
          errorMsg = error.error?.message || error.message || errorMsg;
        } catch (e) {
          errorMsg = response.data || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = JSON.parse(response.data);
      return data.choices[0].message.content;
    } catch (error) {
      console.error('[AIAnalyzer] Azure 请求失败:', error.message);
      throw error;
    }
  }
}
