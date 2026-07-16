import React, { useState, useEffect } from 'react';
import { useDatabase } from '../context/ServiceContext';
import type { Zone } from '../models/zone';
import type { OperationalEvent } from '../models/event';
import { DigitalTwinMap } from '../components/DigitalTwinMap';
import { AIRecommendationCard } from '../components/AIRecommendationCard';
import { MapPin, Users, ShieldAlert, RefreshCcw } from 'lucide-react';

export const DigitalTwin: React.FC = () => {
  const db = useDatabase();
  const [zones, setZones] = useState<Zone[]>([]);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubZones = db.listenToZones(
      (data) => setZones(data),
      (err) => setError(err.message)
    );
    const unsubEvents = db.listenToEvents(
      (data) => setEvents(data),
      (err) => setError(err.message)
    );

    return () => {
      unsubZones();
      unsubEvents();
    };
  }, [db]);

  const selectedZone = zones.find((z) => z.id === selectedZoneId);
  const activeEvent = events.find((e) => e.zoneId === selectedZoneId);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Live Stadium Digital Twin</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time vector telemetry showing density overlays, flow metrics, and AI recommendations.</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-lg text-sm flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          <span>Error loading digital twin state: {error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <DigitalTwinMap
            zones={zones}
            selectedZoneId={selectedZoneId}
            onSelectZone={(id) => setSelectedZoneId(id)}
          />
        </div>

        {/* Right Column: Detail & Advisor Panels */}
        <div className="flex flex-col gap-4">
          
          {/* Selected Zone Detail Card */}
          {selectedZone ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
                <MapPin className="w-4 h-4 text-sky-400" />
                {selectedZone.name}
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Density Index</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold text-slate-100">{selectedZone.currentDensity}%</span>
                    <span className="text-xs text-slate-400">capacity</span>
                  </div>
                </div>
                <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Egress Flow</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold text-slate-100">{selectedZone.flowRate}</span>
                    <span className="text-xs text-slate-400">fans/min</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <RefreshCcw className="w-3.5 h-3.5" />
                Last updated: {new Date(selectedZone.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
              Select an entry gate or seating zone on the schematic map to inspect live metrics.
            </div>
          )}

          {/* AI Recommendation Overlay */}
          {selectedZoneId && activeEvent ? (
            <AIRecommendationCard event={activeEvent} />
          ) : selectedZoneId ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400/60" />
              <span>No AI advisories active for this zone. Operations are currently stable.</span>
            </div>
          ) : null}

        </div>

      </div>
    </div>
  );
};
