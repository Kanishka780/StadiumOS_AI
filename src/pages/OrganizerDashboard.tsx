import React, { useState, useEffect } from 'react';
import { useDatabase, useAI } from '../context/ServiceContext';
import type { Zone } from '../models/zone';
import type { OperationalEvent } from '../models/event';
import { Play, Activity, Users, Cpu, CheckCircle } from 'lucide-react';
import { AIRecommendationCard } from '../components/AIRecommendationCard';

export const OrganizerDashboard: React.FC = () => {
  const db = useDatabase();
  const ai = useAI();

  const [zones, setZones] = useState<Zone[]>([]);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone_gate_b');
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    const unsubZones = db.listenToZones((data) => setZones(data), () => {});
    const unsubEvents = db.listenToEvents((data) => setEvents(data), () => {});

    return () => {
      unsubZones();
      unsubEvents();
    };
  }, [db]);

  const handleIngestSimulatedSignal = async () => {
    setIngesting(true);
    try {
      // Trigger actual AI ingest endpoint
      await ai.ingestSignal(selectedZoneId, 'turnstile_density', {
        count: 140,
        severity: 'high',
        description: 'Sensor threshold exceeded at entrance lanes.'
      });
    } catch (err) {
      console.error('Failed to ingest signal:', err);
    } finally {
      setIngesting(false);
    }
  };

  const activeEvent = events.find((e) => e.zoneId === selectedZoneId);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Activity className="w-6 h-6 text-sky-400" />
          Operations Command Console
        </h1>
        <p className="text-slate-400 text-sm mt-1">Review live crowd telemetry, trigger Gemini reasoning passes, and orchestrate volunteer actions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Telemetry & Ingestion */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Live Zone Telemetry List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users className="w-4 h-4 text-sky-400" />
              Stadium Zone Density Indices
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {zones.map((zone) => {
                const isSelected = selectedZoneId === zone.id;
                const isCritical = zone.overlayColor === 'crowd-critical';
                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer text-left flex justify-between items-center ${
                      isSelected 
                        ? 'bg-sky-500/10 border-sky-500/50' 
                        : 'bg-slate-950/50 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold text-slate-300 block">{zone.name}</span>
                      <span className="text-[10px] text-slate-500">Flow: {zone.flowRate} fans/min</span>
                    </div>
                    <span className={`text-xs font-bold ${isCritical ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
                      {zone.currentDensity}% density
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trigger Telemetry Ingestion Tool */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Play className="w-4 h-4 text-sky-400" />
              Manual Telemetry Ingest Trigger
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Inject a turnstile density spike telemetry to trigger an immediate server-side Gemini Pro evaluation cycle.
            </p>

            <div className="flex items-center gap-4">
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-sky-500 cursor-pointer"
                aria-label="Select target zone"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>

              <button
                onClick={handleIngestSimulatedSignal}
                disabled={ingesting}
                className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-400 flex items-center gap-1.5"
              >
                {ingesting ? 'Processing Ingestion...' : 'Ingest Spikes & Call AI'}
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: AI Advisors */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <Cpu className="w-4 h-4 text-sky-400" />
              Active AI Advisory
            </h3>

            {activeEvent ? (
              <AIRecommendationCard event={activeEvent} />
            ) : (
              <div className="text-center text-slate-500 text-xs py-8 flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8 text-emerald-500/60" />
                <span>Zone status is normal. Select other gates or trigger congestion spikes to analyze.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
