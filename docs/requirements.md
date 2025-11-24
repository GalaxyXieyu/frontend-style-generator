# 前端页面风格提取器 - 需求分析文档

## 📋 项目概述

### 项目名称
**Frontend Style Generator** - 基于 Chrome 插件的前端页面风格提取与管理系统

### 项目背景
基于 Aceternity UI Pro 的 `snapshot-site.js` 脚本功能，将其改造为 Chrome 浏览器插件，实现在任意网页上一键提取静态页面快照，并通过后台管理系统进行预览和风格分析。

### 原脚本功能分析
`snapshot-site.js` 是一个基于 Playwright 的高保真 HTML 快照导出工具，核心功能包括：
- 自动扫描 Next.js App Router 路由
- 使用 Playwright 无头浏览器访问页面
- 内联 CSS 样式表到 HTML
- 下载并本地化图片、字体等资源
- 重写资源路径为相对路径
- 支持并发导出多个页面
- 生成完整的静态 HTML 快照

### 核心价值
- **设计师/开发者工具**: 快速收集和分析优秀网站的设计风格
- **灵感库管理**: 构建个人的前端设计灵感库
- **AI 辅助分析**: 利用 AI 自动提取和总结页面设计特征
- **团队协作**: 分享和讨论优秀的前端设计案例

---

## 🎯 功能需求

### 1. Chrome 浏览器插件

#### 1.1 核心功能
- **一键快照**: 在任意网页点击插件图标，触发页面快照提取
- **智能提取**: 自动提取页面的 HTML、CSS、图片等静态资源
- **实时预览**: 插件内快速预览提取结果
- **快速跳转**: 一键跳转到后台管理系统查看详情

#### 1.2 提取能力（基于原脚本功能）
```javascript
{
  html: "完整的 HTML 结构",
  css: "内联的 CSS 样式",
  assets: {
    images: ["图片资源列表"],
    fonts: ["字体文件列表"],
    icons: ["图标资源列表"]
  },
  metadata: {
    url: "原始页面 URL",
    title: "页面标题",
    timestamp: "提取时间戳",
    viewport: "视口尺寸"
  }
}
```

#### 1.3 插件 UI 设计
```
┌─────────────────────────────────┐
│  Frontend Style Generator       │
├─────────────────────────────────┤
│  📸 当前页面                     │
│  https://example.com            │
│                                 │
│  [🎨 提取页面风格]              │
│                                 │
│  ⚙️ 提取选项:                   │
│  ☑ 内联 CSS                     │
│  ☑ 下载图片资源                 │
│  ☑ 提取字体文件                 │
│  ☐ 包含 JavaScript              │
│                                 │
│  📊 已保存: 23 个页面            │
│  [🔗 打开管理后台]              │
└─────────────────────────────────┘
```

#### 1.4 技术实现要点
- **Manifest V3**: 使用最新的 Chrome 扩展 API
- **Content Script**: 注入页面提取脚本
- **Background Service Worker**: 处理数据上传
- **Storage API**: 本地缓存提取数据
- **Tabs API**: 获取当前页面信息

---

### 2. 后台管理系统

#### 2.1 技术栈（基于用户规范）
```typescript
// 核心框架
- Next.js 15 (App Router)
- TypeScript 5
- React 18

// UI 层
- Tailwind CSS V3
- Shadcn/ui 组件库
- Framer Motion (动画)
- Aceternity UI (高级组件)

// 数据层
- Drizzle ORM
- PostgreSQL
- Zod (数据验证)

// 状态管理
- Zustand (全局状态)

// AI 集成
- Vercel AI SDK
- OpenAI API / Anthropic Claude
```

#### 2.2 功能模块

##### 2.2.1 页面快照管理
```typescript
// 数据模型
interface PageSnapshot {
  id: string;
  url: string;
  title: string;
  html: string;
  css: string;
  assets: {
    images: Asset[];
    fonts: Asset[];
    icons: Asset[];
  };
  metadata: {
    capturedAt: Date;
    viewport: { width: number; height: number };
    userAgent: string;
  };
  tags: string[];
  category: string;
  userId: string;
}
```

##### 2.2.2 静态页面预览器
- **iframe 沙箱预览**: 安全隔离的页面预览
- **响应式预览**: 支持多种设备尺寸切换
- **对比视图**: 原始页面 vs 快照页面对比
- **交互模式**: 只读模式（默认）/ 交互模式（启用 JavaScript）

##### 2.2.3 风格分析模块（AI 驱动）
```typescript
interface StyleAnalysis {
  id: string;
  snapshotId: string;
  
  designSystem: {
    colors: {
      primary: string[];
      secondary: string[];
      accent: string[];
    };
    typography: {
      fontFamilies: string[];
      headingSizes: string[];
      bodySize: string;
    };
    spacing: {
      scale: string;
      common: string[];
    };
  };
  
  layout: {
    type: 'grid' | 'flexbox' | 'hybrid';
    columns: number;
    responsive: boolean;
  };
  
  components: {
    buttons: ComponentStyle[];
    cards: ComponentStyle[];
    forms: ComponentStyle[];
  };
  
  visualStyle: {
    overall: 'minimalist' | 'modern' | 'classic';
    animations: boolean;
    shadows: 'none' | 'subtle' | 'prominent';
  };
  
  summary: string;
  recommendations: string[];
}
```

##### 2.2.4 Markdown 文档生成
自动生成包含以下内容的 Markdown 报告：
- 基本信息（URL、标题、采集时间）
- 设计系统（色彩、字体、间距）
- 布局分析（栅格、响应式）
- 组件风格（按钮、卡片、表单）
- 视觉特征（整体风格、动画、阴影）
- AI 建议和改进意见

---

### 3. AI 风格分析引擎

#### 3.1 分析流程
```
HTML/CSS 输入 → 结构解析 → 样式提取 → AI 分析 → 生成报告 → Markdown 输出
```

#### 3.2 AI Prompt 要求
```
你是一位资深的前端设计系统专家。请分析以下网页的设计风格和技术实现。

## 分析要求
1. **设计系统**: 提取色彩、字体、间距、圆角等设计 token
2. **布局方式**: 识别布局技术（Grid/Flexbox）和响应式策略
3. **组件风格**: 总结按钮、卡片、表单等常见组件的设计模式
4. **视觉特征**: 描述整体视觉风格、动画效果、阴影使用等
5. **技术栈推测**: 基于代码特征推测可能使用的框架和库
6. **可访问性**: 评估色彩对比度、语义化等无障碍特性
7. **最佳实践**: 给出设计和实现上的改进建议

## 输出格式
以 JSON 格式输出，包含 designSystem、layout、components、visualStyle、
techStack、accessibility、recommendations、summary 等字段。
```

---

## 🏗️ 系统架构

### 架构图
```
Chrome Extension (Popup + Content Script + Background)
          ↓
    REST API (/api/snapshots)
          ↓
Next.js Backend (Server Actions + AI Service)
          ↓
PostgreSQL Database
          ↓
AI Providers (OpenAI / Claude)
```

### 数据流
```
1. 用户点击插件 → Content Script 提取页面
2. Background Worker → 上传到 API
3. Next.js Server → 保存到数据库
4. 用户访问后台 → 查看快照列表
5. 点击分析按钮 → 调用 AI 服务
6. AI 分析完成 → 生成 Markdown 报告
7. 用户下载/分享报告
```

---

## 📁 项目结构

```
frontend-style-generator/
├── chrome-extension/              # Chrome 插件
│   ├── manifest.json
│   ├── popup/
│   │   ├── index.html
│   │   └── popup.tsx
│   ├── content/
│   │   └── extractor.ts          # 页面提取脚本
│   ├── background/
│   │   └── service-worker.ts
│   └── lib/
│       ├── snapshot.ts            # 快照逻辑（基于原脚本）
│       └── api-client.ts
│
├── web/                           # Next.js 后台管理系统
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── snapshots/
│   │   │   │   ├── page.tsx      # 快照列表
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # 快照详情+预览
│   │   │   ├── analysis/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # 分析报告
│   │   │   └── settings/
│   │   └── api/
│   │       ├── snapshots/
│   │       │   └── route.ts      # CRUD API
│   │       └── webhook/
│   │
│   ├── components/
│   │   ├── ui/                   # Shadcn UI 组件
│   │   ├── snapshot/
│   │   │   ├── snapshot-card.tsx
│   │   │   └── snapshot-previewer.tsx
│   │   └── analysis/
│   │       ├── style-report.tsx
│   │       └── color-palette.tsx
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts         # Drizzle Schema
│   │   │   └── client.ts
│   │   ├── ai/
│   │   │   ├── analyzer.ts       # AI 分析引擎
│   │   │   ├── prompts.ts
│   │   │   └── markdown-generator.ts
│   │   └── utils/
│   │
│   └── actions/
│       ├── snapshot-actions.ts   # Server Actions
│       └── analysis-actions.ts
│
├── shared/                        # 共享类型和工具
│   └── types/
│
└── docs/
    ├── requirements.md            # 本文档
    └── api.md
```

---

## 🎨 UI/UX 设计要求

### 设计原则
1. **简洁高效**: 减少操作步骤，提升工作效率
2. **视觉统一**: 使用 Shadcn UI + Aceternity UI 保持设计一致性
3. **响应式**: 支持桌面和平板设备
4. **可访问性**: 遵循 WCAG 2.1 AA 标准

### 关键页面

#### 快照列表页
- 网格/列表视图切换
- 筛选（分类、标签、日期）
- 搜索（标题、URL、内容）
- 批量操作（删除、导出、分析）

#### 预览页面
- 响应式视口切换（手机/平板/桌面）
- iframe 沙箱预览
- 显示网格/标尺辅助线
- 快速统计（颜色数、字体数、组件数）

#### 分析报告页
- 设计系统可视化（色板、字体展示）
- 布局分析可视化
- 组件样式展示
- AI 建议列表
- 导出 Markdown 功能

---

## 🔧 技术实现要点

### Chrome 插件关键功能

#### 1. 页面提取（基于原脚本）
```typescript
// 核心提取逻辑
class PageExtractor {
  async extract() {
    // 1. 获取 HTML
    const html = document.documentElement.outerHTML;
    
    // 2. 内联 CSS（参考原脚本 inlinePageCSS）
    const css = await this.inlineCSS();
    
    // 3. 收集资源（参考原脚本 collectPageAssets）
    const assets = await this.collectAssets();
    
    // 4. 重写资源路径（参考原脚本 rewriteAssetsToLocal）
    await this.rewriteAssetPaths();
    
    return { html, css, assets, metadata };
  }
}
```

#### 2. 后台上传
```typescript
// Background Service Worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPLOAD_SNAPSHOT') {
    uploadToBackend(message.data)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error }));
    return true; // 异步响应
  }
});
```

### Next.js 后台关键功能

#### 1. 快照存储
```typescript
// Drizzle Schema
export const snapshots = pgTable('snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  url: text('url').notNull(),
  title: text('title').notNull(),
  html: text('html').notNull(),
  css: text('css').notNull(),
  assets: jsonb('assets').notNull(),
  metadata: jsonb('metadata').notNull(),
  tags: text('tags').array(),
  category: text('category'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### 2. AI 分析
```typescript
// Server Action
'use server';
export async function analyzeSnapshot(snapshotId: string) {
  const snapshot = await db.query.snapshots.findFirst({
    where: eq(snapshots.id, snapshotId)
  });
  
  const analysis = await generateObject({
    model: openai('gpt-4-turbo'),
    schema: styleAnalysisSchema,
    prompt: buildAnalysisPrompt(snapshot),
  });
  
  await db.insert(analyses).values({
    snapshotId,
    ...analysis.object,
  });
  
  return analysis.object;
}
```

#### 3. Markdown 生成
```typescript
export function generateMarkdownReport(analysis: StyleAnalysis): string {
  return `
# 页面风格分析报告

## 基本信息
- **页面标题**: ${analysis.title}
- **URL**: ${analysis.url}
- **采集时间**: ${analysis.capturedAt}

## 设计系统
### 色彩方案
${analysis.designSystem.colors.primary.map(c => `- ${c}`).join('\n')}

### 字体系统
- **主字体**: ${analysis.designSystem.typography.fontFamilies.join(', ')}

## AI 建议
${analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;
}
```

---

## 📊 数据库设计

### 核心表结构

#### snapshots 表
```sql
CREATE TABLE snapshots (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  html TEXT NOT NULL,
  css TEXT NOT NULL,
  assets JSONB NOT NULL,
  metadata JSONB NOT NULL,
  tags TEXT[],
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### analyses 表
```sql
CREATE TABLE analyses (
  id UUID PRIMARY KEY,
  snapshot_id UUID REFERENCES snapshots(id),
  design_system JSONB NOT NULL,
  layout JSONB NOT NULL,
  components JSONB NOT NULL,
  visual_style JSONB NOT NULL,
  summary TEXT NOT NULL,
  recommendations TEXT[],
  generated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 开发路线图

### Phase 1: MVP（4周）
- [ ] Chrome 插件基础功能
- [ ] 页面提取和上传
- [ ] Next.js 后台基础框架
- [ ] 快照列表和预览
- [ ] 基础 AI 分析

### Phase 2: 增强（3周）
- [ ] 高级预览功能（响应式切换）
- [ ] 完整的 AI 分析报告
- [ ] Markdown 导出
- [ ] 用户认证系统

### Phase 3: 优化（2周）
- [ ] 性能优化
- [ ] UI/UX 完善
- [ ] 批量操作
- [ ] 分享功能

---

## 📝 内容要求

### Markdown 报告必须包含
1. **基本信息**: URL、标题、采集时间、视口尺寸
2. **设计系统**: 
   - 色彩方案（主色、辅助色、中性色）
   - 字体系统（字体族、大小、行高、字重）
   - 间距系统（基础单位、常用间距）
   - 圆角系统（常用圆角值）
3. **布局分析**:
   - 布局方式（Grid/Flexbox）
   - 栅格系统（列数、间距）
   - 最大宽度
   - 响应式断点
4. **组件风格**:
   - 按钮（样式、尺寸、状态）
   - 卡片（边框、阴影、内边距）
   - 表单（输入框、标签、验证）
   - 导航（样式、交互）
5. **视觉特征**:
   - 整体风格定位
   - 动画效果
   - 阴影使用
   - 渐变/特效
6. **技术栈推测**: 框架、库、工具
7. **可访问性评估**: 对比度、语义化、键盘导航
8. **AI 建议**: 3-5 条改进建议

### 报告质量标准
- **准确性**: AI 分析结果需与实际页面一致
- **完整性**: 涵盖所有关键设计元素
- **可读性**: 结构清晰，易于理解
- **可操作性**: 建议具体、可执行
- **专业性**: 使用正确的设计和技术术语

---

## 🎯 成功指标

### 用户体验
- 插件提取速度 < 3 秒
- 预览加载时间 < 2 秒
- AI 分析完成时间 < 30 秒

### 功能完整性
- 支持 95% 以上的常见网站
- CSS 内联准确率 > 90%
- 资源下载成功率 > 85%
- AI 分析准确率 > 80%

### 系统性能
- 支持单个快照 < 10MB
- 数据库查询 < 100ms
- API 响应时间 < 500ms

---

**文档版本**: 1.0  
**创建日期**: 2025-11-23  
**最后更新**: 2025-11-23
