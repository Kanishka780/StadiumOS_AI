import type { StorageService, DatabaseService } from './interfaces';
import type { VolunteerTask } from '../models/task';

export class LocalStorageQueueService implements StorageService {
  private onlineStatus: boolean = navigator.onLine;
  private statusListeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    window.addEventListener('online', () => this.handleStatusChange(true));
    window.addEventListener('offline', () => this.handleStatusChange(false));
  }

  private handleStatusChange(online: boolean) {
    this.onlineStatus = online;
    this.statusListeners.forEach((listener) => listener(online));
  }

  isOnline(): boolean {
    return this.onlineStatus;
  }

  listenToConnectionStatus(onChange: (online: boolean) => void): () => void {
    this.statusListeners.add(onChange);
    onChange(this.onlineStatus); // immediate invoke
    return () => {
      this.statusListeners.delete(onChange);
    };
  }

  async getQueuedTasks(): Promise<Omit<VolunteerTask, 'timestamp'>[]> {
    const queueStr = localStorage.getItem('stadium_os_offline_tasks');
    if (!queueStr) return [];
    try {
      return JSON.parse(queueStr);
    } catch {
      return [];
    }
  }

  async queueTaskUpdate(taskId: string, status: VolunteerTask['status']): Promise<void> {
    const queue = await this.getQueuedTasks();
    // remove duplicate queued items for this task, keeping latest
    const filteredQueue = queue.filter((item) => item.id !== taskId);
    filteredQueue.push({ id: taskId, assignedTo: '', zoneId: '', instructions: '', status });
    localStorage.setItem('stadium_os_offline_tasks', JSON.stringify(filteredQueue));
  }

  async syncOfflineQueue(db: DatabaseService): Promise<void> {
    if (!this.isOnline()) return;
    const queue = await this.getQueuedTasks();
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        await db.updateTaskStatus(item.id, item.status);
      } catch (err) {
        console.error(`Failed to sync task ${item.id}:`, err);
        // keep item in queue for retry if it fails
        return;
      }
    }

    // clear queue if all operations succeeded
    localStorage.removeItem('stadium_os_offline_tasks');
  }
}
