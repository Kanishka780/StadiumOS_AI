import React, { useState, useEffect } from 'react';
import { useDatabase, useAI } from '../context/ServiceContext';
import type { SustainabilityMetrics } from '../models/sustainability';
import { Leaf, Award, Recycle, Zap, Droplet, Users, Cpu } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export const SustainabilityIntelligence: React.FC = () => {
  const db = useDatabase();
  const ai = useAI();

  const [metrics, setMetrics] = useState<SustainabilityMetrics | null>(null);
  const [advice, setAdvice] = useState<string>('Analyzing current operational patterns...');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  useEffect(() => {
    const unsub = db.listenToSustainability('match_wc2026_01', (data) => {
      setMetrics(data);
    }, () => {});
    return () => unsub();
  }, [db]);

  useEffect(() => {
    if (metrics) {
      setLoadingAdvice(true);
      ai.getSustainabilityAdvice(metrics)
        .then((res) => setAdvice(res))
        .catch(() => setAdvice('Unable to connect to Gemini AI backend. Configure environment variables.'))
        .finally(() => setLoadingAdvice(false));
    }
  }, [metrics, ai]);

  // Format Recharts data
  const pieData = metrics ? [
    { name: 'Public Transit', value: metrics.transitModeShare.transit, color: '#38bdf8' },
    { name: 'Driving / Parking', value: metrics.transitModeShare.driving, color: '#94a3b8' },
    { name: 'Walking', value: metrics.transitModeShare.walking, color: '#34d399' },
  ] : [
    { name: 'Public Transit', value: 60, color: '#38bdf8' },
    { name: 'Driving / Parking', value: 30, color: '#94a3b8' },
    { name: 'Walking', value: 10, color: '#34d399' },
  ];

  const historicalBarData = [
    { name: 'Match 1', waste: 65, energy: 1.4 },
    { name: 'Match 2', waste: 70, energy: 1.3 },
    { name: 'Match 3', waste: 75, energy: 1.2 },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Leaf className="w-6 h-6 text-emerald-400" />
          Sustainability Intelligence
        </h1>
        <p className="text-slate-400 text-sm mt-1">Track energy usage, waste diversion indexes, and transit modal share in real-time.</p>
      </div>

      {/* Sustainability Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Waste Diversion Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex gap-4 items-center">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Recycle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Waste Diversion</span>
            <h4 className="text-xl font-bold text-slate-100 mt-0.5">{metrics ? `${metrics.wasteDiversionRate}%` : '75%'}</h4>
          </div>
        </div>

        {/* Energy Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex gap-4 items-center">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Energy Consumption</span>
            <h4 className="text-xl font-bold text-slate-100 mt-0.5">{metrics ? `${metrics.energyPerAttendee} kWh` : '1.2 kWh'} / att</h4>
          </div>
        </div>

        {/* Water Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow flex gap-4 items-center">
          <div className="p-3 bg-sky-500/10 rounded-xl text-sky-400">
            <Droplet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">Water Consumption</span>
            <h4 className="text-xl font-bold text-slate-100 mt-0.5">{metrics ? `${metrics.waterUsage.toLocaleString()} L` : '45,000 L'}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Transit Share Pie Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users className="w-4 h-4 text-sky-400" />
              Fan Transit Modal Distribution
            </h3>

            <div className="w-full h-[250px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Historical Progress Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Award className="w-4 h-4 text-emerald-400" />
              Historical Tournament Progress
            </h3>

            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Bar dataKey="waste" name="Waste Diversion %" fill="#34d399" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="energy" name="Energy per Attendee (kWh)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column: AI Sustainability Insights */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-4">
              <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-sky-400">Gemini Analytics</span>
                <h4 className="text-sm font-bold text-slate-100 mt-0.5">Efficiency Insights</h4>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 text-xs leading-relaxed text-slate-300">
              {loadingAdvice ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></span>
                  Processing metrics...
                </div>
              ) : (
                <>
                  <strong className="text-slate-100 font-semibold block mb-1">AI Recommendation:</strong>
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
