/**
 * AI 风格分析器
 * 调用 AI API 分析页面设计风格
 */
class AIAnalyzer {
  constructor() {
    this.config = null;
  }
  
  /**
   * 加载配置
   */
  async loadConfig() {
    const result = await chrome.storage.local.get(['aiModels', 'generateConfig']);
    const aiModels = result.aiModels || [];
    const defaultModel = aiModels.find(m => m.isDefault) || aiModels[0] || null;
    
    this.config = {
      ai: defaultModel || {},
      generate: result.generateConfig || {}
    };
    return this.config;
  }
  
  /**
   * 分析快照
   */
  async analyze(snapshot) {
    await this.loadConfig();
    
    if (!this.config.ai.apiKey) {
      throw new Error('请先在设置中配置 AI API Key');
    }
    
    // 构建 Prompt
    const prompt = this.buildPrompt(snapshot);
    
    // 调用 AI
    const response = await this.callAI(prompt);
    
    // 解析响应
    const analysis = this.parseResponse(response);
    
    // 生成 Markdown
    const markdown = this.generateMarkdown(snapshot, analysis);
    
    return {
      analysis,
      markdown
    };
  }
  
  /**
   * 构建分析 Prompt
   */
  buildPrompt(snapshot) {
    const sections = [];
    
    sections.push(`你是一位资深的前端设计系统专家。请分析以下网页的设计风格。`);
    sections.push(`\n## 页面信息`);
    sections.push(`- URL: ${snapshot.url}`);
    sections.push(`- 标题: ${snapshot.title}`);
    sections.push(`- 视口: ${snapshot.metadata.viewport.width}x${snapshot.metadata.viewport.height}`);
    
    sections.push(`\n## HTML 结构`);
    sections.push(`\`\`\`html`);
    sections.push(snapshot.html.substring(0, 5000)); // 限制长度
    sections.push(`\`\`\``);
    
    sections.push(`\n## CSS 样式`);
    sections.push(`\`\`\`css`);
    sections.push(snapshot.css.substring(0, 10000)); // 限制长度
    sections.push(`\`\`\``);
    
    sections.push(`\n## 分析要求`);
    sections.push(`请以 JSON 格式输出分析结果，包含以下字段：`);
    
    if (this.config.generate.includeColors) {
      sections.push(`- colors: 色彩方案（primary, secondary, accent, neutral）`);
    }
    
    if (this.config.generate.includeTypography) {
      sections.push(`- typography: 字体系统（fontFamilies, sizes, weights）`);
    }
    
    if (this.config.generate.includeLayout) {
      sections.push(`- layout: 布局分析（type, grid, responsive）`);
    }
    
    if (this.config.generate.includeComponents) {
      sections.push(`- components: 组件风格（buttons, cards, forms）`);
    }
    
    if (this.config.generate.includeAccessibility) {
      sections.push(`- accessibility: 可访问性评估（score, issues）`);
    }
    
    if (this.config.generate.includeRecommendations) {
      sections.push(`- recommendations: 改进建议数组`);
    }
    
    sections.push(`- summary: 200字以内的总结`);
    
    return sections.join('\n');
  }
  
  /**
   * 调用 AI API
   */
  async callAI(prompt) {
    const { apiKey, baseUrl, modelId, temperature, maxTokens } = this.config.ai;
    
    if (!apiKey || !baseUrl || !modelId) {
      throw new Error('请先在设置中配置 AI 模型');
    }
    
    const endpoint = baseUrl + '/chat/completions';
    
    // 使用 OpenAI 兼容格式
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'system',
              content: '你是一位专业的前端设计系统分析专家。请以 JSON 格式输出分析结果。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: maxTokens || 4000,
          temperature: temperature || 0.7
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'AI 请求失败');
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI API 调用失败:', error);
      throw error;
    }
  }
  
  /**
   * 解析 AI 响应
   */
  parseResponse(response) {
    // 尝试提取 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('JSON 解析失败:', e);
      }
    }
    
    // 如果无法解析，返回原始响应
    return {
      summary: response,
      raw: true
    };
  }
  
  /**
   * 生成 Markdown 报告
   */
  generateMarkdown(snapshot, analysis) {
    const lines = [];
    
    // 标题
    lines.push(`# ${snapshot.title} - 设计风格分析报告`);
    lines.push(``);
    lines.push(`> **分析时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`> **页面 URL**: ${snapshot.url}`);
    lines.push(`> **采集时间**: ${new Date(snapshot.extractedAt).toLocaleString('zh-CN')}`);
    lines.push(`> **视口尺寸**: ${snapshot.metadata.viewport.width} x ${snapshot.metadata.viewport.height}`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    
    // 概览
    lines.push(`## 📊 概览`);
    lines.push(``);
    lines.push(analysis.summary || '无总结');
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    
    // 色彩方案
    if (analysis.colors) {
      lines.push(`## 🎨 色彩方案`);
      lines.push(``);
      
      if (analysis.colors.primary) {
        lines.push(`### 主色调`);
        analysis.colors.primary.forEach(color => {
          lines.push(`- ${color}`);
        });
        lines.push(``);
      }
      
      if (analysis.colors.secondary) {
        lines.push(`### 辅助色`);
        analysis.colors.secondary.forEach(color => {
          lines.push(`- ${color}`);
        });
        lines.push(``);
      }
      
      lines.push(`---`);
      lines.push(``);
    }
    
    // 字体系统
    if (analysis.typography) {
      lines.push(`## ✍️ 字体系统`);
      lines.push(``);
      
      if (analysis.typography.fontFamilies) {
        lines.push(`### 字体族`);
        analysis.typography.fontFamilies.forEach(font => {
          lines.push(`- ${font}`);
        });
        lines.push(``);
      }
      
      lines.push(`---`);
      lines.push(``);
    }
    
    // 布局分析
    if (analysis.layout) {
      lines.push(`## 📐 布局分析`);
      lines.push(``);
      lines.push(`- **布局方式**: ${analysis.layout.type || '未知'}`);
      if (analysis.layout.grid) {
        lines.push(`- **栅格系统**: ${analysis.layout.grid}`);
      }
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    }
    
    // 组件风格
    if (analysis.components) {
      lines.push(`## 🧩 组件风格`);
      lines.push(``);
      
      Object.entries(analysis.components).forEach(([name, style]) => {
        lines.push(`### ${name}`);
        lines.push(``);
        if (typeof style === 'string') {
          lines.push(style);
        } else {
          lines.push(`\`\`\`json`);
          lines.push(JSON.stringify(style, null, 2));
          lines.push(`\`\`\``);
        }
        lines.push(``);
      });
      
      lines.push(`---`);
      lines.push(``);
    }
    
    // 可访问性
    if (analysis.accessibility) {
      lines.push(`## ♿ 可访问性评估`);
      lines.push(``);
      lines.push(`- **评分**: ${analysis.accessibility.score || 'N/A'}`);
      if (analysis.accessibility.issues) {
        lines.push(``);
        lines.push(`### 问题`);
        analysis.accessibility.issues.forEach(issue => {
          lines.push(`- ${issue}`);
        });
      }
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
    }
    
    // 改进建议
    if (analysis.recommendations) {
      lines.push(`## 💡 改进建议`);
      lines.push(``);
      analysis.recommendations.forEach((rec, index) => {
        lines.push(`### ${index + 1}. ${rec.title || rec}`);
        if (rec.description) {
          lines.push(``);
          lines.push(rec.description);
        }
        lines.push(``);
      });
      lines.push(`---`);
      lines.push(``);
    }
    
    // 页脚
    lines.push(`---`);
    lines.push(``);
    lines.push(`*本报告由 Frontend Style Generator AI 自动生成*`);
    lines.push(`*生成时间: ${new Date().toLocaleString('zh-CN')}*`);
    
    return lines.join('\n');
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAnalyzer;
}
