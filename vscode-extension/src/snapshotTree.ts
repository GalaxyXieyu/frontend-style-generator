import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FileManager } from './fileManager';
import { Snapshot } from './types';

export class SnapshotTreeProvider implements vscode.TreeDataProvider<SnapshotTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<SnapshotTreeItem | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<SnapshotTreeItem | undefined | void> = this._onDidChangeTreeData.event;

    constructor(private workspacePath?: string) {}

    setWorkspacePath(workspacePath?: string) {
        this.workspacePath = workspacePath;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getChildCount(): number {
        if (!this.workspacePath) return 0;
        const fileManager = new FileManager(this.workspacePath);
        const snapshotDir = fileManager.getDirectories().snapshots;
        if (!fs.existsSync(snapshotDir)) return 0;
        return fs.readdirSync(snapshotDir, { withFileTypes: true }).filter(e => e.isDirectory()).length;
    }

    getTreeItem(element: SnapshotTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: SnapshotTreeItem): Promise<SnapshotTreeItem[]> {
        if (!this.workspacePath) {
            return [];
        }

        const fileManager = new FileManager(this.workspacePath);
        const dirs = fileManager.getDirectories();
        const snapshotDir = dirs.snapshots;

        if (!fs.existsSync(snapshotDir)) {
            return [];
        }

        const entries = fs.readdirSync(snapshotDir, { withFileTypes: true });
        const items: SnapshotTreeItem[] = [];

        for (const entry of entries) {
            if (!entry.isDirectory()) {
                continue;
            }
            const folder = path.join(snapshotDir, entry.name);
            const metadataPath = path.join(folder, 'metadata.json');
            let label = entry.name;
            let description: string | undefined;
            let tooltip = folder;
            let snapshotMeta: Partial<Snapshot> | undefined;

            if (fs.existsSync(metadataPath)) {
                try {
                    const content = fs.readFileSync(metadataPath, 'utf-8');
                    snapshotMeta = JSON.parse(content) as Snapshot;
                    if (snapshotMeta.title) {
                        label = snapshotMeta.title;
                    }
                    if (snapshotMeta.extractedAt) {
                        description = new Date(snapshotMeta.extractedAt).toLocaleString();
                    }
                    if (snapshotMeta.url) {
                        tooltip = `${snapshotMeta.title || label}\n${snapshotMeta.url}`;
                    }
                } catch (err) {
                    // ignore parse errors
                }
            }

            items.push(new SnapshotTreeItem(label, folder, description, tooltip, snapshotMeta));
        }

        return items.sort((a, b) => {
            const aTime = a.sortTimestamp ?? 0;
            const bTime = b.sortTimestamp ?? 0;
            return bTime - aTime;
        });
    }
}

export class SnapshotTreeItem extends vscode.TreeItem {
    public readonly sortTimestamp?: number;

    constructor(
        public readonly label: string,
        public readonly folderPath: string,
        description?: string,
        tooltip?: string,
        snapshotMeta?: Partial<Snapshot>
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.tooltip = tooltip || folderPath;
        this.contextValue = 'designLearn.snapshot';
        this.iconPath = new vscode.ThemeIcon('file-submodule');
        if (snapshotMeta?.extractedAt) {
            this.sortTimestamp = new Date(snapshotMeta.extractedAt).getTime();
        }
        this.command = {
            command: 'design-learn.openSnapshotFolder',
            title: '打开快照文件夹',
            arguments: [this]
        };
    }
}


