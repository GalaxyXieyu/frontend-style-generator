/**
 * Storage 管理工具
 * 统一管理 Chrome Storage 和 IndexedDB
 * 支持数据备份和恢复，防止插件更新时数据丢失
 */
export class StorageManager {
  constructor() {
    this.dbName = 'StyleGenerator';
    this.dbVersion = 2; // 版本升级
    this.storagePrefix = 'sg_'; // 存储键前缀，避免冲突
    this.init();
  }

  /**
   * 初始化存储管理器
   */
  async init() {
    try {
      // 检查是否需要数据迁移
      await this.migrateDataIfNeeded();
      // 创建备份
      await this.createAutoBackup();
    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  }

  /**
   * Chrome Storage - 获取配置（带前缀）
   */
  async getConfig(keys) {
    if (!keys) {
      // 获取所有配置
      const allData = await chrome.storage.local.get(null);
      const result = {};
      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith(this.storagePrefix)) {
          result[key.replace(this.storagePrefix, '')] = value;
        }
      }
      return result;
    }
    
    if (Array.isArray(keys)) {
      const prefixedKeys = keys.map(k => this.storagePrefix + k);
      const data = await chrome.storage.local.get(prefixedKeys);
      const result = {};
      for (const key of keys) {
        const prefixedKey = this.storagePrefix + key;
        if (data[prefixedKey] !== undefined) {
          result[key] = data[prefixedKey];
        }
      }
      return result;
    }
    
    // 单个键
    const prefixedKey = this.storagePrefix + keys;
    const data = await chrome.storage.local.get(prefixedKey);
    return { [keys]: data[prefixedKey] };
  }

  /**
   * Chrome Storage - 保存配置（带前缀和备份）
   */
  async setConfig(data) {
    const prefixedData = {};
    for (const [key, value] of Object.entries(data)) {
      prefixedData[this.storagePrefix + key] = value;
    }
    
    // 先备份当前数据
    await this.backupBeforeSave(Object.keys(data));
    
    // 保存新数据
    await chrome.storage.local.set(prefixedData);
    
    // 记录最后更新时间
    await chrome.storage.local.set({
      [this.storagePrefix + '_lastUpdated']: new Date().toISOString(),
      [this.storagePrefix + '_version']: this.dbVersion
    });
    
    return true;
  }

  /**
   * Chrome Storage - 清除所有配置
   */
  async clearConfig() {
    return await chrome.storage.local.clear();
  }

  /**
   * Chrome Storage - 删除指定键
   */
  async removeKeys(keys) {
    if (!Array.isArray(keys)) return;
    const prefixedKeys = keys.map(k => this.storagePrefix + k);
    return await chrome.storage.local.remove(prefixedKeys);
  }

  /**
   * 备份当前数据
   */
  async backupBeforeSave(keys) {
    try {
      const currentData = await this.getConfig(keys);
      const backupKey = this.storagePrefix + '_backup_' + Date.now();
      await chrome.storage.local.set({
        [backupKey]: {
          data: currentData,
          timestamp: new Date().toISOString(),
          keys: keys
        }
      });
      
      // 只保留最近3个备份
      await this.cleanOldBackups();
    } catch (error) {
      console.warn('Backup failed:', error);
    }
  }

  /**
   * 清理旧备份
   */
  async cleanOldBackups() {
    try {
      const allData = await chrome.storage.local.get(null);
      const backups = [];
      
      for (const [key, value] of Object.entries(allData)) {
        if (key.startsWith(this.storagePrefix + '_backup_')) {
          backups.push({ key, timestamp: value.timestamp });
        }
      }
      
      // 按时间排序，删除旧的
      if (backups.length > 3) {
        backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const toDelete = backups.slice(3).map(b => b.key);
        await chrome.storage.local.remove(toDelete);
      }
    } catch (error) {
      console.warn('Clean old backups failed:', error);
    }
  }

  /**
   * 恢复备份数据
   */
  async restoreFromBackup(backupTimestamp) {
    try {
      const backupKey = this.storagePrefix + '_backup_' + backupTimestamp;
      const result = await chrome.storage.local.get(backupKey);
      
      if (result[backupKey]) {
        const { data, keys } = result[backupKey];
        await this.setConfig(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Restore from backup failed:', error);
      return false;
    }
  }

  /**
   * 列出所有备份
   */
  async listBackups() {
    const allData = await chrome.storage.local.get(null);
    const backups = [];
    
    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith(this.storagePrefix + '_backup_')) {
        const timestamp = key.replace(this.storagePrefix + '_backup_', '');
        backups.push({
          timestamp: parseInt(timestamp),
          date: value.timestamp,
          keys: value.keys
        });
      }
    }
    
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * 创建自动备份
   */
  async createAutoBackup() {
    try {
      const lastBackup = await chrome.storage.local.get(this.storagePrefix + '_lastAutoBackup');
      const lastBackupTime = lastBackup[this.storagePrefix + '_lastAutoBackup'];
      const now = Date.now();
      
      // 每天自动备份一次
      if (!lastBackupTime || now - lastBackupTime > 24 * 60 * 60 * 1000) {
        const allConfig = await this.getConfig(null);
        await chrome.storage.local.set({
          [this.storagePrefix + '_autoBackup']: {
            data: allConfig,
            timestamp: new Date().toISOString()
          },
          [this.storagePrefix + '_lastAutoBackup']: now
        });
      }
    } catch (error) {
      console.warn('Auto backup failed:', error);
    }
  }

  /**
   * 数据迁移（从旧版本到新版本）
   */
  async migrateDataIfNeeded() {
    try {
      const allData = await chrome.storage.local.get(null);
      
      // 检查是否有未迁移的旧数据
      const hasOldData = Object.keys(allData).some(key => !key.startsWith(this.storagePrefix));
      const hasNewData = Object.keys(allData).some(key => key.startsWith(this.storagePrefix));
      
      if (hasOldData && !hasNewData) {
        console.log('Migrating data from old version...');
        
        // 迁移数据
        const newData = {};
        for (const [key, value] of Object.entries(allData)) {
          // 跳过一些系统键
          if (!key.startsWith('_') && !key.startsWith('sg_')) {
            newData[this.storagePrefix + key] = value;
          }
        }
        
        // 保存迁移后的数据
        await chrome.storage.local.set(newData);
        await chrome.storage.local.set({
          [this.storagePrefix + '_migrated']: true,
          [this.storagePrefix + '_migrationDate']: new Date().toISOString()
        });
        
        console.log('Data migration completed');
      }
    } catch (error) {
      console.error('Data migration failed:', error);
    }
  }

  /**
   * 导出所有数据（用于用户手动备份）
   */
  async exportAllData() {
    try {
      const config = await this.getConfig(null);
      const snapshots = await this.getAllSnapshots();
      
      return {
        version: this.dbVersion,
        exportDate: new Date().toISOString(),
        config,
        snapshots,
        metadata: {
          snapshotCount: snapshots.length,
          configKeys: Object.keys(config)
        }
      };
    } catch (error) {
      console.error('Export data failed:', error);
      throw error;
    }
  }

  /**
   * 导入数据（从备份恢复）
   */
  async importData(data) {
    try {
      // 验证数据格式
      if (!data.config || !data.snapshots) {
        throw new Error('Invalid backup data format');
      }
      
      // 先备份当前数据
      await this.createAutoBackup();
      
      // 导入配置
      await this.setConfig(data.config);
      
      // 导入快照
      const db = await this.openDB();
      const tx = db.transaction('snapshots', 'readwrite');
      const store = tx.objectStore('snapshots');
      
      for (const snapshot of data.snapshots) {
        await store.put(snapshot);
      }
      
      await tx.complete;
      
      return true;
    } catch (error) {
      console.error('Import data failed:', error);
      throw error;
    }
  }

  /**
   * IndexedDB - 打开数据库
   */
  openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('snapshots')) {
          db.createObjectStore('snapshots', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * IndexedDB - 获取所有快照
   */
  async getAllSnapshots() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('snapshots', 'readonly');
      const store = tx.objectStore('snapshots');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * IndexedDB - 获取快照数量
   */
  async getSnapshotCount() {
    const db = await this.openDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction('snapshots', 'readonly');
        const store = tx.objectStore('snapshots');
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      } catch {
        resolve(0);
      }
    });
  }

  /**
   * IndexedDB - 清除所有快照
   */
  async clearSnapshots() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('snapshots', 'readwrite');
      const store = tx.objectStore('snapshots');
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 计算存储大小
   */
  async calculateStorageSize() {
    const config = await chrome.storage.local.get(null);
    const json = JSON.stringify(config);
    return new Blob([json]).size;
  }

  /**
   * 清除所有数据（包括配置和快照）
   */
  async clearAllData() {
    try {
      // 清除 Chrome Storage
      await this.clearConfig();
      
      // 清除 IndexedDB 快照
      await this.clearSnapshots();
      
      return true;
    } catch (error) {
      console.error('Clear all data failed:', error);
      throw error;
    }
  }
}
