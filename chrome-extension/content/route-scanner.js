/**
 * 路由扫描器
 * 自动发现网站的所有路由
 */
class RouteScanner {
  constructor() {
    this.baseUrl = new URL(window.location.href);
    this.routes = new Set();
  }
  
  /**
   * 扫描当前页面的所有链接
   */
  scanCurrentPage() {
    console.log('[RouteScanner] 开始扫描路由...');
    
    // 1. 收集所有链接
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      try {
        const href = link.getAttribute('href');
        if (!href) return;
        
        // 解析 URL
        const url = new URL(href, this.baseUrl);
        
        // 只保留同域名的链接
        if (url.origin === this.baseUrl.origin) {
          // 移除 hash 和 query
          const cleanPath = url.pathname;
          this.routes.add(cleanPath);
        }
      } catch (e) {
        // 忽略无效的 URL
      }
    });
    
    // 2. 扫描导航菜单
    this.scanNavigation();
    
    // 3. 扫描 sitemap（如果存在）
    this.scanSitemap();
    
    const routeList = Array.from(this.routes).sort();
    console.log('[RouteScanner] 发现', routeList.length, '个路由');
    
    return routeList;
  }
  
  /**
   * 扫描导航菜单
   */
  scanNavigation() {
    // 常见的导航选择器
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
          
          const url = new URL(href, this.baseUrl);
          if (url.origin === this.baseUrl.origin) {
            this.routes.add(url.pathname);
          }
        } catch (e) {}
      });
    });
  }
  
  /**
   * 尝试获取 sitemap
   */
  async scanSitemap() {
    try {
      const sitemapUrl = new URL('/sitemap.xml', this.baseUrl);
      const response = await fetch(sitemapUrl.toString());
      
      if (response.ok) {
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        
        const urls = xml.querySelectorAll('url loc');
        urls.forEach(loc => {
          try {
            const url = new URL(loc.textContent);
            if (url.origin === this.baseUrl.origin) {
              this.routes.add(url.pathname);
            }
          } catch (e) {}
        });
      }
    } catch (e) {
      // Sitemap 不存在或无法访问
    }
  }
  
  /**
   * 智能分组路由
   */
  groupRoutes(routes) {
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
   * 过滤路由
   */
  filterRoutes(routes, options = {}) {
    const {
      excludePatterns = [],
      maxDepth = null,
      limit = null
    } = options;
    
    let filtered = routes.filter(route => {
      // 排除特定模式
      for (const pattern of excludePatterns) {
        if (route.includes(pattern)) return false;
      }
      
      // 限制深度
      if (maxDepth !== null) {
        const depth = route.split('/').filter(Boolean).length;
        if (depth > maxDepth) return false;
      }
      
      return true;
    });
    
    // 限制数量
    if (limit !== null) {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  }
}

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scanRoutes') {
    const scanner = new RouteScanner();
    const routes = scanner.scanCurrentPage();
    const groups = scanner.groupRoutes(routes);
    
    sendResponse({
      success: true,
      routes,
      groups,
      total: routes.length
    });
    
    return true;
  }
});

console.log('[RouteScanner] Route scanner loaded');
