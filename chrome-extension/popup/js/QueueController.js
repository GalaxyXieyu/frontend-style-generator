/**
 * 队列控制模块
 * 负责队列的暂停、继续、清除等操作
 */
class QueueController {
  constructor(controller) {
    this.controller = controller;
  }

  /**
   * 清除已完成任务或选中的任务
   */
  async clearCompleted() {
    // 如果有选中的任务，清除选中的
    if (this.controller.selectedTasks.size > 0) {
      await this.clearSelected();
      return;
    }
    
    // 否则清除已完成的任务
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CLEAR_COMPLETED'
      });
      
      if (response.success) {
        await this.controller.taskManager.loadTasks();
        this.controller.showNotification('success', '已清除完成的任务');
      }
    } catch (error) {
      this.controller.showNotification('error', '清除失败');
    }
  }
  
  /**
   * 清除选中的任务
   */
  async clearSelected() {
    if (this.controller.selectedTasks.size === 0) {
      this.controller.showNotification('error', '请先选择要清除的任务');
      return;
    }
    
    const count = this.controller.selectedTasks.size;
    if (!confirm(`确定要删除 ${count} 个选中的任务吗？此操作不可恢复。`)) {
      return;
    }
    
    try {
      // 批量删除选中的任务
      const deletePromises = Array.from(this.controller.selectedTasks).map(taskId =>
        chrome.runtime.sendMessage({
          type: 'DELETE_TASK',
          taskId
        })
      );
      
      await Promise.all(deletePromises);
      
      this.controller.selectedTasks.clear();
      await this.controller.taskManager.loadTasks();
      this.controller.showNotification('success', `已删除 ${count} 个任务`);
    } catch (error) {
      this.controller.showNotification('error', '删除失败：' + error.message);
    }
  }
  
  /**
   * 重试选中的任务
   */
  async retrySelected() {
    if (this.controller.selectedTasks.size === 0) {
      this.controller.showNotification('error', '请先选择要重试的任务');
      return;
    }
    
    const selectedTasks = Array.from(this.controller.selectedTasks).map(id => 
      this.controller.tasks.find(t => t.id === id)
    ).filter(Boolean);
    
    const failedTasks = selectedTasks.filter(t => t.status === 'failed');
    
    if (failedTasks.length === 0) {
      this.controller.showNotification('error', '选中的任务中没有失败的任务');
      return;
    }
    
    try {
      // 批量重试失败的任务
      const retryPromises = failedTasks.map(task =>
        chrome.runtime.sendMessage({
          type: 'RETRY_TASK',
          taskId: task.id
        })
      );
      
      await Promise.all(retryPromises);
      
      this.controller.selectedTasks.clear();
      await this.controller.taskManager.loadTasks();
      this.controller.showNotification('success', `已重试 ${failedTasks.length} 个任务`);
    } catch (error) {
      this.controller.showNotification('error', '重试失败：' + error.message);
    }
  }

  /**
   * 全选/取消全选
   */
  toggleSelectAll() {
    if (this.controller.selectedTasks.size === this.controller.tasks.length) {
      // 全部取消选中
      this.controller.selectedTasks.clear();
    } else {
      // 全选
      this.controller.tasks.forEach(task => this.controller.selectedTasks.add(task.id));
    }
    this.controller.taskManager.displayTasks(this.controller.tasks);
    this.updateClearButton();
    this.updateSelectAllButton();
  }
  
  /**
   * 更新清除按钮文本
   */
  updateClearButton() {
    const clearBtn = document.getElementById('clearCompletedBtn');
    if (!clearBtn) return;

    if (this.controller.selectedTasks.size > 0) {
      // 检查选中的任务中是否有失败的任务
      const selectedTasks = Array.from(this.controller.selectedTasks).map(id => 
        this.controller.tasks.find(t => t.id === id)
      ).filter(Boolean);
      
      const hasFailedTasks = selectedTasks.some(t => t.status === 'failed');
      
      if (hasFailedTasks) {
        // 显示重试按钮
        clearBtn.className = 'secondary-btn'; // 保持样式
        clearBtn.style.color = 'var(--accent-color)';
        clearBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 3l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>重试选中 (${selectedTasks.filter(t => t.status === 'failed').length})</span>
        `;
        
        clearBtn.onclick = (e) => {
          e.stopPropagation();
          this.retrySelected();
        };
        return;
      }

      // 恢复为清除选中
      clearBtn.style.color = '';
      clearBtn.onclick = (e) => {
        e.stopPropagation();
        this.clearSelected();
      };
      clearBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M19 6V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6" stroke="currentColor" stroke-width="2"/>
          <path d="M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>清除选中 (${this.controller.selectedTasks.size})</span>
      `;
    } else {
      // 恢复为清除已完成
      clearBtn.style.color = '';
      clearBtn.onclick = (e) => {
        e.stopPropagation();
        this.clearCompleted();
      };
      clearBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M19 6V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6" stroke="currentColor" stroke-width="2"/>
          <path d="M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span>清除已完成</span>
      `;
    }
  }
  
  /**
   * 更新全选按钮文本
   */
  updateSelectAllButton() {
    const selectAllBtn = document.getElementById('selectAllBtn');
    if (selectAllBtn) {
      const allSelected = this.controller.tasks.length > 0 && this.controller.selectedTasks.size === this.controller.tasks.length;
      selectAllBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
          ${allSelected ? '<path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
        </svg>
        <span>${allSelected ? '取消全选' : '全选'}</span>
      `;
    }
  }
  
  /**
   * 更新队列状态
   */
  async updateQueueState() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_QUEUE_STATE'
      });
      
      if (response.success) {
        this.controller.queuePaused = response.state.paused;
        
        const pauseBtn = document.getElementById('pauseQueueBtn');
        const resumeBtn = document.getElementById('resumeQueueBtn');
        
        if (pauseBtn && resumeBtn) {
          if (this.controller.queuePaused) {
            pauseBtn.style.display = 'none';
            resumeBtn.style.display = 'flex';
          } else {
            pauseBtn.style.display = 'flex';
            resumeBtn.style.display = 'none';
          }
        }
      }
    } catch (error) {
      console.error('获取队列状态失败:', error);
    }
  }
  
  /**
   * 暂停队列
   */
  async pauseQueue() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PAUSE_QUEUE'
      });
      
      if (response.success) {
        await this.updateQueueState();
        this.controller.showNotification('success', '队列已暂停');
      }
    } catch (error) {
      this.controller.showNotification('error', '暂停失败');
    }
  }
  
  /**
   * 继续队列
   */
  async resumeQueue() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'RESUME_QUEUE'
      });
      
      if (response.success) {
        await this.updateQueueState();
        this.controller.showNotification('success', '队列已继续');
      }
    } catch (error) {
      this.controller.showNotification('error', '继续失败');
    }
  }
}
