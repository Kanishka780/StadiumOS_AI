import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase, useAI, useStorage } from '../context/ServiceContext';
import { ScenarioAdapter } from '../services/scenarioAdapter';
import type { Zone } from '../models/zone';
import type { OperationalEvent } from '../models/event';
import type { Incident } from '../models/incident';
import type { VolunteerTask } from '../models/task';
import { DigitalTwinMap } from '../components/DigitalTwinMap';
import { AIRecommendationCard } from '../components/AIRecommendationCard';
import { 
  Play, Users, ShieldAlert, Cpu, CheckCircle, Wifi, WifiOff, 
  Send, HardDrive, Globe 
} from 'lucide-react';

export const JudgeMode: React.FC = () => {
  const db = useDatabase();
  const ai = useAI();
  const storage = useStorage();

  // Core State Feeds
  const [zones, setZones] = useState<Zone[]>([]);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  
  // Selected contexts
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('zone_gate_b');
  const [activeScenario, setActiveScenario] = useState<string>('Default');
  
  // Diagnostics
  const [isOnline, setIsOnline] = useState(storage.isOnline());
  const [queueCount, setQueueCount] = useState(0);
  const [readLatency, setReadLatency] = useState(0);
  const [aiLatency, setAiLatency] = useState(0);

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSubmitting, setChatSubmitting] = useState(false);

  // Ingest states
  const [ingesting, setIngesting] = useState(false);

  // Listeners
  useEffect(() => {
    const unsubZones = db.listenToZones((data) => setZones(data), () => {});
    const unsubEvents = db.listenToEvents((data) => setEvents(data), () => {});
    const unsubIncidents = db.listenToIncidents((data) => setIncidents(data), () => {});
    const unsubTasks = db.listenToTasks('uid_volunteer_user', (data) => setTasks(data), () => {});
    
    const unsubConn = storage.listenToConnectionStatus((online) => {
      setIsOnline(online);
    });

    const interval = setInterval(async () => {
      const dbLat = await db.getReadLatency();
      const aiLat = await ai.getAILatency();
      const queued = await storage.getQueuedTasks();
      
      setReadLatency(dbLat);
      setAiLatency(aiLat);
      setQueueCount(queued.length);
    }, 2000);

    return () => {
      unsubZones();
      unsubEvents();
      unsubIncidents();
      unsubTasks();
      unsubConn();
      clearInterval(interval);
    };
  }, [db, ai, storage]);

  // Scenario trigger
  const handleScenarioTrigger = (scenarioName: string) => {
    if (db instanceof ScenarioAdapter) {
      db.triggerScenario(scenarioName);
      setActiveScenario(scenarioName);
      // Pre-select B for congestion advisory, else default to metro or seating
      if (scenarioName === 'Gate B Congestion' || scenarioName === 'Volunteer Reassignment') {
        setSelectedZoneId('zone_gate_b');
      } else if (scenarioName === 'Accessibility SOS') {
        setSelectedZoneId('zone_concourse');
      }
    }
  };

  const handleIngestSpikes = async () => {
    if (!selectedZoneId) return;
    setIngesting(true);
    try {
      await ai.ingestSignal(selectedZoneId, 'turnstile_density', {
        count: 145,
        severity: 'high',
        description: 'Automatic turnstile density spike ingestion'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIngesting(false);
    }
  };

  const handleTaskToggle = async (taskId: string, currentStatus: VolunteerTask['status']) => {
    const nextStatus = currentStatus === 'pending' ? 'in_progress' : 'completed';
    if (!isOnline) {
      await storage.queueTaskUpdate(taskId, nextStatus);
    } else {
      await db.updateTaskStatus(taskId, nextStatus);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') {
      e.preventDefault();
    }
    const text = typeof e === 'string' ? e : chatInput.trim();
    if (!text || chatSubmitting) return;

    setChatMessages(prev => [...prev, { sender: 'user', text }]);
    setChatInput('');
    setChatSubmitting(true);

    try {
      const reply = await ai.askAssistant(text, 'en');
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Service temporarily unavailable.' }]);
    } finally {
      setChatSubmitting(false);
    }
  };

  // Memoized derived properties
  const activeAdvisory = useMemo(() => {
    return events.find(e => e.zoneId === selectedZoneId);
  }, [events, selectedZoneId]);

  const blockedRoutes = useMemo(() => {
    return zones.filter(z => z.overlayColor === 'crowd-critical').map(z => z.id);
  }, [zones]);

  const isSimulation = db instanceof ScenarioAdapter;

  return (
    <div className="flex flex-col gap-6 select-none font-sans max-w-7xl mx-auto px-4 py-2">
      
      {/* Cockpit Title & Diagnostics */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-amber-400 flex items-center gap-2 tracking-tight">
            ⚖️ StadiumOS AI Judge Evaluator Cockpit
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Single-pane control panel. Trigger scenarios, simulate offline volunteers, and inspect cross-role telemetry in real-time.
          </p>
        </div>
        
        {/* Core Latency Tickers */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            State: <strong className="text-sky-400">{isSimulation ? 'SIMULATOR' : 'PRODUCTION'}</strong>
          </div>
          <div className="w-px h-3.5 bg-slate-800"></div>
          <div>DB Latency: <strong className="text-slate-100">{readLatency}ms</strong></div>
          <div className="w-px h-3.5 bg-slate-800"></div>
          <div>AI Latency: <strong className="text-slate-100">{aiLatency}ms</strong></div>
        </div>
      </div>

      {/* Main Double Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: SVG Digital Twin & Scenario Selector (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Scenario Trigger Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <h2 className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2 mb-3">
              <Play className="w-4 h-4 text-amber-400" />
              1-Click Scenario Trigger
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Gate B Congestion', 'Medical Emergency', 'Accessibility SOS',
                'Volunteer Reassignment', 'Food Court Overflow', 'Sustainability Alert',
                'Parking Overflow', 'Severe Weather', 'Emergency Evacuation'
              ].map((scen) => (
                <button
                  key={scen}
                  onClick={() => handleScenarioTrigger(scen)}
                  className={`py-2 px-2.5 rounded-lg border text-left text-[11px] font-semibold transition-all cursor-pointer outline-none ${
                    activeScenario === scen 
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-[1.02]' 
                      : 'bg-slate-950/60 border-slate-850 hover:border-slate-800 text-slate-300'
                  }`}
                >
                  {scen}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Digital Twin SVG Map */}
          <DigitalTwinMap
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={(id) => setSelectedZoneId(id)}
            blockedRoutes={blockedRoutes}
          />
          
        </div>

        {/* Right Side: 2x2 Quadrant Multi-Role Dashboard Viewports (7 Columns) */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Quadrant A: Operations Organizer Dashboard */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3 min-h-[300px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                Organizer Telemetry
              </h3>
              <span className="text-[10px] bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-slate-400">
                Zone: <strong className="text-sky-400 uppercase">{selectedZoneId?.replace('zone_', '')}</strong>
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {activeAdvisory ? (
                <AIRecommendationCard event={activeAdvisory} />
              ) : (
                <div className="text-center text-slate-500 text-xs py-8 my-auto flex flex-col items-center gap-2">
                  <CheckCircle className="w-8 h-8 text-emerald-500/60" />
                  <span>Operations stable. Select a red zone or trigger a scenario to view Gemini suggestions.</span>
                </div>
              )}
            </div>

            <button
              onClick={handleIngestSpikes}
              disabled={ingesting || !selectedZoneId}
              className="w-full py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-slate-950 font-bold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
            >
              {ingesting ? 'Injecting telemetry...' : 'Manual Density Ingestion Trigger'}
            </button>
          </div>

          {/* Quadrant B: Security Command Dashboard */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3 min-h-[300px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                Security Responders
              </h3>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-semibold">
                Surveillance Active
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[160px] flex flex-col gap-2">
              {incidents.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-8 font-mono">
                  No active incidents reported.
                </div>
              ) : (
                incidents.map(inc => (
                  <div key={inc.id} className="p-2 bg-slate-950 border border-slate-850 rounded text-[11px] leading-relaxed text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-rose-400 uppercase text-[9px]">{inc.priority} alert</span>
                      <span className="text-slate-500 text-[9px]">{new Date(inc.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="mt-1 font-semibold text-slate-200">{inc.summary}</p>
                  </div>
                ))
              )}
            </div>

            {/* Block Route Enforcers */}
            <div className="border-t border-slate-850 pt-2.5 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Emergency Route Override</span>
              <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/50 p-2 border border-slate-850 rounded">
                <span>Gate B Access Route</span>
                <button
                  onClick={() => db.blockRoute('zone_gate_b', !blockedRoutes.includes('zone_gate_b'))}
                  className={`px-3 py-1 text-[10px] font-bold rounded cursor-pointer ${
                    blockedRoutes.includes('zone_gate_b') 
                      ? 'bg-rose-600 text-slate-100 hover:bg-rose-700' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  {blockedRoutes.includes('zone_gate_b') ? 'BLOCKED' : 'OPEN'}
                </button>
              </div>
            </div>
          </div>

          {/* Quadrant C: Fan Companion chatbot */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3 min-h-[300px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                Fan Companion Chat
              </h3>
              <div className="flex gap-2 text-[10px] text-slate-400">
                <span>Gate A: <strong className="text-emerald-400">4m</strong></span>
                <span>Gate B: <strong className="text-rose-400">25m</strong></span>
              </div>
            </div>

            {/* Chatbox messages output */}
            <div className="flex-1 overflow-y-auto max-h-[140px] flex flex-col gap-2 pr-1 font-mono text-[10px]">
              {chatMessages.length === 0 && (
                <div className="text-center text-slate-500 py-6 my-auto">
                  Click below queries or type to test localized AI responses.
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-1.5 max-w-[90%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className="bg-slate-950 border border-slate-850 px-1 py-0.5 rounded text-slate-500 font-bold uppercase scale-[0.9]">
                    {msg.sender === 'user' ? 'ME' : 'AI'}
                  </div>
                  <div className={`p-2 rounded-lg text-slate-300 leading-relaxed ${
                    msg.sender === 'user' ? 'bg-sky-950 border border-sky-800' : 'bg-slate-950 border border-slate-850'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Quick Queries */}
            <div className="flex flex-wrap gap-1.5 border-t border-slate-850 pt-2">
              <button 
                onClick={() => handleChatSubmit('How are food lines?')}
                className="px-2 py-0.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 rounded text-[9px] cursor-pointer"
              >
                Food wait times?
              </button>
              <button 
                onClick={() => handleChatSubmit('Show exit routes to metro')}
                className="px-2 py-0.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 rounded text-[9px] cursor-pointer"
              >
                Exit routes?
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about food, exit routes..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                className="px-3 bg-sky-500 hover:bg-sky-600 text-slate-950 rounded cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Quadrant D: Volunteer Copilot (Offline-first testbed) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3 min-h-[300px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                Volunteer Copilot
              </h3>
              
              {/* Connection Switcher toggle */}
              <button
                onClick={() => storage.queueTaskUpdate('__toggle_net__', 'pending').then(() => setIsOnline(storage.isOnline()))}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer outline-none ${
                  isOnline 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 animate-pulse'
                }`}
                title="Click to toggle network status (Online/Offline simulator)"
              >
                {isOnline ? (
                  <><Wifi className="w-3 h-3" /> Online</>
                ) : (
                  <><WifiOff className="w-3 h-3" /> Offline</>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[160px] flex flex-col gap-2">
              {tasks.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-8">
                  No volunteer tasks assigned.
                </div>
              ) : (
                tasks.map(t => (
                  <div key={t.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded flex justify-between items-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Task: {t.id.replace('tsk_', '')}</span>
                      <p className="font-semibold text-slate-200 mt-0.5">{t.instructions}</p>
                    </div>
                    <button
                      onClick={() => handleTaskToggle(t.id, t.status)}
                      className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase cursor-pointer ${
                        t.status === 'completed' 
                          ? 'bg-emerald-400 text-slate-950' 
                          : t.status === 'in_progress'
                            ? 'bg-sky-500 text-slate-950'
                            : 'bg-slate-850 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {t.status}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Offline sync queue counter */}
            <div className="border-t border-slate-850 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                Offline Write Queue: <strong className={queueCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-300'}>{queueCount}</strong>
              </span>
              {queueCount > 0 && isOnline && (
                <button
                  onClick={async () => {
                    await storage.syncOfflineQueue(db);
                    setQueueCount(0);
                  }}
                  className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[9px] cursor-pointer"
                >
                  Flush Queue
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
export default JudgeMode;
