import React from 'react';
import type { OperationalEvent } from '../models/event';
import type { Incident } from '../models/incident';
import type { VolunteerTask } from '../models/task';
import { AIRecommendationCard } from '../components/AIRecommendationCard';
import {
  Play,
  ShieldAlert,
  Cpu,
  CheckCircle,
  Wifi,
  WifiOff,
  Send,
  HardDrive,
  Globe,
  Users,
} from 'lucide-react';

interface ScenarioControllerProps {
  activeScenario: string;
  onTrigger: (name: string) => void;
}

export const ScenarioController: React.FC<ScenarioControllerProps> = ({
  activeScenario,
  onTrigger,
}) => {
  const scenarios = [
    'Gate B Congestion',
    'Medical Emergency',
    'Accessibility SOS',
    'Volunteer Reassignment',
    'Food Court Overflow',
    'Sustainability Alert',
    'Parking Overflow',
    'Severe Weather',
    'Emergency Evacuation',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
      <h2 className="text-xs uppercase tracking-wider font-bold text-slate-300 flex items-center gap-2 mb-3">
        <Play className="w-4 h-4 text-amber-400" />
        1-Click Scenario Trigger
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {scenarios.map((scen) => (
          <button
            key={scen}
            onClick={() => onTrigger(scen)}
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
  );
};

interface OrganizerTelemetryProps {
  selectedZoneId: string | null;
  activeAdvisory: OperationalEvent | undefined;
  ingesting: boolean;
  onIngest: () => void;
}

export const OrganizerTelemetry: React.FC<OrganizerTelemetryProps> = ({
  selectedZoneId,
  activeAdvisory,
  ingesting,
  onIngest,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3 min-h-[300px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
        <h3 className="text-xs uppercase tracking-wider font-bold text-slate-200 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          Organizer Telemetry
        </h3>
        <span className="text-[10px] bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-slate-400">
          Zone:{' '}
          <strong className="text-sky-400 uppercase">{selectedZoneId?.replace('zone_', '')}</strong>
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {activeAdvisory ? (
          <AIRecommendationCard event={activeAdvisory} />
        ) : (
          <div className="text-center text-slate-500 text-xs py-8 my-auto flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-emerald-500/60" />
            <span>
              Operations stable. Select a red zone or trigger a scenario to view Gemini suggestions.
            </span>
          </div>
        )}
      </div>

      <button
        onClick={onIngest}
        disabled={ingesting || !selectedZoneId}
        className="w-full py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-slate-950 font-bold text-[10px] uppercase rounded-lg transition-colors cursor-pointer"
      >
        {ingesting ? 'Injecting telemetry...' : 'Manual Density Ingestion Trigger'}
      </button>
    </div>
  );
};

interface SecurityRespondersProps {
  incidents: Incident[];
  blockedRoutes: string[];
  onBlockToggle: (zoneId: string, blocked: boolean) => void;
}

export const SecurityResponders: React.FC<SecurityRespondersProps> = ({
  incidents,
  blockedRoutes,
  onBlockToggle,
}) => {
  return (
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
          incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-2 bg-slate-950 border border-slate-850 rounded text-[11px] leading-relaxed text-slate-300"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-rose-400 uppercase text-[9px]">
                  {inc.priority} alert
                </span>
                <span className="text-slate-500 text-[9px]">
                  {new Date(inc.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="mt-1 font-semibold text-slate-200">{inc.summary}</p>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-850 pt-2.5 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase">
          Emergency Route Override
        </span>
        <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-950/50 p-2 border border-slate-850 rounded">
          <span>Gate B Access Route</span>
          <button
            onClick={() => onBlockToggle('zone_gate_b', !blockedRoutes.includes('zone_gate_b'))}
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
  );
};

interface FanChatbotPanelProps {
  chatMessages: { sender: 'user' | 'ai'; text: string }[];
  chatInput: string;
  chatSubmitting: boolean;
  onChangeInput: (val: string) => void;
  onSubmit: (text: string) => void;
}

export const FanChatbotPanel: React.FC<FanChatbotPanelProps> = ({
  chatMessages,
  chatInput,
  chatSubmitting,
  onChangeInput,
  onSubmit,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3 min-h-[300px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
        <h3 className="text-xs uppercase tracking-wider font-bold text-slate-200 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          Fan Companion Chat
        </h3>
        <div className="flex gap-2 text-[10px] text-slate-400">
          <span>
            Gate A: <strong className="text-emerald-400">4m</strong>
          </span>
          <span>
            Gate B: <strong className="text-rose-400">25m</strong>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[140px] flex flex-col gap-2 pr-1 font-mono text-[10px]">
        {chatMessages.length === 0 && (
          <div className="text-center text-slate-500 py-6 my-auto">
            Click below queries or type to test localized AI responses.
          </div>
        )}
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-1.5 max-w-[90%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
          >
            <div className="bg-slate-950 border border-slate-850 px-1 py-0.5 rounded text-slate-500 font-bold uppercase scale-[0.9]">
              {msg.sender === 'user' ? 'ME' : 'AI'}
            </div>
            <div
              className={`p-2 rounded-lg text-slate-300 leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-sky-950 border border-sky-800'
                  : 'bg-slate-950 border border-slate-850'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-slate-850 pt-2">
        <button
          onClick={() => onSubmit('How are food lines?')}
          className="px-2 py-0.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 rounded text-[9px] cursor-pointer"
        >
          Food wait times?
        </button>
        <button
          onClick={() => onSubmit('Show exit routes to metro')}
          className="px-2 py-0.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 rounded text-[9px] cursor-pointer"
        >
          Exit routes?
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(chatInput);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={chatInput}
          onChange={(e) => onChangeInput(e.target.value)}
          placeholder="Ask about food, exit routes..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={chatSubmitting}
          className="px-3 bg-sky-500 hover:bg-sky-600 text-slate-950 rounded cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

interface VolunteerCopilotPanelProps {
  tasks: VolunteerTask[];
  isOnline: boolean;
  queueCount: number;
  onToggleTask: (taskId: string, currentStatus: VolunteerTask['status']) => void;
  onToggleNet: () => void;
  onSyncQueue: () => void;
}

export const VolunteerCopilotPanel: React.FC<VolunteerCopilotPanelProps> = ({
  tasks,
  isOnline,
  queueCount,
  onToggleTask,
  onToggleNet,
  onSyncQueue,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3 min-h-[300px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
        <h3 className="text-xs uppercase tracking-wider font-bold text-slate-200 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-amber-500" />
          Volunteer Copilot
        </h3>

        <button
          onClick={onToggleNet}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer outline-none ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 animate-pulse'
          }`}
          title="Click to toggle network status (Online/Offline simulator)"
        >
          {isOnline ? (
            <>
              <Wifi className="w-3 h-3" /> Online
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" /> Offline
            </>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[160px] flex flex-col gap-2">
        {tasks.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-8">
            No volunteer tasks assigned.
          </div>
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className="p-2.5 bg-slate-950 border border-slate-850 rounded flex justify-between items-center text-xs"
            >
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">
                  Task: {t.id.replace('tsk_', '')}
                </span>
                <p className="font-semibold text-slate-200 mt-0.5">{t.instructions}</p>
              </div>
              <button
                onClick={() => onToggleTask(t.id, t.status)}
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

      <div className="border-t border-slate-850 pt-2.5 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-slate-500" />
          Offline Write Queue:{' '}
          <strong className={queueCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-300'}>
            {queueCount}
          </strong>
        </span>
        {queueCount > 0 && isOnline && (
          <button
            onClick={onSyncQueue}
            className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-[9px] cursor-pointer"
          >
            Flush Queue
          </button>
        )}
      </div>
    </div>
  );
};
