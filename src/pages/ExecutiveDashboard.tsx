import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../context/ServiceContext';
import type { AuditLog } from '../models/audit';
import type { SustainabilityMetrics } from '../models/sustainability';
import { ShieldAlert, Cpu, Award } from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
  const db = useDatabase();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sustainability, setSustainability] = useState<SustainabilityMetrics | null>(null);

  useEffect(() => {
    const unsubAudit = db.listenToAuditLogs((data) => setAuditLogs(data), () => {});
    const unsubSust = db.listenToSustainability('match_wc2026_01', (data) => setSustainability(data), () => {});

    return () => {
      unsubAudit();
      unsubSust();
    };
  }, [db]);

  const { acceptCount, overrideCount, snoozeCount } = useMemo(() => {
    return {
      acceptCount: auditLogs.filter(l => l.decision === 'accept').length,
      overrideCount: auditLogs.filter(l => l.decision === 'override').length,
      snoozeCount: auditLogs.filter(l => l.decision === 'snooze').length,
    };
  }, [auditLogs]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Award className="w-6 h-6 text-sky-400" />
          Executive Operations Overview
        </h1>
        <p className="text-slate-400 text-sm mt-1">Review event-wide statistics, inspect AI performance metrics, and audit human intervention logs.</p>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Human Interventions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">AI Recommendation Responses</span>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-2xl font-bold text-slate-100">{auditLogs.length}</span>
            <span className="text-xs text-emerald-400 font-semibold">{acceptCount} Accepted</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-2 border-t border-slate-850 pt-2">
            <span>Overridden: <strong className="text-rose-400">{overrideCount}</strong></span>
            <span>Snoozed: <strong className="text-slate-200">{snoozeCount}</strong></span>
          </div>
        </div>

        {/* Metric 2: Waste Diversion */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Waste Diversion Index</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-slate-100">
              {sustainability ? `${sustainability.wasteDiversionRate}%` : '75%'}
            </span>
            <span className="text-xs text-slate-400">target 80%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 border-t border-slate-850 pt-2 leading-relaxed">
            Diversion index calculated based on waste weigh scales at concourse sorting bins.
          </p>
        </div>

        {/* Metric 3: Resource Efficiency */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Energy Consumption Rate</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-bold text-slate-100">
              {sustainability ? `${sustainability.energyPerAttendee} kWh` : '1.2 kWh'}
            </span>
            <span className="text-xs text-slate-400">per attendee</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 border-t border-slate-850 pt-2 leading-relaxed">
            Electricity consumption index tracked via smart building meters across all zones.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Human Overrides Audit Feed */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldAlert className="w-4 h-4 text-sky-400" />
            Human Intervention & Overrides Audit Feed
          </h3>

          <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1 text-xs">
            {auditLogs.length === 0 && (
              <div className="text-center text-slate-500 py-8">
                No human responses logged for AI recommendations yet.
              </div>
            )}
            {auditLogs.map((log) => {
              const isOverride = log.decision === 'override';
              return (
                <div key={log.id} className="p-3.5 bg-slate-950/50 border border-slate-850 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-300">Action: {log.action}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isOverride ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {log.decision}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-2 leading-relaxed">Actor: <strong className="text-slate-300">{log.actorUid}</strong></p>
                  {log.rationale && (
                    <div className="mt-2 p-2 bg-slate-900 rounded border border-slate-800/80 text-slate-300 leading-relaxed font-mono text-[11px]">
                      Override Rationale: {log.rationale}
                    </div>
                  )}
                  <span className="text-[10px] text-slate-500 mt-2 block">
                    Logged at: {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Responsible AI Policy Statement Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-sky-400" />
            Responsible AI & Transparency
          </h3>

          <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
            <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-lg">
              <strong className="text-slate-100 block mb-1">Human-in-the-loop:</strong>
              High-impact decisions (lane closures, volunteer shifts) are blocked until approved by organizers or security commanders.
            </div>

            <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-lg">
              <strong className="text-slate-100 block mb-1">Data Privacy by Design:</strong>
              Database models capture aggregate occupancy counters and average flow rates only. No personal identity datasets are logged.
            </div>

            <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-lg">
              <strong className="text-slate-100 block mb-1">Explainability First:</strong>
              Every advisory generated by Gemini must include a confidence percentage and a technical explanation of the input sensor events.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
