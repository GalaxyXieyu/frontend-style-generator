# AI 风格分析 Prompt 指南

## 📋 概述

本文档定义了用于分析网页设计风格的 AI Prompt 模板和输出规范，确保生成高质量、结构化的风格分析报告。

---

## 🎯 Prompt 模板

### 完整 Prompt

```markdown
你是一位资深的前端设计系统专家和 UI/UX 设计师，拥有 10 年以上的网页设计和前端开发经验。
你的任务是深入分析提供的网页快照，提取其设计系统、布局策略、组件风格和视觉特征。

## 输入数据

### HTML 结构
\`\`\`html
{html_content}
\`\`\`

### CSS 样式
\`\`\`css
{css_content}
\`\`\`

### 页面元数据
- **URL**: {url}
- **标题**: {title}
- **视口尺寸**: {viewport_width}x{viewport_height}
- **采集时间**: {captured_at}

## 分析要求

请按照以下维度进行深入分析：

### 1. 设计系统 (Design System)

#### 1.1 色彩方案 (Color Palette)
- 提取所有使用的颜色（HEX/RGB 格式）
- 识别主色调（Primary）、辅助色（Secondary）、强调色（Accent）
- 识别中性色系列（灰度）
- 识别语义化颜色（成功/警告/错误/信息）
- 分析色彩对比度是否符合 WCAG AA 标准
- 评估色彩搭配的和谐度

**输出格式**:
\`\`\`json
{
  "primary": ["#3B82F6", "#2563EB"],
  "secondary": ["#8B5CF6", "#7C3AED"],
  "accent": ["#F59E0B", "#D97706"],
  "neutral": ["#1F2937", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB", "#E5E7EB", "#F3F4F6"],
  "semantic": {
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444",
    "info": "#3B82F6"
  },
  "contrastRatio": "AAA",
  "harmony": "analogous"
}
\`\`\`

#### 1.2 字体系统 (Typography)
- 识别所有字体族（Font Family）
- 提取标题层级（H1-H6）的字号、行高、字重
- 提取正文字号、行高
- 识别字体加载策略（系统字体/Web 字体）
- 评估字体层级的清晰度

**输出格式**:
\`\`\`json
{
  "fontFamilies": {
    "primary": "Inter, system-ui, -apple-system, sans-serif",
    "heading": "Poppins, sans-serif",
    "monospace": "Fira Code, monospace"
  },
  "scale": {
    "h1": { "size": "48px", "lineHeight": "1.2", "weight": 700 },
    "h2": { "size": "40px", "lineHeight": "1.3", "weight": 700 },
    "h3": { "size": "32px", "lineHeight": "1.4", "weight": 600 },
    "h4": { "size": "24px", "lineHeight": "1.4", "weight": 600 },
    "h5": { "size": "20px", "lineHeight": "1.5", "weight": 600 },
    "h6": { "size": "18px", "lineHeight": "1.5", "weight": 600 },
    "body": { "size": "16px", "lineHeight": "1.6", "weight": 400 },
    "small": { "size": "14px", "lineHeight": "1.5", "weight": 400 }
  },
  "clarity": "excellent"
}
\`\`\`

#### 1.3 间距系统 (Spacing)
- 识别间距基础单位（通常是 4px 或 8px）
- 提取常用的 margin 和 padding 值
- 识别间距比例系统（如 4-8-12-16-24-32-48-64）
- 评估间距的一致性

**输出格式**:
\`\`\`json
{
  "baseUnit": "4px",
  "scale": "4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px, 128px",
  "common": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px",
    "2xl": "48px"
  },
  "consistency": "high"
}
\`\`\`

#### 1.4 圆角系统 (Border Radius)
- 提取所有使用的圆角值
- 识别圆角风格（尖锐/圆润/胶囊）
- 评估圆角使用的一致性

**输出格式**:
\`\`\`json
{
  "values": ["0px", "4px", "8px", "12px", "16px", "9999px"],
  "style": "rounded",
  "common": {
    "none": "0px",
    "sm": "4px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px",
    "full": "9999px"
  }
}
\`\`\`

### 2. 布局分析 (Layout)

#### 2.1 布局技术
- 识别主要布局方式（Flexbox/Grid/Float/Position）
- 分析栅格系统（列数、间距）
- 识别容器最大宽度
- 评估布局的灵活性

#### 2.2 响应式设计
- 识别断点（Breakpoints）
- 分析移动端优先/桌面端优先策略
- 评估响应式实现质量

**输出格式**:
\`\`\`json
{
  "primaryTechnique": "flexbox",
  "secondaryTechnique": "grid",
  "gridSystem": {
    "columns": 12,
    "gutter": "24px",
    "maxWidth": "1280px"
  },
  "responsive": {
    "strategy": "mobile-first",
    "breakpoints": {
      "sm": "640px",
      "md": "768px",
      "lg": "1024px",
      "xl": "1280px",
      "2xl": "1536px"
    }
  },
  "flexibility": "high"
}
\`\`\`

### 3. 组件风格 (Components)

分析以下常见组件的设计模式：

#### 3.1 按钮 (Buttons)
- 主按钮、次按钮、文本按钮的样式
- 尺寸变体（small/medium/large）
- 状态样式（hover/active/disabled）
- 圆角、内边距、字体

#### 3.2 卡片 (Cards)
- 边框样式
- 阴影效果
- 圆角
- 内边距
- 背景色

#### 3.3 表单 (Forms)
- 输入框样式
- 标签位置和样式
- 验证状态样式
- 占位符样式

#### 3.4 导航 (Navigation)
- 导航栏样式
- 链接样式
- 激活状态
- 下拉菜单

**输出格式**:
\`\`\`json
{
  "buttons": {
    "primary": {
      "background": "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
      "color": "#FFFFFF",
      "borderRadius": "8px",
      "padding": "12px 24px",
      "fontSize": "16px",
      "fontWeight": 600,
      "boxShadow": "0 4px 6px rgba(59, 130, 246, 0.3)",
      "hover": {
        "transform": "translateY(-2px)",
        "boxShadow": "0 6px 12px rgba(59, 130, 246, 0.4)"
      }
    },
    "secondary": {
      "background": "transparent",
      "color": "#3B82F6",
      "border": "2px solid #3B82F6",
      "borderRadius": "8px",
      "padding": "10px 22px"
    }
  },
  "cards": {
    "border": "1px solid #E5E7EB",
    "borderRadius": "12px",
    "padding": "24px",
    "boxShadow": "0 1px 3px rgba(0, 0, 0, 0.1)",
    "background": "#FFFFFF",
    "hover": {
      "boxShadow": "0 4px 6px rgba(0, 0, 0, 0.1)",
      "transform": "translateY(-2px)"
    }
  }
}
\`\`\`

### 4. 视觉特征 (Visual Style)

#### 4.1 整体风格
- 风格定位（极简/现代/经典/有趣/专业）
- 设计语言（Material/Fluent/Apple/自定义）
- 视觉密度（紧凑/适中/宽松）

#### 4.2 视觉效果
- 阴影使用（无/轻微/明显）
- 渐变使用（是/否，类型）
- 动画效果（微交互/页面过渡/加载动画）
- 特殊效果（毛玻璃/新拟态/3D）

**输出格式**:
\`\`\`json
{
  "overall": "modern-minimalist",
  "designLanguage": "custom",
  "density": "comfortable",
  "shadows": {
    "usage": "subtle",
    "elevation": ["0 1px 3px rgba(0,0,0,0.1)", "0 4px 6px rgba(0,0,0,0.1)"]
  },
  "gradients": {
    "used": true,
    "types": ["linear", "radial"],
    "examples": ["linear-gradient(135deg, #667eea 0%, #764ba2 100%)"]
  },
  "animations": {
    "microInteractions": true,
    "pageTransitions": false,
    "loading": true,
    "types": ["hover-lift", "fade-in", "slide-in"]
  },
  "specialEffects": {
    "glassmorphism": false,
    "neumorphism": false,
    "3d": false
  }
}
\`\`\`

### 5. 技术栈推测 (Tech Stack)

基于代码特征推测可能使用的技术：

- **框架**: React/Vue/Angular/Svelte/原生
- **CSS 方案**: Tailwind/CSS Modules/Styled Components/Sass
- **UI 库**: Material-UI/Ant Design/Chakra UI/自定义
- **动画库**: Framer Motion/GSAP/CSS Animations
- **图标库**: Font Awesome/Heroicons/Lucide

**输出格式**:
\`\`\`json
{
  "framework": {
    "name": "React",
    "confidence": 0.85,
    "evidence": ["React-specific class names", "data-reactroot attribute"]
  },
  "cssFramework": {
    "name": "Tailwind CSS",
    "confidence": 0.95,
    "evidence": ["Utility class patterns", "Tailwind-specific classes"]
  },
  "uiLibrary": {
    "name": "Custom",
    "confidence": 0.7,
    "evidence": ["No obvious third-party component patterns"]
  },
  "animationLibrary": {
    "name": "Framer Motion",
    "confidence": 0.6,
    "evidence": ["Transform and opacity transitions"]
  }
}
\`\`\`

### 6. 可访问性评估 (Accessibility)

- **色彩对比度**: 是否符合 WCAG 标准
- **语义化 HTML**: 是否使用正确的标签
- **ARIA 属性**: 是否正确使用
- **键盘导航**: 是否支持
- **屏幕阅读器**: 是否友好

**输出格式**:
\`\`\`json
{
  "colorContrast": {
    "score": "AA",
    "issues": ["Some text on colored backgrounds has low contrast"]
  },
  "semanticHTML": {
    "score": 8,
    "strengths": ["Proper heading hierarchy", "Semantic landmarks"],
    "issues": ["Some divs could be buttons"]
  },
  "aria": {
    "score": 7,
    "strengths": ["aria-label on icons"],
    "issues": ["Missing aria-live regions"]
  },
  "keyboardNav": {
    "score": 9,
    "strengths": ["All interactive elements focusable"],
    "issues": ["Focus indicators could be more visible"]
  },
  "overallScore": 8.0
}
\`\`\`

### 7. 最佳实践建议 (Recommendations)

提供 3-5 条具体的改进建议，包括：
- 设计改进
- 性能优化
- 可访问性提升
- 用户体验优化

**输出格式**:
\`\`\`json
{
  "recommendations": [
    {
      "category": "accessibility",
      "priority": "high",
      "title": "提升色彩对比度",
      "description": "部分文本与背景的对比度低于 WCAG AA 标准，建议调整颜色或增加文本粗细。",
      "impact": "提升视障用户的可读性"
    },
    {
      "category": "design",
      "priority": "medium",
      "title": "增加深色模式支持",
      "description": "当前仅支持浅色模式，建议添加深色模式以适应用户偏好。",
      "impact": "提升用户体验，减少眼睛疲劳"
    },
    {
      "category": "performance",
      "priority": "medium",
      "title": "优化字体加载",
      "description": "使用 font-display: swap 避免字体加载阻塞渲染。",
      "impact": "提升首屏加载速度"
    }
  ]
}
\`\`\`

### 8. 总结 (Summary)

用 150-200 字总结页面的整体设计风格和特点。

**要求**:
- 简洁明了
- 突出核心特征
- 专业术语准确
- 易于理解

## 输出格式

请以 JSON 格式输出完整的分析结果，包含以下顶层字段：

\`\`\`json
{
  "designSystem": { ... },
  "layout": { ... },
  "components": { ... },
  "visualStyle": { ... },
  "techStack": { ... },
  "accessibility": { ... },
  "recommendations": [ ... ],
  "summary": "..."
}
\`\`\`

## 分析原则

1. **准确性优先**: 基于实际代码分析，不要臆测
2. **全面性**: 涵盖所有关键设计元素
3. **专业性**: 使用正确的设计和技术术语
4. **可操作性**: 建议要具体、可执行
5. **客观性**: 避免主观偏好，基于设计原则评估

请开始分析。
```

---

## 📄 Markdown 报告模板

### 完整模板

```markdown
# {页面标题} - 设计风格分析报告

> **分析时间**: {分析时间}  
> **页面 URL**: {URL}  
> **采集时间**: {采集时间}  
> **视口尺寸**: {宽度} x {高度}

---

## 📊 概览

{AI 生成的总结，150-200 字}

---

## 🎨 设计系统

### 色彩方案

#### 主色调 (Primary Colors)
{主色调色块和 HEX 值列表}

#### 辅助色 (Secondary Colors)
{辅助色色块和 HEX 值列表}

#### 强调色 (Accent Colors)
{强调色色块和 HEX 值列表}

#### 中性色 (Neutral Colors)
{中性色色块和 HEX 值列表}

#### 语义化颜色 (Semantic Colors)
- **成功**: {颜色}
- **警告**: {颜色}
- **错误**: {颜色}
- **信息**: {颜色}

#### 对比度评估
- **WCAG 等级**: {AA/AAA}
- **色彩和谐度**: {analogous/complementary/triadic}

---

### 字体系统

#### 字体族
- **主字体**: {字体名称}
- **标题字体**: {字体名称}
- **等宽字体**: {字体名称}

#### 字体层级

| 层级 | 字号 | 行高 | 字重 | 用途 |
|------|------|------|------|------|
| H1 | {size} | {lineHeight} | {weight} | 页面主标题 |
| H2 | {size} | {lineHeight} | {weight} | 章节标题 |
| H3 | {size} | {lineHeight} | {weight} | 子章节标题 |
| H4 | {size} | {lineHeight} | {weight} | 小标题 |
| Body | {size} | {lineHeight} | {weight} | 正文 |
| Small | {size} | {lineHeight} | {weight} | 辅助文本 |

---

### 间距系统

- **基础单位**: {baseUnit}
- **间距比例**: {scale}

#### 常用间距

| 名称 | 值 | 用途 |
|------|-----|------|
| xs | {value} | 紧凑间距 |
| sm | {value} | 小间距 |
| md | {value} | 中等间距 |
| lg | {value} | 大间距 |
| xl | {value} | 超大间距 |

---

### 圆角系统

- **风格**: {sharp/rounded/pill}
- **常用值**: {values}

---

## 📐 布局分析

### 布局技术
- **主要方式**: {Flexbox/Grid/Hybrid}
- **辅助方式**: {技术名称}

### 栅格系统
- **列数**: {columns}
- **间距**: {gutter}
- **最大宽度**: {maxWidth}

### 响应式设计
- **策略**: {mobile-first/desktop-first}
- **断点**:
  - **sm**: {value}
  - **md**: {value}
  - **lg**: {value}
  - **xl**: {value}

---

## 🧩 组件风格

### 按钮 (Buttons)

#### 主按钮
- **背景**: {background}
- **文字颜色**: {color}
- **圆角**: {borderRadius}
- **内边距**: {padding}
- **阴影**: {boxShadow}
- **Hover 效果**: {hover effects}

#### 次按钮
{类似格式}

### 卡片 (Cards)
- **边框**: {border}
- **圆角**: {borderRadius}
- **内边距**: {padding}
- **阴影**: {boxShadow}
- **背景**: {background}
- **Hover 效果**: {hover effects}

### 表单 (Forms)
- **输入框样式**: {描述}
- **标签样式**: {描述}
- **验证状态**: {描述}

### 导航 (Navigation)
- **导航栏样式**: {描述}
- **链接样式**: {描述}
- **激活状态**: {描述}

---

## 🎭 视觉特征

### 整体风格
- **风格定位**: {minimalist/modern/classic/playful/professional}
- **设计语言**: {Material/Fluent/Apple/Custom}
- **视觉密度**: {compact/comfortable/spacious}

### 阴影使用
- **使用程度**: {none/subtle/prominent}
- **阴影层级**: {列出不同层级的阴影值}

### 渐变效果
- **是否使用**: {是/否}
- **渐变类型**: {linear/radial}
- **示例**: {渐变代码}

### 动画效果
- **微交互**: {是/否}
- **页面过渡**: {是/否}
- **加载动画**: {是/否}
- **动画类型**: {列出动画类型}

### 特殊效果
- **毛玻璃效果**: {是/否}
- **新拟态**: {是/否}
- **3D 效果**: {是/否}

---

## 💻 技术栈推测

| 技术类别 | 推测结果 | 置信度 | 证据 |
|----------|----------|--------|------|
| 前端框架 | {name} | {confidence}% | {evidence} |
| CSS 方案 | {name} | {confidence}% | {evidence} |
| UI 库 | {name} | {confidence}% | {evidence} |
| 动画库 | {name} | {confidence}% | {evidence} |
| 图标库 | {name} | {confidence}% | {evidence} |

---

## ♿ 可访问性评估

### 综合评分: {score}/10

### 色彩对比度
- **等级**: {AA/AAA/不达标}
- **问题**: {列出问题}

### 语义化 HTML
- **评分**: {score}/10
- **优点**: {列出优点}
- **问题**: {列出问题}

### ARIA 属性
- **评分**: {score}/10
- **优点**: {列出优点}
- **问题**: {列出问题}

### 键盘导航
- **评分**: {score}/10
- **优点**: {列出优点}
- **问题**: {列出问题}

---

## 💡 改进建议

### 1. {建议标题} [优先级: {High/Medium/Low}]
**类别**: {accessibility/design/performance/ux}

**问题描述**:  
{详细描述当前存在的问题}

**改进方案**:  
{具体的改进建议}

**预期影响**:  
{改进后的预期效果}

---

### 2. {建议标题} [优先级: {High/Medium/Low}]
{同上格式}

---

## 📝 总结

{150-200 字的总结，包括：}
- 整体设计水平评价
- 核心优势
- 主要不足
- 适用场景

---

## 📎 附录

### 分析元数据
- **分析引擎**: Frontend Style Generator AI
- **AI 模型**: {模型名称和版本}
- **分析时长**: {duration}
- **报告版本**: 1.0

### 相关资源
- [原始页面]({URL})
- [快照预览]({预览链接})
- [JSON 数据]({JSON 下载链接})

---

*本报告由 Frontend Style Generator AI 自动生成*  
*生成时间: {timestamp}*
```

---

## 🎯 质量检查清单

### 分析完整性
- [ ] 提取了所有主要颜色
- [ ] 识别了字体层级
- [ ] 分析了间距系统
- [ ] 评估了布局方式
- [ ] 总结了组件风格
- [ ] 描述了视觉特征
- [ ] 推测了技术栈
- [ ] 评估了可访问性
- [ ] 提供了改进建议

### 数据准确性
- [ ] 颜色值正确（HEX/RGB）
- [ ] 字体名称准确
- [ ] 尺寸单位正确（px/rem/em）
- [ ] 技术栈推测有依据
- [ ] 建议具体可执行

### 报告可读性
- [ ] 结构清晰
- [ ] 术语准确
- [ ] 格式统一
- [ ] 易于理解
- [ ] 视觉效果好

---

## 🔄 迭代优化

### 版本历史
- **v1.0** (2025-11-23): 初始版本

### 未来改进方向
1. 增加设计趋势分析
2. 支持多页面对比
3. 生成设计 Token 文件
4. 导出 Figma/Sketch 变量
5. 集成设计系统文档生成

---

**文档版本**: 1.0  
**创建日期**: 2025-11-23  
**维护者**: Frontend Style Generator Team
