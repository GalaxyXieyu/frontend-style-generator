/**
 * 路由扫描器 - Playwright 版本
 * 复用 Chrome Extension 的路由扫描逻辑
 */

/**
 * 在页面上下文中扫描路由
 * @param {import('playwright').Page} page
 * @param {Object} options
 * @returns {Promise<string[]>} routes
 */
export async function scanRoutes(page, options = {}) {
  const { maxDepth = null, limit = 10, excludePatterns = [] } = options;

  const result = await page.evaluate(async ({ maxDepth, limit, excludePatterns }) => {
    const baseUrl = new URL(window.location.href);
    const routes = new Set();

    function addPath(path) {
      if (!path) return;
      if (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
      }
      routes.add(path);
    }

    // 添加当前页面
    addPath(baseUrl.pathname);

    // 收集所有链接
    document.querySelectorAll('a[href]').forEach(link => {
      try {
        const href = link.getAttribute('href');
        if (!href) return;
        const url = new URL(href, baseUrl);
        if (url.origin === baseUrl.origin) {
          addPath(url.pathname);
        }
      } catch (e) {}
    });

    // 扫描导航菜单
    const navSelectors = [
      'nav a[href]',
      'header a[href]',
      '[role="navigation"] a[href]',
      '.nav a[href]',
      '.navigation a[href]',
      '.menu a[href]',
      '.navbar a[href]'
    ];

    navSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(link => {
        try {
          const href = link.getAttribute('href');
          if (!href) return;
          const url = new URL(href, baseUrl);
          if (url.origin === baseUrl.origin) {
            addPath(url.pathname);
          }
        } catch (e) {}
      });
    });

    // 尝试获取 sitemap
    const sitemapPaths = ['/sitemap.xml', '/wp-sitemap.xml', '/sitemap_index.xml'];
    for (const path of sitemapPaths) {
      try {
        const sitemapUrl = new URL(path, baseUrl);
        const response = await fetch(sitemapUrl.toString());
        if (response.ok) {
          const text = await response.text();
          const parser = new DOMParser();
          const xml = parser.parseFromString(text, 'text/xml');
          const urls = xml.querySelectorAll('url loc');
          urls.forEach(loc => {
            try {
              const url = new URL(loc.textContent);
              if (url.origin === baseUrl.origin) {
                addPath(url.pathname);
              }
            } catch (e) {}
          });
          if (urls.length > 0) break;
        }
      } catch (e) {}
    }

    // 过滤和排序
    let routeList = Array.from(routes);

    // 按深度排序
    routeList.sort((a, b) => {
      const depthA = a.split('/').filter(Boolean).length;
      const depthB = b.split('/').filter(Boolean).length;
      return depthA - depthB;
    });

    // 过滤
    routeList = routeList.filter(route => {
      for (const pattern of excludePatterns) {
        if (route.includes(pattern)) return false;
      }
      if (maxDepth !== null) {
        const depth = route.split('/').filter(Boolean).length;
        if (depth > maxDepth) return false;
      }
      return true;
    });

    // 限制数量
    if (limit !== null) {
      routeList = routeList.slice(0, limit);
    }

    return {
      routes: routeList,
      total: routes.size
    };
  }, { maxDepth, limit, excludePatterns });

  return result;
}

/**
 * 智能分组路由
 * @param {string[]} routes
 * @returns {Object}
 */
export function groupRoutes(routes) {
  const groups = {
    root: [],
    blog: [],
    docs: [],
    products: [],
    other: []
  };

  routes.forEach(route => {
    if (route === '/') {
      groups.root.push(route);
    } else if (route.includes('/blog')) {
      groups.blog.push(route);
    } else if (route.includes('/doc')) {
      groups.docs.push(route);
    } else if (route.includes('/product')) {
      groups.products.push(route);
    } else {
      groups.other.push(route);
    }
  });

  return groups;
}

/**
 * 生成完整 URL 列表
 * @param {string} baseUrl
 * @param {string[]} routes
 * @returns {string[]}
 */
export function buildFullUrls(baseUrl, routes) {
  const base = new URL(baseUrl);
  return routes.map(route => {
    const url = new URL(route, base);
    return url.href;
  });
}
