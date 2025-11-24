/**
 * 组件加载器 - 动态加载 HTML 组件
 */
export class ComponentLoader {
  constructor() {
    this.cache = new Map(); // 缓存已加载的组件
  }

  /**
   * 加载单个组件
   * @param {string} componentPath - 组件路径
   * @returns {Promise<string>} 组件 HTML 内容
   */
  async loadComponent(componentPath) {
    // 检查缓存
    if (this.cache.has(componentPath)) {
      return this.cache.get(componentPath);
    }

    try {
      const response = await fetch(componentPath);
      if (!response.ok) {
        throw new Error(`Failed to load component: ${componentPath}`);
      }
      
      const html = await response.text();
      this.cache.set(componentPath, html);
      return html;
    } catch (error) {
      console.error(`[ComponentLoader] Error loading ${componentPath}:`, error);
      throw error;
    }
  }

  /**
   * 加载多个组件
   * @param {Array<{path: string, target: string}>} components - 组件配置数组
   * @returns {Promise<void>}
   */
  async loadComponents(components) {
    const promises = components.map(async ({ path, target }) => {
      try {
        const html = await this.loadComponent(path);
        const targetElement = document.querySelector(target);
        
        if (targetElement) {
          targetElement.innerHTML = html;
          console.log(`[ComponentLoader] ✓ Loaded: ${path} → ${target}`);
        } else {
          console.warn(`[ComponentLoader] ⚠️ Target not found: ${target}`);
        }
      } catch (error) {
        console.error(`[ComponentLoader] ✗ Failed to load ${path}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * 插入组件到指定位置
   * @param {string} componentPath - 组件路径
   * @param {HTMLElement} targetElement - 目标元素
   * @param {string} position - 插入位置 (beforebegin, afterbegin, beforeend, afterend)
   */
  async insertComponent(componentPath, targetElement, position = 'beforeend') {
    try {
      const html = await this.loadComponent(componentPath);
      targetElement.insertAdjacentHTML(position, html);
      console.log(`[ComponentLoader] ✓ Inserted: ${componentPath}`);
    } catch (error) {
      console.error(`[ComponentLoader] ✗ Failed to insert ${componentPath}:`, error);
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('[ComponentLoader] Cache cleared');
  }

  /**
   * 获取缓存信息
   */
  getCacheInfo() {
    return {
      size: this.cache.size,
      components: Array.from(this.cache.keys())
    };
  }
}

// 导出单例
export const componentLoader = new ComponentLoader();
