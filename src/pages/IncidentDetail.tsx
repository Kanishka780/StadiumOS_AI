import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatabase, useAI } from '../context/ServiceContext';
import type { Incident } from '../models/incident';
import { AlertCircle, Clock, MapPin, ArrowLeft, Cpu } from 'lucide-react';

export const IncidentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const db = useDatabase();
  const ai = useAI();
  
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<string>('Generating AI incident digest...');
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const unsub = db.listenToIncidents(
      (data) => setIncidents(data),
      (err) => setError(err.message)
    );
    return () => unsub();
  }, [db]);

  const incident = incidents.find((i) => i.id === id);

  useEffect(() => {
    if (incident) {
      setLoadingSummary(true);
      ai.summarizeIncident(incident.id)
        .then((res) => setSummary(res))
        .catch(() => setSummary('Failed to connect to Gemini AI summary layer.'))
        .finally(() => setLoadingSummary(false));
    }
  }, [incident, ai]);

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <Link to="/" className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-3 h-3" />
          Back to Twin Map
        </Link>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          Incident Details
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs">
          {error}
        </div>
      )}

      {incident ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col gap-4 overflow-hidden">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <span className="text-[10px] uppercase font-bold text-slate-500">Incident Reference: <strong className="text-slate-300">{incident.id}</strong></span>
            <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full ${
              incident.priority === 'critical' ? 'bg-rose-500 text-slate-950 animate-pulse' :
              incident.priority === 'high' ? 'bg-amber-500 text-slate-950' : 'bg-slate-850 text-slate-400'
            }`}>
              {incident.priority}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Summary</span>
            <p className="text-xs text-slate-200 leading-relaxed font-semibold">{incident.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-4 h-4 text-sky-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Zone Area</div>
                <div className="text-slate-300 font-medium capitalize">{incident.zoneId.replace('zone_', ' ')}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-4 h-4 text-sky-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Time Reported</div>
                <div className="text-slate-300 font-medium">
                  {new Date(incident.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-850 pt-4">
            <span className="text-[10px] uppercase font-bold text-slate-500">Status</span>
            <span className="text-xs text-emerald-400 font-semibold capitalize">{incident.status}</span>
          </div>

          {/* AI-Reasoned Summary Segment (PromptWars: Problem Statement Alignment) */}
          <div className="flex flex-col gap-2 border-t border-slate-800 pt-5 bg-slate-950/40 -mx-6 -mb-6 p-6">
            <span className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 animate-pulse" />
              Gemini AI Operational Digest
            </span>
            {loadingSummary ? (
              <span className="text-xs text-slate-500 animate-pulse font-mono">Running reasoning engine...</span>
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-950 border border-slate-850 p-3 rounded-lg">
                {summary}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
          Loading incident or reference {id} not found in database.
        </div>
      )}
    </div>
  );
};
