(function() {
  const vscode = acquireVsCodeApi();

  // DOM 元素
  const urlInput = document.getElementById('urlInput');
  const clearUrlBtn = document.getElementById('clearUrlBtn');
  const extractBtn = document.getElementById('extractBtn');
  const extractAIBtn = document.getElementById('extractAIBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const configureModelBtn = document.getElementById('configureModelBtn');
  const modelSelectorContainer = document.getElementById('modelSelectorContainer');
  const snapshotList = document.getElementById('snapshotList');
  const snapshotCount = document.getElementById('snapshotCount');

  let models = [];
  let selectedModelId = null;

  // 初始化
  function init() {
    bindEvents();
    vscode.postMessage({ type: 'loadData' });
  }

  // 绑定事件
  function bindEvents() {
    // URL 输入
    urlInput.addEventListener('input', () => {
      clearUrlBtn.style.display = urlInput.value ? 'flex' : 'none';
    });

    clearUrlBtn.addEventListener('click', () => {
      urlInput.value = '';
      clearUrlBtn.style.display = 'none';
      urlInput.focus();
    });

    // 提取按钮
    extractBtn.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) {
        urlInput.focus();
        urlInput.style.borderColor = '#f44336';
        setTimeout(() => {
          urlInput.style.borderColor = '';
        }, 1500);
        return;
      }
      vscode.postMessage({ type: 'extract', url: url });
    });

    extractAIBtn.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) {
        urlInput.focus();
        urlInput.style.borderColor = '#f44336';
        setTimeout(() => {
          urlInput.style.borderColor = '';
        }, 1500);
        return;
      }
      vscode.postMessage({ type: 'extractWithAI', url: url });
    });

    // 设置按钮
    settingsBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'openSettings' });
    });

    if (configureModelBtn) {
      configureModelBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'openSettings' });
      });
    }

    // Enter 键提取
    urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        extractBtn.click();
      }
    });
  }

  // 更新模型列表
  function updateModels(newModels) {
    models = newModels || [];
    
    if (models.length === 0) {
      modelSelectorContainer.innerHTML = `
        <div class="model-empty">
          <div class="model-empty-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <p class="model-empty-text">尚未配置 AI 模型</p>
          <button class="model-empty-btn" onclick="window.openSettings()">配置模型</button>
        </div>
      `;
      return;
    }

    const activeModel = models.find(m => m.active) || models[0];
    selectedModelId = activeModel?.id;

    let html = '<div class="model-list">';
    models.forEach(model => {
      const isActive = model.id === selectedModelId;
      const initial = (model.name || 'AI')[0].toUpperCase();
      html += `
        <div class="model-card ${isActive ? 'active' : ''}" data-id="${model.id}">
          <div class="model-icon">${initial}</div>
          <div class="model-info">
            <div class="model-name">${escapeHtml(model.name)}</div>
            <div class="model-provider">${escapeHtml(model.provider || model.baseUrl || '')}</div>
          </div>
          <svg class="model-check" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      `;
    });
    html += '</div>';
    
    modelSelectorContainer.innerHTML = html;

    // 绑定模型点击事件
    document.querySelectorAll('.model-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        selectModel(id);
      });
    });
  }

  function selectModel(id) {
    selectedModelId = id;
    document.querySelectorAll('.model-card').forEach(card => {
      card.classList.toggle('active', card.dataset.id === id);
    });
  }

  // 更新快照列表
  function updateSnapshots(snapshots) {
    snapshots = snapshots || [];
    snapshotCount.textContent = snapshots.length;

    if (snapshots.length === 0) {
      snapshotList.innerHTML = `
        <div class="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/>
            <path d="M12 8V12L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <p>暂无快照</p>
          <span class="empty-hint">提取网页后将显示在这里</span>
        </div>
      `;
      return;
    }

    let html = '';
    snapshots.forEach(snapshot => {
      html += `
        <div class="snapshot-item" data-path="${escapeHtml(snapshot.path)}">
          <div class="snapshot-header">
            <div class="snapshot-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <div class="snapshot-title" title="${escapeHtml(snapshot.title)}">${escapeHtml(snapshot.title)}</div>
            <div class="snapshot-actions">
              <button class="snapshot-action-btn open" title="打开文件夹">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <polyline points="15 3 21 3 21 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
              <button class="snapshot-action-btn delete" title="删除">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
          ${snapshot.url ? `<div class="snapshot-url" title="${escapeHtml(snapshot.url)}">${escapeHtml(snapshot.url)}</div>` : ''}
          ${snapshot.date ? `<div class="snapshot-date">${escapeHtml(snapshot.date)}</div>` : ''}
        </div>
      `;
    });

    snapshotList.innerHTML = html;

    // 绑定快照点击事件
    document.querySelectorAll('.snapshot-item').forEach(item => {
      const path = item.dataset.path;
      
      item.querySelector('.open')?.addEventListener('click', (e) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'openSnapshot', path: path });
      });

      item.querySelector('.delete')?.addEventListener('click', (e) => {
        e.stopPropagation();
        vscode.postMessage({ type: 'deleteSnapshot', path: path });
      });

      item.addEventListener('click', () => {
        vscode.postMessage({ type: 'openSnapshot', path: path });
      });
    });
  }

  // HTML 转义
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 全局函数
  window.openSettings = function() {
    vscode.postMessage({ type: 'openSettings' });
  };

  // 监听消息
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.type) {
      case 'updateModels':
        updateModels(message.models);
        break;
      case 'updateSnapshots':
        updateSnapshots(message.snapshots);
        break;
    }
  });

  // 启动
  init();
})();
