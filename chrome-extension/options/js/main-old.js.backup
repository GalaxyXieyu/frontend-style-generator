/**
 * 主控制器
 * 整合所有模块和组件
 */
import { StorageManager } from './utils/storage.js';
import { Notification } from './utils/notification.js';
import { ModelManager } from './components/ModelManager.js';
import { PromptPreview } from './components/PromptPreview.js';
import { PromptTemplateManager } from './components/PromptTemplateManager.js';

class OptionsApp {
  constructor() {
    this.storage = new StorageManager();
    this.currentPage = 'models';
    this.modelManager = null;
    this.templateManager = null;
    this.promptPreview = null;
    this.history = [];
    this.init();
  }

  async init() {
    await this.initComponents();
    this.bindGlobalEvents();
    await this.loadExtractOptions();
    await this.loadGenerateConfig();
    await this.loadStats();
  }

  /**
   * 初始化组件
   */
  async initComponents() {
    // 初始化模型管理器
    this.modelManager = new ModelManager();

    // 初始化模板管理器
    this.templateManager = new PromptTemplateManager();

    // 初始化提示词预览（传入模板管理器）
    this.promptPreview = new PromptPreview(this.templateManager);
  }

  /**
   * 绑定全局事件
   */
  bindGlobalEvents() {
    // 侧边栏导航
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        this.switchPage(e.currentTarget.dataset.page);
      });
    });

    // 提取选项变化自动保存
    ['extractInlineCSS', 'extractCollectImages', 'extractCollectFonts'].forEach(id => {
      document.getElementById(id)?.addEventListener('change', () => {
        this.saveExtractOptions();
      });
    });
    
    // 生成配置变化自动保存
    ['includeColors', 'includeTypography', 'includeLayout', 'includeComponents', 'includeAccessibility', 'includeRecommendations', 'language'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => {
          this.saveGenerateConfig();
        });
      }
    });
    
    // 生成配置保存按钮（兼容旧版本）
    document.getElementById('saveGenerateConfigBtn')?.addEventListener('click', () => {
      this.saveGenerateConfig();
    });

    // 历史记录搜索
    document.getElementById('searchHistory')?.addEventListener('input', (e) => {
      this.filterHistory(e.target.value);
    });

    document.getElementById('filterType')?.addEventListener('change', () => {
      this.filterHistory();
    });

    // 数据管理
    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('importDataBtn')?.addEventListener('click', () => {
      document.getElementById('importFileInput')?.click();
    });

    document.getElementById('importFileInput')?.addEventListener('change', (e) => {
      this.importData(e.target.files[0]);
    });

    document.getElementById('viewBackupsBtn')?.addEventListener('click', () => {
      this.viewBackups();
    });

    document.getElementById('clearDataBtn')?.addEventListener('click', () => {
      this.clearData();
    });
  }

  /**
   * 切换页面
   */
  switchPage(page) {
    this.currentPage = page;

    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // 更新页面显示
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === `${page}Page`);
    });

    // 加载对应页面数据
    if (page === 'history') {
      this.loadHistory();
      this.loadStats();
    }
  }

  /**
   * 加载提取选项
   */
  async loadExtractOptions() {
    try {
      const result = await chrome.storage.local.get(['extractOptions']);
      const options = result.extractOptions || {
        inlineCSS: true,
        collectImages: true,
        collectFonts: true
      };

      document.getElementById('extractInlineCSS').checked = options.inlineCSS;
      document.getElementById('extractCollectImages').checked = options.collectImages;
      document.getElementById('extractCollectFonts').checked = options.collectFonts;
    } catch (error) {
      console.error('加载提取选项失败:', error);
    }
  }

  /**
   * 保存提取选项
   */
  async saveExtractOptions() {
    const options = {
      inlineCSS: document.getElementById('extractInlineCSS').checked,
      collectImages: document.getElementById('extractCollectImages').checked,
      collectFonts: document.getElementById('extractCollectFonts').checked
    };

    await chrome.storage.local.set({ extractOptions: options });
    Notification.success('提取选项已保存');
  }

  /**
   * 加载生成配置
   */
  async loadGenerateConfig() {
    try {
      const config = await this.storage.getConfig('generateConfig');
      if (config) {
        document.getElementById('includeColors').checked = config.includeColors ?? true;
        document.getElementById('includeTypography').checked = config.includeTypography ?? true;
        document.getElementById('includeLayout').checked = config.includeLayout ?? true;
        document.getElementById('includeComponents').checked = config.includeComponents ?? true;
        document.getElementById('includeAccessibility').checked = config.includeAccessibility ?? true;
        document.getElementById('includeRecommendations').checked = config.includeRecommendations ?? true;
        document.getElementById('language').value = config.language || 'zh-CN';
      }
    } catch (error) {
      console.error('加载生成配置失败:', error);
    }
  }

  /**
   * 保存生成配置
   */
  async saveGenerateConfig() {
    const config = {
      includeColors: document.getElementById('includeColors').checked,
      includeTypography: document.getElementById('includeTypography').checked,
      includeLayout: document.getElementById('includeLayout').checked,
      includeComponents: document.getElementById('includeComponents').checked,
      includeAccessibility: document.getElementById('includeAccessibility').checked,
      includeRecommendations: document.getElementById('includeRecommendations').checked,
      language: document.getElementById('language').value,
      autoGenerate: true // 默认总是自动生成
    };

    await this.storage.setConfig({ generateConfig: config });
    Notification.success('生成配置已保存');
  }

  /**
   * 加载历史记录
   */
  async loadHistory() {
    try {
      const snapshots = await this.storage.getAllSnapshots();
      this.history = snapshots.sort((a, b) => 
        new Date(b.extractedAt) - new Date(a.extractedAt)
      );
      this.displayHistory(this.history);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      Notification.error('加载历史记录失败');
    }
  }

  /**
   * 显示历史记录
   */
  displayHistory(items) {
    const list = document.getElementById('historyList');
    
    if (items.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="1.5"/>
          </svg>
          <p>暂无历史记录</p>
        </div>
      `;
      return;
    }

    // 按域名分组
    const groupedByDomain = this.groupByDomain(items);
    list.innerHTML = this.createDomainGroups(groupedByDomain);
    this.bindHistoryEvents();
  }

  /**
   * 按域名分组历史记录
   */
  groupByDomain(items) {
    const groups = {};
    
    items.forEach(item => {
      try {
        const url = new URL(item.url);
        const domain = url.hostname;
        
        if (!groups[domain]) {
          groups[domain] = {
            domain,
            items: [],
            totalSize: 0
          };
        }
        
        groups[domain].items.push(item);
        groups[domain].totalSize += item.html.length + item.css.length;
      } catch (e) {
        // 如果 URL 解析失败，归类到 "其他"
        if (!groups['其他']) {
          groups['其他'] = {
            domain: '其他',
            items: [],
            totalSize: 0
          };
        }
        groups['其他'].items.push(item);
      }
    });
    
    // 转换为数组并按记录数量排序
    return Object.values(groups).sort((a, b) => b.items.length - a.items.length);
  }

  /**
   * 创建域名分组 HTML
   */
  createDomainGroups(groups) {
    return groups.map(group => {
      const isExpanded = this.expandedDomains?.has(group.domain) ?? true;
      const hasMarkdown = group.items.filter(item => item.markdown).length;
      const unanalyzed = group.items.filter(item => !item.markdown).length;
      
      return `
        <div class="domain-group" data-domain="${group.domain}">
          <div class="domain-header">
            <div class="domain-info" data-action="toggleDomain" data-domain="${group.domain}">
              <svg class="collapse-icon ${isExpanded ? 'expanded' : ''}" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div>
                <div class="domain-name">${group.domain}</div>
                <div class="domain-stats">
                  <span>${group.items.length} 条记录</span>
                  <span>${hasMarkdown} 条已分析</span>
                  <span>${(group.totalSize / 1024).toFixed(2)} KB</span>
                </div>
              </div>
            </div>
            ${unanalyzed > 0 ? `
              <button class="domain-analyze-btn" data-action="analyzeAll" data-domain="${group.domain}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>批量分析 (${unanalyzed})</span>
              </button>
            ` : ''}
          </div>
          <div class="domain-items ${isExpanded ? 'expanded' : ''}">
            ${group.items.map(item => this.createHistoryItem(item)).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * 创建历史记录项
   */
  createHistoryItem(item) {
    const date = new Date(item.extractedAt);
    const hasMarkdown = item.markdown !== undefined;
    
    return `
      <div class="history-item">
        <div class="history-header">
          <div>
            <div class="history-title">${item.title}</div>
            <div class="history-url">${item.url}</div>
          </div>
          <div class="history-actions">
            <button class="action-btn" data-action="viewHtml" data-id="${item.id}">
              查看 HTML
            </button>
            ${hasMarkdown ? `
              <button class="action-btn primary" data-action="viewMarkdown" data-id="${item.id}">
                查看分析
              </button>
            ` : `
              <button class="action-btn" data-action="generate" data-id="${item.id}">
                生成分析
              </button>
            `}
            <button class="action-btn" data-action="download" data-id="${item.id}">
              下载
            </button>
          </div>
        </div>
        <div class="history-meta">
          <span>提取时间: ${date.toLocaleString('zh-CN')}</span>
          <span>HTML: ${(item.html.length / 1024).toFixed(2)} KB</span>
          <span>CSS: ${(item.css.length / 1024).toFixed(2)} KB</span>
          ${hasMarkdown ? `<span>✓ 已生成分析</span>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * 绑定历史记录事件
   */
  bindHistoryEvents() {
    // 初始化展开状态
    if (!this.expandedDomains) {
      this.expandedDomains = new Set();
      // 默认展开所有域名
      document.querySelectorAll('.domain-group').forEach(group => {
        this.expandedDomains.add(group.dataset.domain);
      });
    }

    // 域名折叠/展开
    document.querySelectorAll('.domain-info[data-action="toggleDomain"]').forEach(info => {
      info.addEventListener('click', (e) => {
        const domain = e.currentTarget.dataset.domain;
        this.toggleDomain(domain);
      });
    });

    // 批量分析按钮
    document.querySelectorAll('.domain-analyze-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const domain = e.currentTarget.dataset.domain;
        this.analyzeAllInDomain(domain);
      });
    });

    // 历史记录操作按钮
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止触发域名折叠
        const action = e.currentTarget.dataset.action;
        const id = e.currentTarget.dataset.id;
        this.handleHistoryAction(action, id);
      });
    });
  }

  /**
   * 切换域名展开/折叠状态
   */
  toggleDomain(domain) {
    const group = document.querySelector(`.domain-group[data-domain="${domain}"]`);
    if (!group) return;

    const items = group.querySelector('.domain-items');
    const icon = group.querySelector('.collapse-icon');
    
    if (this.expandedDomains.has(domain)) {
      this.expandedDomains.delete(domain);
      items.classList.remove('expanded');
      icon.classList.remove('expanded');
    } else {
      this.expandedDomains.add(domain);
      items.classList.add('expanded');
      icon.classList.add('expanded');
    }
  }

  /**
   * 处理历史记录操作
   */
  handleHistoryAction(action, id) {
    const item = this.history.find(h => h.id === id);
    if (!item) return;

    switch (action) {
      case 'viewHtml':
        this.viewHtml(item);
        break;
      case 'viewMarkdown':
        this.viewMarkdown(item);
        break;
      case 'generate':
        this.generateMarkdown(item);
        break;
      case 'download':
        this.downloadSnapshot(item);
        break;
    }
  }

  /**
   * 查看 HTML
   */
  viewHtml(item) {
    const blob = new Blob([item.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  /**
   * 查看 Markdown
   */
  viewMarkdown(item) {
    if (!item.markdown) return;
    const blob = new Blob([item.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  /**
   * 批量分析域名下所有未分析的记录
   */
  async analyzeAllInDomain(domain) {
    const items = this.history.filter(item => {
      try {
        const url = new URL(item.url);
        return url.hostname === domain && !item.markdown;
      } catch {
        return domain === '其他' && !item.markdown;
      }
    });

    if (items.length === 0) {
      Notification.info('该域名下没有需要分析的记录');
      return;
    }

    Notification.info(`开始批量分析 ${items.length} 条记录...`);
    
    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
      try {
        const result = await this.generateMarkdown(item, true);
        if (result) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
        console.error('分析失败:', error);
      }
    }

    // 刷新显示
    await this.loadHistory();
    await this.loadStats();

    if (failCount === 0) {
      Notification.success(`批量分析完成！成功 ${successCount} 条`);
    } else {
      Notification.warning(`批量分析完成！成功 ${successCount} 条，失败 ${failCount} 条`);
    }
  }

  /**
   * 生成 Markdown
   */
  async generateMarkdown(item, silent = false) {
    try {
      const btn = document.querySelector(`.action-btn.primary[data-action="viewMarkdown"][data-id="${item.id}"]`) ||
                  document.querySelector(`.action-btn[data-action="generate"][data-id="${item.id}"]`);
      if (btn) {
        btn.disabled = true;
        btn.textContent = '分析中...';
      }

      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_SNAPSHOT',
        snapshot: item
      });

      if (response.success) {
        item.markdown = response.markdown;
        if (!silent) {
          this.displayHistory(this.history);
          this.loadStats();
          const fmt = response.format === 'json' ? '（结构化）' : '（文本）';
          Notification.success('分析已生成并弹出下载 ' + fmt);
        }
        return true;
      } else {
        const errorMsg = response.error || '未知错误';
        if (!silent) {
          Notification.error('分析失败：' + errorMsg);
        }
        console.error('分析失败:', errorMsg);
        return false;
      }
    } catch (error) {
      const errorMsg = error.message || '未知错误';
      if (!silent) {
        Notification.error('分析失败：' + errorMsg);
      }
      console.error('分析异常:', error);
      return false;
    } finally {
      const btn = document.querySelector(`.action-btn[data-action="generate"][data-id="${item.id}"]`);
      if (btn) btn.disabled = false;
    }
  }

  /**
   * 下载快照
   */
  downloadSnapshot(item) {
    const data = {
      html: item.html,
      css: item.css,
      markdown: item.markdown,
      metadata: item.metadata
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  /**
   * 筛选历史记录
   */
  filterHistory(searchText = '') {
    const filterType = document.getElementById('filterType')?.value || 'all';
    const search = searchText.toLowerCase();
    
    let filtered = this.history;
    
    // 按类型筛选
    if (filterType === 'html') {
      filtered = filtered.filter(item => !item.markdown);
    } else if (filterType === 'markdown') {
      filtered = filtered.filter(item => item.markdown);
    }
    
    // 按搜索文本筛选
    if (search) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(search) ||
        item.url.toLowerCase().includes(search)
      );
    }
    
    this.displayHistory(filtered);
  }

  /**
   * 加载统计数据
   */
  async loadStats() {
    try {
      const snapshotCount = await this.storage.getSnapshotCount();
      const analysisCount = this.history.filter(h => h.markdown).length;
      const storageSize = await this.storage.calculateStorageSize();

      document.getElementById('snapshotCount').textContent = snapshotCount;
      document.getElementById('analysisCount').textContent = analysisCount;
      document.getElementById('storageSize').textContent = (storageSize / 1024 / 1024).toFixed(2) + ' MB';
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  }

  /**
   * 导出数据
   */
  async exportData() {
    try {
      const data = await this.storage.exportAllData();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      const filename = `design-learn-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
      a.download = filename;
      a.click();
      
      URL.revokeObjectURL(url);
      Notification.success('数据导出成功！建议妥善保管备份文件');
    } catch (error) {
      Notification.error('导出失败：' + error.message);
    }
  }

  /**
   * 导入数据
   */
  async importData(file) {
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!confirm(`⚠️ 确定要导入备份数据吗？\n\n备份时间：${data.exportDate}\n包含 ${data.metadata.snapshotCount} 个快照\n\n当前数据会被先备份，然后替换为导入的数据。`)) {
        return;
      }
      
      await this.storage.importData(data);
      Notification.success('数据导入成功');
      setTimeout(() => location.reload(), 1500);
    } catch (error) {
      Notification.error('导入失败：' + error.message);
      console.error('Import error:', error);
    }
  }

  /**
   * 查看备份列表
   */
  async viewBackups() {
    try {
      const backups = await this.storage.listBackups();
      
      if (backups.length === 0) {
        Notification.info('暂无自动备份');
        return;
      }
      
      const message = `找到 ${backups.length} 个自动备份：\n\n` +
        backups.map((b, i) => `${i + 1}. ${new Date(b.date).toLocaleString('zh-CN')}`).join('\n') +
        `\n\n💡 提示：这些是系统自动创建的备份，会在保存配置前自动备份。\n建议定期使用"导出备份文件"手动备份重要数据。`;
      
      alert(message);
    } catch (error) {
      Notification.error('查看备份失败：' + error.message);
    }
  }

  /**
   * 清除数据
   */
  async clearData() {
    if (!confirm('⚠️ 确定要清除任务与快照吗？\n\n这将删除所有任务记录与页面快照，模型与生成配置将被保留。此操作不可恢复！')) {
      return;
    }
    
    try {
      await this.storage.clearSnapshots();
      await this.storage.removeKeys(['tasks']);
      
      Notification.success('所有数据已清除');
      setTimeout(() => location.reload(), 1000);
    } catch (error) {
      Notification.error('清除失败：' + error.message);
    }
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  new OptionsApp();
});
