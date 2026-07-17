import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/ServiceContext';
import type { EventTimelineEntry } from '../models/event';
import {
  Activity,
  Users,
  ShieldAlert,
  Cpu,
  Globe,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';

/**
 * A beautiful, real-time glassmorphic timeline representing progressive
 * operational event propagation through the smart venue ecosystem.
 */
export const OperationsTimeline: React.FC = () => {
  const db = useDatabase();
  const [timeline, setTimeline] = useState<EventTimelineEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = db.listenToTimeline(
      (data) => setTimeline(data),
      (err) => setError(err.message),
    );
    return () => unsub();
  }, [db]);

  const getStageIcon = (stage: EventTimelineEntry['stage']) => {
    switch (stage) {
      case 'twin':
        return <MapPin className="w-4 h-4 text-sky-400" />;
      case 'fan':
        return <Globe className="w-4 h-4 text-emerald-400" />;
      case 'volunteer':
        return <Users className="w-4 h-4 text-amber-400" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'accessibility':
        return <Activity className="w-4 h-4 text-purple-400" />;
      case 'executive':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStageColor = (stage: EventTimelineEntry['stage']) => {
    switch (stage) {
      case 'twin':
        return 'border-sky-500/30 bg-sky-500/10 text-sky-400';
      case 'fan':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400';
      case 'volunteer':
        return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      case 'security':
        return 'border-rose-500/30 bg-rose-500/10 text-rose-400';
      case 'accessibility':
        return 'border-purple-500/30 bg-purple-500/10 text-purple-400';
      case 'executive':
        return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400';
      default:
        return 'border-slate-500/30 bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs uppercase tracking-wider font-bold text-slate-200 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-sky-400 animate-pulse" />
          Live Operations Timeline
        </h3>
        <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-mono font-bold">
          E2E Propagation
        </span>
      </div>

      {error && <span className="text-xs text-rose-400">Error: {error}</span>}

      <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 flex flex-col gap-4 relative pl-4 border-l border-slate-800">
        {timeline.length === 0 ? (
          <div className="text-center text-slate-500 text-xs py-10 my-auto flex flex-col items-center gap-2">
            <Clock className="w-8 h-8 text-slate-700" />
            <span>
              Idle. Trigger a simulator scenario or manual signal to view the operational timeline.
            </span>
          </div>
        ) : (
          timeline.map((entry, idx) => (
            <div
              key={entry.id}
              className={`relative flex flex-col gap-1.5 p-3 rounded-lg border transition-all hover:bg-slate-950/40 ${getStageColor(entry.stage)}`}
            >
              {/* Connector dot indicator */}
              <div className="absolute -left-[21px] top-4 w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
                <div
                  className={`w-1 h-1 rounded-full ${
                    idx === 0 ? 'bg-sky-400 animate-ping' : 'bg-slate-400'
                  }`}
                />
              </div>

              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-slate-950/80 border border-slate-800">
                    {getStageIcon(entry.stage)}
                  </span>
                  <span className="font-semibold text-slate-200 capitalize text-xs">
                    {entry.stage} ➔ {entry.title}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-mono pl-8">
                {entry.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
