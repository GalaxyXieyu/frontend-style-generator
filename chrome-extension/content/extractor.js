/**
 * 页面提取器 - Content Script
 * 在页面中运行，提取 HTML、CSS 和资源
 */
class PageExtractor {
  constructor(options = {}) {
    this.options = {
      inlineCSS: true,
      collectImages: true,
      collectFonts: true,
      ...options
    };
  }
  
  /**
   * 提取当前页面的完整快照
   */
  async extract() {
    console.log('[StyleGenerator] 开始提取页面...');
    const startTime = Date.now();
    
    try {
      // 1. 提取 HTML
      const html = this.extractHTML();
      
      // 2. 内联 CSS（带超时保护）
      let css = '';
      if (this.options.inlineCSS) {
        try {
          const cssPromise = this.inlineCSS();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('CSS 提取超时')), 10000)
          );
          css = await Promise.race([cssPromise, timeoutPromise]);
        } catch (cssError) {
          console.warn('[StyleGenerator] CSS 提取失败，继续处理:', cssError.message);
          css = '/* CSS 提取失败 */';
        }
      }
      
      // 3. 收集资源
      const assets = {
        images: this.options.collectImages ? this.collectImages() : [],
        fonts: this.options.collectFonts ? this.collectFonts() : []
      };
      
      // 4. 收集元数据
      const metadata = this.collectMetadata();
      
      // 5. 生成快照对象
      const snapshot = {
        id: this.generateId(),
        url: window.location.href,
        title: document.title,
        html,
        css,
        assets,
        metadata,
        extractedAt: new Date().toISOString(),
        extractionTime: Date.now() - startTime
      };
      
      console.log('[StyleGenerator] 提取完成，耗时:', snapshot.extractionTime, 'ms');
      console.log('[StyleGenerator] HTML 大小:', (html.length / 1024).toFixed(2), 'KB');
      console.log('[StyleGenerator] CSS 大小:', (css.length / 1024).toFixed(2), 'KB');
      
      return snapshot;
    } catch (error) {
      console.error('[StyleGenerator] 提取失败:', error);
      throw new Error(`提取失败: ${error.message}`);
    }
  }
  
  /**
   * 提取 HTML
   */
  extractHTML() {
    // 克隆整个文档
    const clone = document.documentElement.cloneNode(true);
    
    // 移除脚本标签（避免执行）
    clone.querySelectorAll('script').forEach(el => el.remove());
    
    // 移除 noscript 标签
    clone.querySelectorAll('noscript').forEach(el => el.remove());
    
    // 移除事件监听器属性
    clone.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      });
    });
    
    return clone.outerHTML;
  }
  
  /**
   * 内联 CSS
   * 收集所有样式表并合并
   */
  async inlineCSS() {
    const cssTexts = [];
    
    // 1. 收集内联样式表
    document.querySelectorAll('style').forEach(style => {
      if (style.textContent) {
        cssTexts.push(`/* Inline Style */\n${style.textContent}`);
      }
    });
    
    // 2. 收集外部样式表
    const styleSheets = Array.from(document.styleSheets);
    
    for (const sheet of styleSheets) {
      try {
        // 同源样式表可以直接读取
        const rules = Array.from(sheet.cssRules || []);
        const css = rules.map(rule => rule.cssText).join('\n');
        
        if (css) {
          const href = sheet.href || 'embedded';
          cssTexts.push(`/* Stylesheet: ${href} */\n${css}`);
        }
      } catch (e) {
        if (sheet.href) {
          try {
            console.log('[StyleGenerator] 尝试通过 fetch 获取样式表:', sheet.href);
            const response = await fetch(sheet.href, { mode: 'cors', credentials: 'omit' });
            if (response.ok) {
              const css = await response.text();
              cssTexts.push(`/* External: ${sheet.href} */\n${css}`);
            } else {
              console.warn('[StyleGenerator] 样式表响应非 2xx:', sheet.href, response.status);
              cssTexts.push(`/* Failed to load (status ${response.status}): ${sheet.href} */`);
            }
          } catch (fetchError) {
            console.warn('[StyleGenerator] 无法获取样式表:', sheet.href, fetchError.message);
            cssTexts.push(`/* Failed to load: ${sheet.href} */`);
          }
        }
      }
    }
    
    return cssTexts.join('\n\n');
  }
  
  /**
   * 收集图片资源
   */
  collectImages() {
    const images = [];
    const seen = new Set();
    
    // img 标签
    document.querySelectorAll('img[src]').forEach(img => {
      if (!seen.has(img.src)) {
        seen.add(img.src);
        images.push({
          type: 'img',
          src: img.src,
          alt: img.alt || '',
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      }
    });
    
    // CSS background-image
    document.querySelectorAll('*').forEach(el => {
      const bg = window.getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none') {
        const matches = bg.match(/url\(['"]?([^'"]+)['"]?\)/g);
        if (matches) {
          matches.forEach(match => {
            const url = match.match(/url\(['"]?([^'"]+)['"]?\)/)[1];
            if (!seen.has(url)) {
              seen.add(url);
              images.push({
                type: 'background',
                src: url,
                element: el.tagName.toLowerCase()
              });
            }
          });
        }
      }
    });
    
    // srcset
    document.querySelectorAll('img[srcset], source[srcset]').forEach(el => {
      const srcset = el.getAttribute('srcset');
      if (srcset) {
        srcset.split(',').forEach(item => {
          const [url] = item.trim().split(/\s+/);
          if (url && !seen.has(url)) {
            seen.add(url);
            images.push({
              type: 'srcset',
              src: url
            });
          }
        });
      }
    });
    
    console.log('[StyleGenerator] 收集到', images.length, '个图片资源');
    return images;
  }
  
  /**
   * 收集字体资源
   */
  collectFonts() {
    const fonts = new Set();
    
    // 从 CSS 中提取 @font-face
    Array.from(document.styleSheets).forEach(sheet => {
      try {
        Array.from(sheet.cssRules || []).forEach(rule => {
          if (rule instanceof CSSFontFaceRule) {
            const fontFamily = rule.style.getPropertyValue('font-family');
            const src = rule.style.getPropertyValue('src');
            
            if (src) {
              // 提取 URL
              const matches = src.match(/url\(['"]?([^'"]+)['"]?\)/g);
              if (matches) {
                matches.forEach(match => {
                  const url = match.match(/url\(['"]?([^'"]+)['"]?\)/)[1];
                  fonts.add(JSON.stringify({
                    family: fontFamily?.replace(/['"]/g, ''),
                    url
                  }));
                });
              }
            }
          }
        });
      } catch (e) {
        // 跨域样式表
      }
    });
    
    const fontList = Array.from(fonts).map(f => JSON.parse(f));
    console.log('[StyleGenerator] 收集到', fontList.length, '个字体资源');
    return fontList;
  }
  
  /**
   * 收集页面元数据
   */
  collectMetadata() {
    return {
      // 视口信息
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1
      },
      
      // 浏览器信息
      userAgent: navigator.userAgent,
      language: document.documentElement.lang || navigator.language,
      charset: document.characterSet,
      
      // Meta 标签
      meta: {
        description: this.getMetaContent('description'),
        keywords: this.getMetaContent('keywords'),
        author: this.getMetaContent('author'),
        ogImage: this.getMetaContent('og:image'),
        ogTitle: this.getMetaContent('og:title'),
        ogDescription: this.getMetaContent('og:description')
      },
      
      // 性能指标
      performance: this.getPerformanceMetrics(),
      
      // 页面统计
      stats: {
        totalElements: document.querySelectorAll('*').length,
        totalImages: document.querySelectorAll('img').length,
        totalLinks: document.querySelectorAll('a').length,
        totalScripts: document.querySelectorAll('script').length,
        totalStyles: document.querySelectorAll('style, link[rel="stylesheet"]').length
      }
    };
  }
  
  /**
   * 获取 Meta 标签内容
   */
  getMetaContent(name) {
    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
    return meta ? meta.getAttribute('content') : null;
  }
  
  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    if (!window.performance || !window.performance.timing) {
      return null;
    }
    
    const timing = performance.timing;
    const navigation = performance.navigation;
    
    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: this.getFirstPaint(),
      navigationType: navigation.type,
      redirectCount: navigation.redirectCount
    };
  }
  
  /**
   * 获取首次绘制时间
   */
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }
  
  /**
   * 生成唯一 ID
   */
  generateId() {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 监听来自 popup 的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extract') {
    console.log('[StyleGenerator] 收到提取请求，选项:', request.options);
    
    const extractor = new PageExtractor(request.options);
    
    extractor.extract()
      .then(snapshot => {
        console.log('[StyleGenerator] 提取成功');
        sendResponse({ success: true, snapshot });
      })
      .catch(error => {
        console.error('[StyleGenerator] 提取失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // 返回 true 表示异步响应
    return true;
  }
});

console.log('[StyleGenerator] Content script loaded');
