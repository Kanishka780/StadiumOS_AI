import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase } from '../context/ServiceContext';
import type { Zone } from '../models/zone';
import type { Incident } from '../models/incident';
import type { OperationalEvent } from '../models/event';
import { Shield, Eye, ShieldAlert, AlertTriangle } from 'lucide-react';
import { AIRecommendationCard } from '../components/AIRecommendationCard';

export const SecurityDashboard: React.FC = () => {
  const db = useDatabase();

  const [zones, setZones] = useState<Zone[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  useEffect(() => {
    const unsubZones = db.listenToZones((data) => setZones(data), () => {});
    const unsubIncidents = db.listenToIncidents((data) => setIncidents(data), () => {});
    const unsubEvents = db.listenToEvents((data) => setEvents(data), () => {});

    return () => {
      unsubZones();
      unsubIncidents();
      unsubEvents();
    };
  }, [db]);

  const handleRouteToggle = async (zoneId: string, currentlyBlocked: boolean) => {
    // block or unblock the route
    await db.blockRoute(zoneId, !currentlyBlocked);
  };

  const activeAdvisories = useMemo(() => events.filter(e => e.severity === 'high' || e.severity === 'critical'), [events]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-6 h-6 text-rose-500" />
          Security Command Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">Monitor plaza anomalies, review AI advisory risk rationales, and enforce emergency egress routing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle: Incident Feed & Route Blockers */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Active Incidents Log */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Eye className="w-4 h-4 text-sky-400" />
              Real-Time Security Incident Logs
            </h3>

            <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
              {incidents.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-8">
                  No active security alerts reported. System surveillance is normal.
                </div>
              )}
              {incidents.map((incident) => {
                const isSelected = selectedIncidentId === incident.id;
                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncidentId(incident.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer text-left ${
                      isSelected 
                        ? 'bg-rose-500/10 border-rose-500/50' 
                        : 'bg-slate-950/50 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                        incident.priority === 'critical' ? 'bg-rose-500 text-slate-950 animate-pulse' :
                        incident.priority === 'high' ? 'bg-amber-500 text-slate-950' : 'bg-slate-850 text-slate-400'
                      }`}>
                        {incident.priority}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(incident.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mt-2 font-medium leading-relaxed">{incident.summary}</p>
                    <div className="flex gap-2 mt-2">
                      {incident.departmentsAffected.map((dept) => (
                        <span key={dept} className="text-[8px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                          {dept}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stadium Egress / Path Blocking Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-4 h-4 text-sky-400" />
              Stadium Zone Closure & Pathway Controls
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {zones.map((zone) => {
                const isBlocked = zone.overlayColor === 'crowd-critical';
                return (
                  <div key={zone.id} className="flex justify-between items-center p-3.5 bg-slate-950/50 border border-slate-850 rounded-lg">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-slate-300">{zone.name}</span>
                      <span className="text-[10px] text-slate-500">Flow: {zone.flowRate} fans/min</span>
                    </div>
                    <button
                      onClick={() => handleRouteToggle(zone.id, isBlocked)}
                      className={`px-3 py-1.5 font-bold text-[10px] rounded-lg transition-all border cursor-pointer outline-none ${
                        isBlocked
                          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border-rose-500/30'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border-slate-800'
                      }`}
                    >
                      {isBlocked ? 'Blocked (Click to Open)' : 'Block Route'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: AI Advisories */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Active Critical Advisories
            </h3>

            <div className="flex flex-col gap-4">
              {activeAdvisories.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-8">
                  No critical AI recommendations pending.
                </div>
              )}
              {activeAdvisories.map((ev) => (
                <AIRecommendationCard key={ev.id} event={ev} />
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
