import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase, useAI } from '../context/ServiceContext';
import type { SustainabilityMetrics } from '../models/sustainability';
import { Train, Car, Navigation, Cpu } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const TransportationIntelligence: React.FC = () => {
  const db = useDatabase();
  const ai = useAI();

  const [metrics, setMetrics] = useState<SustainabilityMetrics | null>(null);
  const [advice, setAdvice] = useState<string>(
    'Analyzing departure routes and transit schedules...',
  );
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  useEffect(() => {
    const unsub = db.listenToSustainability(
      'match_wc2026_01',
      (data) => {
        setMetrics(data);
      },
      () => {},
    );
    return () => unsub();
  }, [db]);

  // Debounced AI Transit dispatch advice
  useEffect(() => {
    if (!metrics) return;

    const handler = setTimeout(() => {
      setLoadingAdvice(true);
      ai.getSustainabilityAdvice(metrics)
        .then((res) => setAdvice(res))
        .catch(() =>
          setAdvice('Unable to connect to Gemini AI backend. Configure environment variables.'),
        )
        .finally(() => setLoadingAdvice(false));
    }, 1000);

    return () => clearTimeout(handler);
  }, [metrics, ai]);

  // Memoized Chart data
  const transitModeData = useMemo(() => {
    if (!metrics) {
      return [
        { name: 'Public Transit', share: 60, color: '#38bdf8' },
        { name: 'Driving/Parking', share: 30, color: '#f59e0b' },
        { name: 'Walking', share: 10, color: '#34d399' },
      ];
    }
    return [
      { name: 'Public Transit', share: metrics.transitModeShare.transit, color: '#38bdf8' },
      { name: 'Driving/Parking', share: metrics.transitModeShare.driving, color: '#f59e0b' },
      { name: 'Walking', share: metrics.transitModeShare.walking, color: '#34d399' },
    ];
  }, [metrics]);

  const parkingLots = useMemo(
    () => [
      {
        id: 'lot_a',
        name: 'Metro Station Lot',
        status: 'available',
        capacity: '75%',
        occupancy: 320,
        limit: 1200,
      },
      {
        id: 'lot_b',
        name: 'East Plaza Deck',
        status: 'warning',
        capacity: '88%',
        occupancy: 440,
        limit: 500,
      },
      {
        id: 'lot_c',
        name: 'VIP South Lot',
        status: 'full',
        capacity: '98%',
        occupancy: 196,
        limit: 200,
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Train className="w-6 h-6 text-sky-400" />
          Transportation Intelligence
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Monitor multi-modal arrivals, parking occupancy status, and transit routing in real-time.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex gap-4 items-center">
          <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400">
            <Train className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Transit Share</span>
            <h4 className="text-xl font-bold text-slate-100 mt-0.5">
              {metrics ? `${metrics.transitModeShare.transit}%` : '60%'}
            </h4>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex gap-4 items-center">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Lot Occupancy</span>
            <h4 className="text-xl font-bold text-slate-100 mt-0.5">85% Avg</h4>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex gap-4 items-center">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Egress Clearance</span>
            <h4 className="text-xl font-bold text-slate-100 mt-0.5">Normal</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart View */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Train className="w-4 h-4 text-sky-400" />
              Modal Split Telemetry
            </h3>
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transitModeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b' }}
                  />
                  <Legend />
                  <Bar
                    dataKey="share"
                    name="Transit Share %"
                    fill="#38bdf8"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Parking Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-2">
              <Car className="w-4 h-4 text-sky-400" />
              Parking Infrastructure Status
            </h3>
            <div className="flex flex-col gap-2 text-xs">
              {parkingLots.map((lot) => (
                <div
                  key={lot.id}
                  className="flex justify-between items-center p-3 bg-slate-950/60 border border-slate-850 rounded-lg"
                >
                  <div>
                    <span className="font-semibold text-slate-200 block">{lot.name}</span>
                    <span className="text-[10px] text-slate-500">
                      Spaces Occupied: {lot.occupancy} / {lot.limit}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded ${
                      lot.status === 'full'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : lot.status === 'warning'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {lot.capacity} ({lot.status})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Routing Insights */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4">
              <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-sky-400">
                  Gemini Dispatch
                </span>
                <h4 className="text-sm font-bold text-slate-100 mt-0.5">Transportation Advice</h4>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 text-xs leading-relaxed text-slate-300">
              {loadingAdvice ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></span>
                  Calculating dispatch metrics...
                </div>
              ) : (
                <>
                  <strong className="text-slate-100 font-semibold block mb-1">
                    Departure Route Recommendation:
                  </strong>
                  {advice}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
