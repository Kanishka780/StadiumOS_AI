import React, { useState, useEffect } from 'react';
import { useDatabase, useAI, useStorage } from '../context/ServiceContext';
import { ScenarioAdapter } from '../services/scenarioAdapter';
import { Activity, Wifi, WifiOff, HardDrive, RefreshCw, Cpu, ToggleLeft } from 'lucide-react';

export const DiagnosticsPanel: React.FC = () => {
  const db = useDatabase();
  const ai = useAI();
  const storage = useStorage();

  const [isOnline, setIsOnline] = useState(storage.isOnline());
  const [readLatency, setReadLatency] = useState(0);
  const [aiLatency, setAiLatency] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const [activeScenario, setActiveScenario] = useState('Default');

  // Load diagnostic states
  useEffect(() => {
    const unsubConnection = storage.listenToConnectionStatus((online) => {
      setIsOnline(online);
    });

    const interval = setInterval(async () => {
      const dbLatency = await db.getReadLatency();
      const geminiLatency = await ai.getAILatency();
      const queued = await storage.getQueuedTasks();
      
      setReadLatency(dbLatency);
      setAiLatency(geminiLatency);
      setQueueCount(queued.length);
    }, 2000);

    return () => {
      unsubConnection();
      clearInterval(interval);
    };
  }, [db, ai, storage]);

  // Handle scenario activation
  const handleScenarioChange = (scenarioName: string) => {
    if (db instanceof ScenarioAdapter) {
      db.triggerScenario(scenarioName);
      setActiveScenario(scenarioName);
    }
  };

  const isSimulation = db instanceof ScenarioAdapter;

  return (
    <div className="w-full bg-slate-900 border-t border-slate-800 p-4 font-mono text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Connection & Latency Indicators */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-slate-200">Diagnostics:</span>
            <span className={isSimulation ? 'text-amber-400' : 'text-emerald-400'}>
              {isSimulation ? '[SIMULATOR]' : '[FIREBASE_PRODUCTION]'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isOnline ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Wifi className="w-3.5 h-3.5" /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-500 animate-pulse">
                <WifiOff className="w-3.5 h-3.5" /> Offline Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            DB Latency: <strong className="text-slate-100">{readLatency}ms</strong>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            AI Latency: <strong className="text-slate-100">{aiLatency}ms</strong>
          </div>

          <div className="flex items-center gap-1 text-slate-300">
            <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
            Offline Queue: <strong className={queueCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-100'}>{queueCount}</strong>
          </div>
        </div>

        {/* Preloaded Scenario Selectors */}
        {isSimulation ? (
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">Predefined Scenarios:</span>
            <select
              value={activeScenario}
              onChange={(e) => handleScenarioChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded p-1 text-xs text-sky-400 outline-none focus:border-sky-500 font-mono cursor-pointer"
              aria-label="Select development scenario"
            >
              <option value="Default">Default Stadium Slate</option>
              <option value="Gate B Congestion">1. Gate B Congestion</option>
              <option value="Medical Emergency">2. Medical Emergency</option>
              <option value="Accessibility SOS">3. Accessibility SOS</option>
              <option value="Volunteer Reassignment">4. Volunteer Reassignment</option>
              <option value="Food Court Overflow">5. Food Court Overflow</option>
              <option value="Sustainability Alert">6. Sustainability Alert</option>
              <option value="Parking Overflow">7. Parking Overflow</option>
              <option value="Severe Weather">8. Severe Weather</option>
              <option value="Emergency Evacuation">9. Emergency Evacuation</option>
            </select>
            <button
              onClick={() => handleScenarioChange(activeScenario)}
              className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
              title="Force reload active scenario"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500">
            Production mode requires direct inputs via Firebase Functions / turnstiles.
          </div>
        )}

      </div>
    </div>
  );
};
