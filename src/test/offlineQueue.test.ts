import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageQueueService } from '../services/offlineQueue';
import type { DatabaseService } from '../services/interfaces';

describe('LocalStorageQueueService (Offline Sync)', () => {
  let queueService: LocalStorageQueueService;
  let mockDb: any;

  beforeEach(() => {
    localStorage.clear();
    queueService = new LocalStorageQueueService();
    mockDb = {
      updateTaskStatus: vi.fn().mockResolvedValue(undefined),
    };
  });

  it('should start with connection status matching navigator.onLine', () => {
    expect(queueService.isOnline()).toBe(navigator.onLine);
  });

  it('should queue task status updates in local storage', async () => {
    await queueService.queueTaskUpdate('task_abc', 'in_progress');
    const queued = await queueService.getQueuedTasks();
    
    expect(queued.length).toBe(1);
    expect(queued[0].id).toBe('task_abc');
    expect(queued[0].status).toBe('in_progress');
  });

  it('should replace previous update with latest queued update for same task', async () => {
    await queueService.queueTaskUpdate('task_abc', 'in_progress');
    await queueService.queueTaskUpdate('task_abc', 'completed');
    const queued = await queueService.getQueuedTasks();
    
    expect(queued.length).toBe(1);
    expect(queued[0].status).toBe('completed');
  });

  it('should trigger database sync and clear storage when online', async () => {
    // Force online state
    vi.spyOn(queueService, 'isOnline').mockReturnValue(true);

    await queueService.queueTaskUpdate('task_01', 'in_progress');
    await queueService.queueTaskUpdate('task_02', 'completed');

    await queueService.syncOfflineQueue(mockDb as unknown as DatabaseService);

    expect(mockDb.updateTaskStatus).toHaveBeenCalledTimes(2);
    expect(mockDb.updateTaskStatus).toHaveBeenNthCalledWith(1, 'task_01', 'in_progress');
    expect(mockDb.updateTaskStatus).toHaveBeenNthCalledWith(2, 'task_02', 'completed');

    const queuedAfter = await queueService.getQueuedTasks();
    expect(queuedAfter.length).toBe(0);
  });

  it('should retain queue if database update fails', async () => {
    vi.spyOn(queueService, 'isOnline').mockReturnValue(true);
    mockDb.updateTaskStatus.mockRejectedValueOnce(new Error('Network Write Failed'));

    await queueService.queueTaskUpdate('task_01', 'in_progress');
    await queueService.syncOfflineQueue(mockDb as unknown as DatabaseService);

    const queued = await queueService.getQueuedTasks();
    expect(queued.length).toBe(1);
    expect(queued[0].id).toBe('task_01');
  });

});
