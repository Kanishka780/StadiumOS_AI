import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase, useAI, useStorage } from '../context/ServiceContext';
import { ScenarioAdapter } from '../services/scenarioAdapter';
import type { Zone } from '../models/zone';
import type { OperationalEvent } from '../models/event';
import type { Incident } from '../models/incident';
import type { VolunteerTask } from '../models/task';
import { DigitalTwinMap } from '../components/DigitalTwinMap';
import { Wifi } from 'lucide-react';
import {
  ScenarioController,
  OrganizerTelemetry,
  SecurityResponders,
  FanChatbotPanel,
  VolunteerCopilotPanel,
} from './JudgeModeComponents';
import { OperationsTimeline } from '../components/OperationsTimeline';

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
    const unsubZones = db.listenToZones(
      (data) => setZones(data),
      () => {},
    );
    const unsubEvents = db.listenToEvents(
      (data) => setEvents(data),
      () => {},
    );
    const unsubIncidents = db.listenToIncidents(
      (data) => setIncidents(data),
      () => {},
    );
    const unsubTasks = db.listenToTasks(
      'uid_volunteer_user',
      (data) => setTasks(data),
      () => {},
    );

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
        description: 'Automatic turnstile density spike ingestion',
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

  const handleChatSubmit = async (text: string) => {
    if (!text || chatSubmitting) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text }]);
    setChatSubmitting(true);

    try {
      const reply = await ai.askAssistant(text, 'en');
      setChatMessages((prev) => [...prev, { sender: 'ai', text: reply }]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Service temporarily unavailable.' },
      ]);
    } finally {
      setChatSubmitting(false);
    }
  };

  const handleToggleNet = async () => {
    await storage.queueTaskUpdate('__toggle_net__', 'pending');
    setIsOnline(storage.isOnline());
  };

  const handleSyncQueue = async () => {
    await storage.syncOfflineQueue(db);
    setQueueCount(0);
  };

  const handleBlockRoute = async (zoneId: string, blocked: boolean) => {
    await db.blockRoute(zoneId, blocked);
  };

  // Memoized derived properties
  const activeAdvisory = useMemo(() => {
    return events.find((e) => e.zoneId === selectedZoneId);
  }, [events, selectedZoneId]);

  const blockedRoutes = useMemo(() => {
    return zones.filter((z) => z.overlayColor === 'crowd-critical').map((z) => z.id);
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
            Single-pane control panel. Trigger scenarios, simulate offline volunteers, and inspect
            cross-role telemetry in real-time.
          </p>
        </div>

        {/* Core Latency Tickers */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            State:{' '}
            <strong className="text-sky-400">{isSimulation ? 'SIMULATOR' : 'PRODUCTION'}</strong>
          </div>
          <div className="w-px h-3.5 bg-slate-800"></div>
          <div>
            DB Latency: <strong className="text-slate-100">{readLatency}ms</strong>
          </div>
          <div className="w-px h-3.5 bg-slate-800"></div>
          <div>
            AI Latency: <strong className="text-slate-100">{aiLatency}ms</strong>
          </div>
        </div>
      </div>

      {/* Main Double Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: SVG Digital Twin & Scenario Selector */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <ScenarioController activeScenario={activeScenario} onTrigger={handleScenarioTrigger} />
          <DigitalTwinMap
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={(id) => setSelectedZoneId(id)}
            blockedRoutes={blockedRoutes}
          />
          <OperationsTimeline />
        </div>

        {/* Right Side: Quadrants */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          <OrganizerTelemetry
            selectedZoneId={selectedZoneId}
            activeAdvisory={activeAdvisory}
            ingesting={ingesting}
            onIngest={handleIngestSpikes}
          />
          <SecurityResponders
            incidents={incidents}
            blockedRoutes={blockedRoutes}
            onBlockToggle={handleBlockRoute}
          />
          <FanChatbotPanel
            chatMessages={chatMessages}
            chatInput={chatInput}
            chatSubmitting={chatSubmitting}
            onChangeInput={setChatInput}
            onSubmit={handleChatSubmit}
          />
          <VolunteerCopilotPanel
            tasks={tasks}
            isOnline={isOnline}
            queueCount={queueCount}
            onToggleTask={handleTaskToggle}
            onToggleNet={handleToggleNet}
            onSyncQueue={handleSyncQueue}
          />
        </div>
      </div>
    </div>
  );
};
export default JudgeMode;
