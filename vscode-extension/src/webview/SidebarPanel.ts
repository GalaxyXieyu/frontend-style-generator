import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FileManager } from '../fileManager';

export class SidebarPanel implements vscode.WebviewViewProvider {
  public static readonly viewType = 'designLearnSidebar';
  private _view?: vscode.WebviewView;
  private _extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this._extensionUri = extensionUri;
  }

  public refresh() {
    if (this._view) {
      this._loadSnapshots();
    }
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'media')]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(message => {
      switch (message.type) {
        case 'extract':
          this._extractUrl(message.url, false);
          break;
        case 'extractWithAI':
          this._extractUrl(message.url, true);
          break;
        case 'openSettings':
          vscode.commands.executeCommand('design-learn.openSettings');
          break;
        case 'loadData':
          this._loadData();
          break;
        case 'openSnapshot':
          if (message.path && fs.existsSync(message.path)) {
            vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(message.path));
          }
          break;
        case 'viewSnapshot':
          this._viewSnapshotHtml(message.path);
          break;
        case 'deleteSnapshot':
          this._deleteSnapshot(message.path);
          break;
        case 'selectModel':
          this._selectModel(message.modelId);
          break;
      }
    });
  }

  private async _extractUrl(url: string, useAI: boolean) {
    if (!url || !url.trim()) {
      vscode.window.showErrorMessage('请输入有效的 URL');
      return;
    }

    try {
      new URL(url);
    } catch {
      vscode.window.showErrorMessage('请输入有效的 URL 格式');
      return;
    }

    this._view?.webview.postMessage({ type: 'extracting', status: true });

    const command = useAI ? 'design-learn.extractWithAI' : 'design-learn.extract';
    const originalShowInputBox = vscode.window.showInputBox;
    vscode.window.showInputBox = async (options) => {
      if (options?.prompt?.includes('URL')) return url;
      return originalShowInputBox(options);
    };
    
    await vscode.commands.executeCommand(command);
    vscode.window.showInputBox = originalShowInputBox;
    
    this._view?.webview.postMessage({ type: 'extracting', status: false });
    setTimeout(() => this._loadSnapshots(), 2000);
  }

  private _loadData() {
    setImmediate(() => {
      this._loadModels();
      this._loadSnapshots();
    });
  }

  private _loadModels() {
    const config = vscode.workspace.getConfiguration('designLearn');
    const models = config.get<any[]>('aiModels', []);
    const selectedModelId = config.get<string>('selectedModel', '');
    
    this._view?.webview.postMessage({
      type: 'updateModels',
      models,
      selectedModelId
    });
  }

  private _selectModel(modelId: string) {
    const config = vscode.workspace.getConfiguration('designLearn');
    config.update('selectedModel', modelId, vscode.ConfigurationTarget.Global);
    this._loadModels();
  }

  private async _loadSnapshots() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      this._view?.webview.postMessage({ type: 'updateSnapshots', snapshots: [] });
      return;
    }

    try {
      const fileManager = new FileManager(workspaceFolder.uri.fsPath);
      const snapshotDir = fileManager.getDirectories().snapshots;

      if (!fs.existsSync(snapshotDir)) {
        this._view?.webview.postMessage({ type: 'updateSnapshots', snapshots: [] });
        return;
      }

      const entries = fs.readdirSync(snapshotDir, { withFileTypes: true });
      const snapshots: any[] = [];
      const dirs = entries.filter(e => e.isDirectory()).slice(0, 30);
      
      for (const entry of dirs) {
        const folder = path.join(snapshotDir, entry.name);
        const metadataPath = path.join(folder, 'metadata.json');
        const snapshot: any = { id: entry.name, path: folder, title: entry.name, url: '', date: '', hasAnalysis: false };

        if (fs.existsSync(metadataPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            snapshot.title = meta.title || entry.name;
            snapshot.url = meta.url || '';
            snapshot.date = meta.extractedAt ? new Date(meta.extractedAt).toLocaleString() : '';
          } catch {}
        }

        const analysisPath = path.join(folder, 'analysis.md');
        snapshot.hasAnalysis = fs.existsSync(analysisPath);
        snapshots.push(snapshot);
      }

      snapshots.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      this._view?.webview.postMessage({ type: 'updateSnapshots', snapshots });
    } catch {
      this._view?.webview.postMessage({ type: 'updateSnapshots', snapshots: [] });
    }
  }

  private async _viewSnapshotHtml(snapshotPath: string) {
    const htmlPath = path.join(snapshotPath, 'index.html');
    if (fs.existsSync(htmlPath)) {
      const doc = await vscode.workspace.openTextDocument(htmlPath);
      await vscode.window.showTextDocument(doc);
    }
  }

  private async _deleteSnapshot(snapshotPath: string) {
    if (!snapshotPath || !fs.existsSync(snapshotPath)) return;

    const confirm = await vscode.window.showWarningMessage('确定要删除这个快照吗？', { modal: true }, '删除');
    if (confirm === '删除') {
      try {
        fs.rmSync(snapshotPath, { recursive: true });
        this._loadSnapshots();
        vscode.window.showInformationMessage('快照已删除');
      } catch (err: any) {
        vscode.window.showErrorMessage(`删除失败: ${err.message}`);
      }
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root { --accent: #4a9eff; --accent-hover: #3d8ce6; --success: #4caf50; --warning: #ff9800; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: var(--vscode-font-family); font-size: 13px; color: var(--vscode-foreground); background: var(--vscode-sideBar-background); }
    .container { padding: 12px; }
    
    /* 头部 */
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--vscode-panel-border); }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, var(--accent), #67b8ff); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .logo-icon svg { width: 18px; height: 18px; color: white; }
    .logo-text h1 { font-size: 15px; font-weight: 600; }
    .logo-text p { font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 2px; }
    .header-actions { display: flex; gap: 6px; }
    .icon-btn { width: 30px; height: 30px; border: none; background: var(--vscode-button-secondaryBackground); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--vscode-foreground); transition: all 0.2s; }
    .icon-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
    .icon-btn svg { width: 16px; height: 16px; }

    /* URL 输入 */
    .url-section { margin-bottom: 12px; }
    .url-wrapper { position: relative; display: flex; align-items: center; }
    .url-input { width: 100%; padding: 10px 12px 10px 36px; background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); border-radius: 8px; color: var(--vscode-input-foreground); font-size: 12px; transition: border-color 0.2s; }
    .url-input:focus { outline: none; border-color: var(--accent); }
    .url-icon { position: absolute; left: 12px; color: var(--vscode-descriptionForeground); }
    .url-icon svg { width: 14px; height: 14px; }

    /* 按钮组 */
    .btn-group { display: flex; gap: 8px; margin-bottom: 16px; }
    .btn { flex: 1; padding: 10px 12px; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, var(--accent), #67b8ff); color: white; }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
    .btn svg { width: 14px; height: 14px; }
    .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* 分区 */
    .section { background: var(--vscode-editor-background); border-radius: 10px; padding: 12px; margin-bottom: 12px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--vscode-descriptionForeground); }
    .section-badge { background: var(--accent); color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; }

    /* AI 模型 */
    .model-list { display: flex; flex-direction: column; gap: 6px; }
    .model-card { padding: 10px; background: var(--vscode-input-background); border: 1px solid transparent; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.2s; }
    .model-card:hover { background: var(--vscode-list-hoverBackground); }
    .model-card.selected { border-color: var(--accent); background: rgba(74, 158, 255, 0.1); }
    .model-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 700; }
    .model-info { flex: 1; min-width: 0; }
    .model-name { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
    .model-provider { font-size: 10px; color: var(--vscode-descriptionForeground); }
    .model-check { color: var(--accent); display: none; }
    .model-card.selected .model-check { display: block; }
    .empty-state { text-align: center; padding: 20px 12px; color: var(--vscode-descriptionForeground); }
    .empty-state svg { width: 40px; height: 40px; margin-bottom: 8px; opacity: 0.5; }
    .empty-state p { font-size: 12px; margin-bottom: 10px; }
    .empty-btn { padding: 8px 16px; background: var(--accent); color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .empty-btn:hover { background: var(--accent-hover); }

    /* 快照列表 */
    .snapshot-list { max-height: 350px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
    .snapshot-item { padding: 10px; background: var(--vscode-input-background); border-radius: 8px; cursor: pointer; position: relative; transition: all 0.2s; }
    .snapshot-item:hover { background: var(--vscode-list-hoverBackground); }
    .snapshot-header { display: flex; align-items: flex-start; gap: 8px; }
    .snapshot-thumb { width: 40px; height: 40px; background: linear-gradient(135deg, #374151, #4b5563); border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .snapshot-thumb svg { width: 20px; height: 20px; color: #9ca3af; }
    .snapshot-content { flex: 1; min-width: 0; }
    .snapshot-title { font-size: 12px; font-weight: 600; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .snapshot-url { font-size: 10px; color: var(--vscode-descriptionForeground); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px; }
    .snapshot-meta { display: flex; align-items: center; gap: 8px; }
    .snapshot-date { font-size: 10px; color: var(--vscode-descriptionForeground); opacity: 0.7; }
    .snapshot-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(76, 175, 80, 0.2); color: var(--success); }
    .snapshot-actions { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); display: none; gap: 4px; }
    .snapshot-item:hover .snapshot-actions { display: flex; }
    .snapshot-action { width: 24px; height: 24px; border: none; background: var(--vscode-button-secondaryBackground); border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--vscode-foreground); }
    .snapshot-action:hover { background: var(--vscode-button-secondaryHoverBackground); }
    .snapshot-action.delete:hover { background: #ef4444; color: white; }
    .snapshot-action svg { width: 12px; height: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="logo-text">
          <h1>Design-Learn</h1>
          <p>智能学习页面设计风格</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="icon-btn" id="settingsBtn" title="设置">
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2"/></svg>
        </button>
      </div>
    </header>

    <div class="url-section">
      <div class="url-wrapper">
        <span class="url-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
        <input type="url" id="urlInput" class="url-input" placeholder="输入要提取的网页 URL">
      </div>
    </div>

    <div class="btn-group">
      <button id="extractBtn" class="btn btn-primary">
        <svg viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>提取设计</span>
      </button>
      <button id="extractAIBtn" class="btn btn-secondary">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="13" r="1" fill="currentColor"/><circle cx="15" cy="13" r="1" fill="currentColor"/><path d="M9 17h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <span>AI 分析</span>
      </button>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">AI 模型</span>
      </div>
      <div id="modelContainer" class="model-list">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" stroke="currentColor" stroke-width="2"/></svg>
          <p>尚未配置 AI 模型</p>
          <button class="empty-btn" onclick="vscode.postMessage({type:'openSettings'})">配置模型</button>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <span class="section-title">快照列表</span>
        <span class="section-badge" id="snapshotCount">0</span>
      </div>
      <div id="snapshotList" class="snapshot-list">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <p>暂无快照记录</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    let isExtracting = false;
    
    document.getElementById('settingsBtn').onclick = () => vscode.postMessage({type:'openSettings'});
    
    document.getElementById('extractBtn').onclick = () => {
      if (isExtracting) return;
      const url = document.getElementById('urlInput').value.trim();
      if (!url) { 
        document.getElementById('urlInput').focus();
        return; 
      }
      vscode.postMessage({type:'extract', url});
    };
    
    document.getElementById('extractAIBtn').onclick = () => {
      if (isExtracting) return;
      const url = document.getElementById('urlInput').value.trim();
      if (!url) { 
        document.getElementById('urlInput').focus();
        return; 
      }
      vscode.postMessage({type:'extractWithAI', url});
    };
    
    document.getElementById('urlInput').onkeypress = (e) => {
      if (e.key === 'Enter') document.getElementById('extractBtn').click();
    };
    
    window.addEventListener('message', e => {
      const msg = e.data;
      if (msg.type === 'updateModels') renderModels(msg.models, msg.selectedModelId);
      if (msg.type === 'updateSnapshots') renderSnapshots(msg.snapshots);
      if (msg.type === 'extracting') setExtracting(msg.status);
    });

    function setExtracting(status) {
      isExtracting = status;
      const btn = document.getElementById('extractBtn');
      const aiBtn = document.getElementById('extractAIBtn');
      if (status) {
        btn.disabled = true;
        aiBtn.disabled = true;
        btn.innerHTML = '<div class="spinner"></div><span>提取中...</span>';
      } else {
        btn.disabled = false;
        aiBtn.disabled = false;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>提取设计</span>';
      }
    }
    
    function renderModels(models, selectedId) {
      const c = document.getElementById('modelContainer');
      if (!models || !models.length) {
        c.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none"><path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" stroke="currentColor" stroke-width="2"/></svg><p>尚未配置 AI 模型</p><button class="empty-btn" onclick="vscode.postMessage({type:\\'openSettings\\'})">配置模型</button></div>';
        return;
      }
      c.innerHTML = models.map(m => {
        const isSelected = m.id === selectedId;
        const initial = (m.name || 'AI')[0].toUpperCase();
        return '<div class="model-card' + (isSelected ? ' selected' : '') + '" onclick="vscode.postMessage({type:\\'selectModel\\',modelId:\\'' + m.id + '\\'})">' +
          '<div class="model-icon">' + initial + '</div>' +
          '<div class="model-info"><div class="model-name">' + m.name + '</div><div class="model-provider">' + (m.provider || m.baseUrl || '') + '</div></div>' +
          '<svg class="model-check" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '</div>';
      }).join('');
    }
    
    function renderSnapshots(snapshots) {
      document.getElementById('snapshotCount').textContent = snapshots.length;
      const c = document.getElementById('snapshotList');
      if (!snapshots || !snapshots.length) {
        c.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><p>暂无快照记录</p></div>';
        return;
      }
      const escapePath = (p) => p.replace(/\\\\/g,'\\\\\\\\').replace(/'/g,"\\\\'");
      c.innerHTML = snapshots.map(s => {
        const path = escapePath(s.path);
        return '<div class="snapshot-item">' +
          '<div class="snapshot-header">' +
          '<div class="snapshot-thumb"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
          '<div class="snapshot-content">' +
          '<div class="snapshot-title">' + s.title + '</div>' +
          (s.url ? '<div class="snapshot-url">' + s.url + '</div>' : '') +
          '<div class="snapshot-meta">' +
          (s.date ? '<span class="snapshot-date">' + s.date + '</span>' : '') +
          (s.hasAnalysis ? '<span class="snapshot-badge">AI</span>' : '') +
          '</div></div></div>' +
          '<div class="snapshot-actions">' +
          '<button class="snapshot-action" onclick="event.stopPropagation();vscode.postMessage({type:\\'viewSnapshot\\',path:\\'' + path + '\\'})" title="查看"><svg viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg></button>' +
          '<button class="snapshot-action" onclick="event.stopPropagation();vscode.postMessage({type:\\'openSnapshot\\',path:\\'' + path + '\\'})" title="打开文件夹"><svg viewBox="0 0 24 24" fill="none"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="currentColor" stroke-width="2"/></svg></button>' +
          '<button class="snapshot-action delete" onclick="event.stopPropagation();vscode.postMessage({type:\\'deleteSnapshot\\',path:\\'' + path + '\\'})" title="删除"><svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
          '</div></div>';
      }).join('');
    }
    
    vscode.postMessage({type:'loadData'});
  </script>
</body>
</html>`;
  }
}
