/**
 * 页面提取器 - Playwright 版本
 * 复用 Chrome Extension 的提取逻辑
 */

/**
 * 在页面上下文中执行提取
 * @param {import('playwright').Page} page
 * @param {Object} options
 * @returns {Promise<Object>} snapshot
 */
export async function extractPage(page, options = {}) {
  const { inlineCSS = true, collectImages = true, collectFonts = true } = options;

  const snapshot = await page.evaluate(async ({ inlineCSS, collectImages, collectFonts }) => {
    const startTime = Date.now();

    // 提取 HTML
    function extractHTML() {
      const clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll('script').forEach(el => el.remove());
      clone.querySelectorAll('noscript').forEach(el => el.remove());
      clone.querySelectorAll('*').forEach(el => {
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('on')) {
            el.removeAttribute(attr.name);
          }
        });
      });
      return clone.outerHTML;
    }

    // 内联 CSS
    async function getInlineCSS() {
      const cssTexts = [];

      // 内联样式表
      document.querySelectorAll('style').forEach(style => {
        if (style.textContent) {
          cssTexts.push(`/* Inline Style */\n${style.textContent}`);
        }
      });

      // 外部样式表
      const styleSheets = Array.from(document.styleSheets);
      for (const sheet of styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          const css = rules.map(rule => rule.cssText).join('\n');
          if (css) {
            const href = sheet.href || 'embedded';
            cssTexts.push(`/* Stylesheet: ${href} */\n${css}`);
          }
        } catch (e) {
          if (sheet.href) {
            try {
              const response = await fetch(sheet.href, { mode: 'cors', credentials: 'omit' });
              if (response.ok) {
                const css = await response.text();
                cssTexts.push(`/* External: ${sheet.href} */\n${css}`);
              }
            } catch (fetchError) {
              cssTexts.push(`/* Failed to load: ${sheet.href} */`);
            }
          }
        }
      }

      return cssTexts.join('\n\n');
    }

    // 收集图片
    function collectImagesData() {
      const images = [];
      const seen = new Set();

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

      return images;
    }

    // 收集字体
    function collectFontsData() {
      const fonts = new Set();
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          Array.from(sheet.cssRules || []).forEach(rule => {
            if (rule instanceof CSSFontFaceRule) {
              const fontFamily = rule.style.getPropertyValue('font-family');
              const src = rule.style.getPropertyValue('src');
              if (src) {
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
        } catch (e) {}
      });
      return Array.from(fonts).map(f => JSON.parse(f));
    }

    // 收集元数据
    function collectMetadata() {
      const getMetaContent = (name) => {
        const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
        return meta ? meta.getAttribute('content') : null;
      };

      return {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1
        },
        userAgent: navigator.userAgent,
        language: document.documentElement.lang || navigator.language,
        charset: document.characterSet,
        meta: {
          description: getMetaContent('description'),
          keywords: getMetaContent('keywords'),
          author: getMetaContent('author'),
          ogImage: getMetaContent('og:image'),
          ogTitle: getMetaContent('og:title'),
          ogDescription: getMetaContent('og:description')
        },
        stats: {
          totalElements: document.querySelectorAll('*').length,
          totalImages: document.querySelectorAll('img').length,
          totalLinks: document.querySelectorAll('a').length,
          totalScripts: document.querySelectorAll('script').length,
          totalStyles: document.querySelectorAll('style, link[rel="stylesheet"]').length
        }
      };
    }

    // 执行提取
    const html = extractHTML();
    let css = '';
    if (inlineCSS) {
      try {
        css = await getInlineCSS();
      } catch (e) {
        css = '/* CSS extraction failed */';
      }
    }

    const assets = {
      images: collectImages ? collectImagesData() : [],
      fonts: collectFonts ? collectFontsData() : []
    };

    const metadata = collectMetadata();

    return {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: window.location.href,
      title: document.title,
      html,
      css,
      assets,
      metadata,
      extractedAt: new Date().toISOString(),
      extractionTime: Date.now() - startTime
    };
  }, { inlineCSS, collectImages, collectFonts });

  return snapshot;
}
