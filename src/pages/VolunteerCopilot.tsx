import React, { useState, useEffect } from 'react';
import { useDatabase, useStorage } from '../context/ServiceContext';
import type { VolunteerTask } from '../models/task';
import { AlertCircle, Wifi, WifiOff, CheckCircle2, ClipboardList, Camera, Mic, RefreshCw } from 'lucide-react';

export const VolunteerCopilot: React.FC = () => {
  const db = useDatabase();
  const storage = useStorage();

  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [isOnline, setIsOnline] = useState(storage.isOnline());
  const [queuedTasks, setQueuedTasks] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never');

  // Form states for incident reporting
  const [incidentText, setIncidentText] = useState('');
  const [incidentPriority, setIncidentPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [reportingStatus, setReportingStatus] = useState<'idle' | 'success' | 'queued'>('idle');

  const volId = 'uid_volunteer_user';

  const loadTasksAndQueue = async () => {
    const queued = await storage.getQueuedTasks();
    setQueuedTasks(queued);
  };

  useEffect(() => {
    const unsubTasks = db.listenToTasks(volId, (data) => {
      setTasks(data);
    }, () => {});

    const unsubConnection = storage.listenToConnectionStatus((online) => {
      setIsOnline(online);
      if (online) {
        handleAutoSync();
      }
    });

    loadTasksAndQueue();
    const interval = setInterval(loadTasksAndQueue, 3000);

    return () => {
      unsubTasks();
      unsubConnection();
      clearInterval(interval);
    };
  }, [db, storage]);

  const handleAutoSync = async () => {
    setSyncing(true);
    await storage.syncOfflineQueue(db);
    setLastSyncTime(new Date().toLocaleTimeString());
    setSyncing(false);
    loadTasksAndQueue();
  };

  const handleTaskStatusChange = async (taskId: string, currentStatus: VolunteerTask['status']) => {
    const nextStatus = currentStatus === 'pending' ? 'in_progress' : 'completed';
    
    if (!isOnline) {
      // queue offline
      await storage.queueTaskUpdate(taskId, nextStatus);
      loadTasksAndQueue();
    } else {
      await db.updateTaskStatus(taskId, nextStatus);
    }
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentText.trim()) return;

    const payload = {
      summary: incidentText.trim(),
      priority: incidentPriority,
      departmentsAffected: ['stadium_ops'],
      status: 'reported' as const,
      zoneId: 'zone_concourse',
      reportedBy: volId,
    };

    if (!isOnline) {
      // Write to offline cache queue (simulate incident write queue or log local notification)
      await storage.queueTaskUpdate(`local_report_${Date.now()}`, 'queued_offline');
      setReportingStatus('queued');
      loadTasksAndQueue();
    } else {
      await db.reportIncident(payload);
      setReportingStatus('success');
    }

    setIncidentText('');
    setTimeout(() => setReportingStatus('idle'), 3000);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Network Status Banner */}
      <div className={`p-4 rounded-xl flex items-center justify-between shadow ${
        isOnline ? 'bg-slate-900 border border-slate-800' : 'bg-rose-500/20 border border-rose-500/30'
      }`}>
        <div className="flex items-center gap-3">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <Wifi className="w-4 h-4" /> Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs animate-pulse">
              <WifiOff className="w-4 h-4" /> Working Offline
            </span>
          )}
          <span className="text-xs text-slate-400">
            Last Synced: <strong className="text-slate-200">{lastSyncTime}</strong>
          </span>
        </div>

        {isOnline && queuedTasks.length > 0 && (
          <button
            onClick={handleAutoSync}
            disabled={syncing}
            className="flex items-center gap-1 px-3 py-1 bg-sky-500 text-slate-950 font-bold rounded-lg text-[10px] hover:bg-sky-600 disabled:opacity-50 cursor-pointer outline-none"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            Sync Now ({queuedTasks.length})
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tasks Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <ClipboardList className="w-4 h-4 text-sky-400" />
            Assigned Task Checklist
          </h3>

          <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
            {tasks.length === 0 && (
              <div className="text-center text-slate-500 text-xs py-8">
                No tasks assigned to you. Waiting for operational dispatch signals.
              </div>
            )}
            {tasks.map((task) => {
              const isQueuedOffline = queuedTasks.some(q => q.id === task.id);
              return (
                <div key={task.id} className="flex items-start justify-between p-3.5 bg-slate-950/50 border border-slate-850 rounded-lg">
                  <div className="flex flex-col gap-1 pr-2">
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">{task.instructions}</p>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold mt-1">
                      Status: {task.status.replace('_', ' ')} {isQueuedOffline && '(queued update)'}
                    </span>
                  </div>
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleTaskStatusChange(task.id, task.status)}
                      className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-slate-950 border border-sky-500/20 hover:border-transparent rounded font-bold text-[10px] transition-all cursor-pointer outline-none"
                    >
                      {task.status === 'pending' ? 'Start' : 'Complete'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Incident Logger */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <AlertCircle className="w-4 h-4 text-sky-400" />
            Report Incident / PLaza Anomaly
          </h3>

          <form onSubmit={handleSubmitIncident} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-[10px] uppercase font-bold text-slate-500">Incident Details</label>
              <textarea
                id="description"
                value={incidentText}
                onChange={(e) => setIncidentText(e.target.value)}
                placeholder="Describe congestion, hazard, or medical assistance request..."
                rows={4}
                className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 outline-none focus:border-sky-500 leading-relaxed resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Severity/Priority</span>
                <select
                  value={incidentPriority}
                  onChange={(e: any) => setIncidentPriority(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-sky-500 cursor-pointer"
                  aria-label="Select priority level"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Media tools */}
              <div className="flex flex-col justify-end gap-2 pb-0.5">
                <div className="flex items-center gap-2">
                  <button type="button" className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer" title="Simulate photo attachments">
                    <Camera className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer" title="Simulate voice report notes">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold rounded-lg text-xs mt-2 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              Submit Report
            </button>
          </form>

          {reportingStatus === 'success' && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Incident reported successfully to Operations Center.</span>
            </div>
          )}

          {reportingStatus === 'queued' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-lg flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span>Offline. Report queued in local database. Will sync on reconnect.</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
