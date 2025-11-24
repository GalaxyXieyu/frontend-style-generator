# Chrome 插件技术方案 - 零依赖设计

## 🎯 核心设计原则

### 用户体验
- **零依赖**: 只需安装插件，无需 Node.js、Playwright 等
- **一键提取**: 点击插件图标即可提取当前页面
- **本地存储**: 使用 IndexedDB 本地保存，无需后端
- **即时预览**: 插件内直接预览提取结果

### 技术实现
- **纯浏览器 API**: 使用原生 JavaScript 和浏览器 API
- **Manifest V3**: 最新的 Chrome 扩展标准
- **轻量级**: 插件包体积 < 500KB

---

## 🏗️ 技术架构

```
Chrome Extension
├── Popup UI (用户界面)
├── Content Script (页面提取器)
├── Background Worker (数据处理)
└── IndexedDB (本地存储)
```

---

## 📦 项目结构

```
chrome-extension/
├── manifest.json              # 插件配置
├── icons/                     # 图标
├── popup/                     # 弹出窗口
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content/                   # 内容脚本
│   ├── extractor.js          # 核心提取逻辑
│   ├── css-inliner.js        # CSS 内联
│   └── asset-collector.js    # 资源收集
├── background/
│   └── service-worker.js     # 后台服务
└── lib/
    └── storage.js            # IndexedDB 封装
```

---

## 🔧 核心功能

### 1. Manifest V3 配置

```json
{
  "manifest_version": 3,
  "name": "Frontend Style Generator",
  "version": "1.0.0",
  "description": "一键提取网页设计风格",
  
  "permissions": [
    "activeTab",
    "storage",
    "tabs"
  ],
  
  "action": {
    "default_popup": "popup/popup.html"
  },
  
  "background": {
    "service_worker": "background/service-worker.js"
  },
  
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/extractor.js"]
    }
  ]
}
```

### 2. 页面提取器

```javascript
// content/extractor.js
class PageExtractor {
  async extract() {
    return {
      id: this.generateId(),
      url: window.location.href,
      title: document.title,
      html: document.documentElement.outerHTML,
      css: await this.inlineCSS(),
      assets: this.collectAssets(),
      metadata: this.collectMetadata(),
      extractedAt: new Date().toISOString()
    };
  }
  
  async inlineCSS() {
    const cssTexts = [];
    
    // 收集所有样式表
    for (const sheet of document.styleSheets) {
      try {
        const rules = Array.from(sheet.cssRules);
        cssTexts.push(rules.map(r => r.cssText).join('\n'));
      } catch (e) {
        // 跨域样式表
        if (sheet.href) {
          const response = await fetch(sheet.href);
          cssTexts.push(await response.text());
        }
      }
    }
    
    return cssTexts.join('\n\n');
  }
  
  collectAssets() {
    return {
      images: this.collectImages(),
      fonts: this.collectFonts()
    };
  }
  
  collectImages() {
    return Array.from(document.querySelectorAll('img[src]'))
      .map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.naturalWidth,
        height: img.naturalHeight
      }));
  }
  
  collectFonts() {
    const fonts = new Set();
    
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        Array.from(sheet.cssRules).forEach(rule => {
          if (rule instanceof CSSFontFaceRule) {
            const src = rule.style.getPropertyValue('src');
            if (src) {
              fonts.add(src);
            }
          }
        });
      } catch (e) {}
    });
    
    return Array.from(fonts);
  }
  
  collectMetadata() {
    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      userAgent: navigator.userAgent,
      language: document.documentElement.lang
    };
  }
  
  generateId() {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    new PageExtractor().extract()
      .then(snapshot => sendResponse({ success: true, snapshot }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});
```

### 3. Popup UI

```javascript
// popup/popup.js
class PopupController {
  async extractPage() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // 发送消息到 content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: 'extract'
    });
    
    if (response.success) {
      // 保存到 IndexedDB
      await this.saveSnapshot(response.snapshot);
      
      // 显示成功
      alert('提取成功！');
    }
  }
  
  async saveSnapshot(snapshot) {
    const db = await this.openDB();
    const tx = db.transaction('snapshots', 'readwrite');
    await tx.objectStore('snapshots').add(snapshot);
  }
  
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('StyleGenerator', 1);
      
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.createObjectStore('snapshots', { keyPath: 'id' });
      };
    });
  }
}
```

---

## 🚀 开发步骤

### Phase 1: 基础功能（1周）
- [ ] 创建 Manifest V3 配置
- [ ] 实现基础页面提取（HTML + CSS）
- [ ] 实现 Popup UI
- [ ] 实现 IndexedDB 存储

### Phase 2: 增强功能（1周）
- [ ] 资源收集（图片、字体）
- [ ] 预览功能
- [ ] 下载功能
- [ ] 历史记录

### Phase 3: 优化（3天）
- [ ] UI/UX 优化
- [ ] 性能优化
- [ ] 错误处理
- [ ] 打包发布

---

## 📝 使用流程

1. 用户安装插件
2. 访问任意网页
3. 点击插件图标
4. 点击"提取页面风格"按钮
5. 等待提取完成（2-5秒）
6. 可以预览、下载或保存到云端

**完全零依赖，开箱即用！**

---

**文档版本**: 1.0  
**创建日期**: 2025-11-23
