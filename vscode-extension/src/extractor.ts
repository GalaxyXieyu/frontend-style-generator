import { Snapshot, ImageAsset, FontAsset } from './types';
import { execSync } from 'child_process';
import * as fs from 'fs';

export { Snapshot, ImageAsset, FontAsset };

type ExtractOptions = {
    inlineCSS?: boolean;
    collectImages?: boolean;
    collectFonts?: boolean;
};

export class PageExtractor {
    private browser: any = null;

    /**
     * 提取页面快照
     */
    async extract(url: string, options: ExtractOptions = {}): Promise<Snapshot> {
        const startTime = Date.now();
        const opts = {
            inlineCSS: true,
            collectImages: true,
            collectFonts: true,
            ...options
        };

        // 动态导入 puppeteer，避免模块加载时出错
        const puppeteer = await import('puppeteer');

        try {
            // 查找系统 Chrome 路径
            const chromePath = this.findChromePath();
            
            // 启动浏览器
            this.browser = await puppeteer.launch({
                headless: true,
                executablePath: chromePath,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await this.browser.newPage();
            
            // 设置视口
            await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

            // 导航到页面
            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 60000
            });

            // 等待页面完全加载
            await page.waitForTimeout(2000);

            // 提取数据
            const snapshot = await page.evaluate((opts: ExtractOptions) => {
                const startTime = Date.now();

                // 提取 HTML
                const html = document.documentElement.outerHTML;

                // 提取 CSS
                let css = '';
                if (opts.inlineCSS) {
                    const cssTexts: string[] = [];

                    // 收集内联样式
                    document.querySelectorAll('style').forEach((style: HTMLStyleElement) => {
                        if (style.textContent) {
                            cssTexts.push(`/* Inline Style */\n${style.textContent}`);
                        }
                    });

                    // 收集外部样式表
                    Array.from(document.styleSheets).forEach((sheet: CSSStyleSheet) => {
                        try {
                            const rules = Array.from(sheet.cssRules || []);
                            const css = rules.map((rule: CSSRule) => rule.cssText).join('\n');
                            if (css) {
                                const href = sheet.href || 'embedded';
                                cssTexts.push(`/* Stylesheet: ${href} */\n${css}`);
                            }
                        } catch (e) {
                            if (sheet.href) {
                                cssTexts.push(`/* Failed to load: ${sheet.href} */`);
                            }
                        }
                    });

                    css = cssTexts.join('\n\n');
                }

                // 收集图片
                const images: ImageAsset[] = [];
                const seenImages = new Set<string>();

                if (opts.collectImages) {
                    // img 标签
                    (document.querySelectorAll('img[src]') as NodeListOf<HTMLImageElement>).forEach((img) => {
                        if (!seenImages.has(img.src)) {
                            seenImages.add(img.src);
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
                    document.querySelectorAll('*').forEach((el: Element) => {
                        const bg = window.getComputedStyle(el).backgroundImage;
                        if (bg && bg !== 'none') {
                            const matches = bg.match(/url\(['"]?([^'"]+)['"]?\)/g);
                            if (matches) {
                                matches.forEach((match: string) => {
                                    const url = match.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
                                    if (url && !seenImages.has(url)) {
                                        seenImages.add(url);
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
                }

                // 收集字体
                const fonts: FontAsset[] = [];
                const seenFonts = new Set<string>();

                if (opts.collectFonts) {
                    Array.from(document.styleSheets).forEach((sheet: CSSStyleSheet) => {
                        try {
                            Array.from(sheet.cssRules || []).forEach((rule: CSSRule) => {
                                if (rule instanceof CSSFontFaceRule) {
                                    const fontFamily = rule.style.getPropertyValue('font-family');
                                    const src = rule.style.getPropertyValue('src');
                                    
                                    if (src) {
                                        const matches = src.match(/url\(['"]?([^'"]+)['"]?\)/g);
                                        if (matches) {
                                            matches.forEach((match: string) => {
                                                const url = match.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
                                                const normalizedFamily = (fontFamily || '').replace(/['"]/g, '');
                                                const key = `${normalizedFamily}-${url}`;
                                                if (url && !seenFonts.has(key)) {
                                                    seenFonts.add(key);
                                                    fonts.push({
                                                        family: normalizedFamily,
                                                        url
                                                    });
                                                }
                                            });
                                        }
                                    }
                                }
                            });
                        } catch (e) {
                            // 跨域样式表
                        }
                    });
                }

                // 收集元数据
                const getMetaContent = (name: string) => {
                    const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
                    return meta ? meta.getAttribute('content') : null;
                };

                const legacyPerformance = performance as Performance & {
                    timing?: PerformanceTiming;
                    navigation?: PerformanceNavigation;
                };
                const timing = legacyPerformance.timing;
                const navigationInfo = legacyPerformance.navigation;
                const paintEntries = (performance as Performance & {
                    getEntriesByType?: (type: string) => PerformanceEntry[];
                }).getEntriesByType?.('paint' as string) || [];
                const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');

                const metadata = {
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
                    performance: timing && navigationInfo ? {
                        loadTime: timing.loadEventEnd - timing.navigationStart,
                        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
                        firstPaint: firstPaint ? firstPaint.startTime : undefined,
                        navigationType: navigationInfo.type,
                        redirectCount: navigationInfo.redirectCount
                    } : undefined,
                    stats: {
                        totalElements: document.querySelectorAll('*').length,
                        totalImages: document.querySelectorAll('img').length,
                        totalLinks: document.querySelectorAll('a').length,
                        totalScripts: document.querySelectorAll('script').length,
                        totalStyles: document.querySelectorAll('style, link[rel="stylesheet"]').length
                    }
                };

                return {
                    id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    url: window.location.href,
                    title: document.title,
                    html,
                    css,
                    assets: {
                        images,
                        fonts
                    },
                    metadata,
                    extractedAt: new Date().toISOString(),
                    extractionTime: Date.now() - startTime
                } as Snapshot;
            }, opts) as Snapshot;

            snapshot.extractionTime = Date.now() - startTime;

            return snapshot;

        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    /**
     * 查找系统 Chrome 浏览器路径
     */
    private findChromePath(): string | undefined {
        const platform = process.platform;
        
        if (platform === 'darwin') {
            // macOS
            const paths = [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Chromium.app/Contents/MacOS/Chromium',
                '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
            ];
            for (const p of paths) {
                if (fs.existsSync(p)) {
                    return p;
                }
            }
        } else if (platform === 'win32') {
            // Windows
            const paths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
            ];
            for (const p of paths) {
                if (p && fs.existsSync(p)) {
                    return p;
                }
            }
        } else {
            // Linux
            const paths = [
                '/usr/bin/google-chrome',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/snap/bin/chromium'
            ];
            for (const p of paths) {
                if (fs.existsSync(p)) {
                    return p;
                }
            }
        }
        
        return undefined;
    }
}

