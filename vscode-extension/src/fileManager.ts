import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Snapshot } from './extractor';

export class FileManager {
    private workspacePath: string;
    private baseDir: string;
    private snapshotsDir: string;
    private templatesDir: string;
    private rulesDir: string;

    constructor(workspacePath: string) {
        this.workspacePath = workspacePath;
        
        // 获取配置的保存路径（默认 ${workspaceFolder}/.designlearn）
        const config = vscode.workspace.getConfiguration('designLearn');
        const configuredPath = config.get<string>('savePath', '${workspaceFolder}/.designlearn');
        
        // 替换占位符
        const resolvedPath = configuredPath.replace('${workspaceFolder}', workspacePath);
        this.baseDir = resolvedPath;
        this.snapshotsDir = path.join(this.baseDir, 'snapshots');
        this.templatesDir = path.join(this.baseDir, 'templates');
        this.rulesDir = path.join(this.baseDir, 'rules');

        this.ensureDirectory(this.baseDir);
        this.ensureDirectory(this.snapshotsDir);
        this.ensureDirectory(this.templatesDir);
        this.ensureDirectory(this.rulesDir);
    }

    /**
     * 暴露目录信息，方便其他模块写入静态页和规则
     */
    getDirectories() {
        return {
            base: this.baseDir,
            snapshots: this.snapshotsDir,
            templates: this.templatesDir,
            rules: this.rulesDir
        };
    }

    private ensureDirectory(dir: string) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    /**
     * 保存快照
     */
    async saveSnapshot(snapshot: Snapshot): Promise<string[]> {
        const savedFiles: string[] = [];

        // 创建以域名命名的子目录
        const url = new URL(snapshot.url);
        const domain = url.hostname.replace(/\./g, '_');
        const timestamp = new Date(snapshot.extractedAt).toISOString().split('T')[0];
        const folderName = `${domain}_${timestamp}_${snapshot.id.substring(0, 8)}`;
        const snapshotDir = path.join(this.snapshotsDir, folderName);

        if (!fs.existsSync(snapshotDir)) {
            fs.mkdirSync(snapshotDir, { recursive: true });
        }

        // 保存 HTML
        const htmlPath = path.join(snapshotDir, 'index.html');
        const htmlContent = this.createStandaloneHTML(snapshot);
        fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
        savedFiles.push(htmlPath);

        // 保存 CSS
        const cssPath = path.join(snapshotDir, 'styles.css');
        fs.writeFileSync(cssPath, snapshot.css, 'utf-8');
        savedFiles.push(cssPath);

        // 保存元数据 JSON
        const jsonPath = path.join(snapshotDir, 'metadata.json');
        fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2), 'utf-8');
        savedFiles.push(jsonPath);

        // 保存资源列表
        const assetsPath = path.join(snapshotDir, 'assets.json');
        fs.writeFileSync(assetsPath, JSON.stringify(snapshot.assets, null, 2), 'utf-8');
        savedFiles.push(assetsPath);

        return savedFiles;
    }

    /**
     * 保存 Markdown 报告
     */
    async saveMarkdown(snapshot: Snapshot, markdown: string): Promise<string> {
        const url = new URL(snapshot.url);
        const domain = url.hostname.replace(/\./g, '_');
        const timestamp = new Date(snapshot.extractedAt).toISOString().split('T')[0];
        const folderName = `${domain}_${timestamp}_${snapshot.id.substring(0, 8)}`;
        const snapshotDir = path.join(this.snapshotsDir, folderName);

        if (!fs.existsSync(snapshotDir)) {
            fs.mkdirSync(snapshotDir, { recursive: true });
        }

        const title = snapshot.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
        const markdownPath = path.join(snapshotDir, `${title}_style.md`);
        fs.writeFileSync(markdownPath, markdown, 'utf-8');

        return markdownPath;
    }

    /**
     * 创建独立的 HTML 文件（包含内联 CSS）
     */
    private createStandaloneHTML(snapshot: Snapshot): string {
        return `<!DOCTYPE html>
<html lang="${snapshot.metadata.language || 'zh-CN'}">
<head>
    <meta charset="${snapshot.metadata.charset || 'UTF-8'}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(snapshot.title)}</title>
    <style>
${snapshot.css}
    </style>
</head>
<body>
${snapshot.html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || snapshot.html}
</body>
</html>`;
    }

    /**
     * 转义 HTML
     */
    private escapeHtml(text: string): string {
        const map: { [key: string]: string } = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

