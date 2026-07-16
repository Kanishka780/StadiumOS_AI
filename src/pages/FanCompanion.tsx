import React, { useState, useEffect } from 'react';
import { useDatabase, useAuth } from '../context/ServiceContext';
import type { Zone } from '../models/zone';
import type { OperationalEvent } from '../models/event';
import { Clock, Bell, Globe, Send, User } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    welcome: 'Welcome to your Tournament Companion',
    rerouteAlert: 'REROUTE NOTICE: Gate B is heavily congested. Please use Gate C for entry.',
    predictions: 'Gate Queue Time Predictions',
    askHelp: 'Ask Assistant',
    send: 'Send',
    placeholder: 'Ask about food lines, exit routes...',
    responseFood: 'North food stands currently have zero wait times. South food stands are at 20 minutes.',
    responseExit: 'Please follow Exit Route C (marked green) to the metro station to avoid crowds.',
    responseGeneral: 'I can assist you with queue times, accessible routes, and exit paths. Please let me know what you need.',
  },
  es: {
    welcome: 'Bienvenido a su Compañero de Torneo',
    rerouteAlert: 'AVISO DE DESVÍO: La Puerta B está muy congestionada. Utilice la Puerta C para entrar.',
    predictions: 'Predicciones del tiempo de cola en las puertas',
    askHelp: 'Preguntar al asistente',
    send: 'Enviar',
    placeholder: 'Preguntar sobre líneas de comida, rutas de salida...',
    responseFood: 'Los puestos de comida del norte no tienen tiempo de espera. Los del sur tienen 20 minutos.',
    responseExit: 'Siga la ruta de salida C (marcada en verde) hacia la estación de metro para evitar multitudes.',
    responseGeneral: 'Puedo ayudarle con tiempos de cola, rutas accesibles y caminos de salida. Indíqueme qué necesita.',
  },
  fr: {
    welcome: 'Bienvenue sur votre Compagnon de Tournoi',
    rerouteAlert: 'AVIS DE REROUTAGE: La porte B est très encombrée. Veuillez utiliser la porte C pour entrer.',
    predictions: 'Prévisions du temps d\'attente aux portes',
    askHelp: 'Demander à l\'assistant',
    send: 'Envoyer',
    placeholder: 'Poser des questions sur la nourriture, les sorties...',
    responseFood: 'Les stands de nourriture Nord ont zéro temps d\'attente. Les stands Sud sont à 20 minutes.',
    responseExit: 'Veuillez suivre la route de sortie C (marquée en vert) vers la station de métro pour éviter les foules.',
    responseGeneral: 'Je peux vous aider avec les temps d\'attente, les itinéraires accessibles et les sorties. Dites-moi ce dont vous avez besoin.',
  }
};

export const FanCompanion: React.FC = () => {
  const db = useDatabase();
  const auth = useAuth();
  const user = auth.getCurrentUser();
  const lang = user?.language || 'en';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const [zones, setZones] = useState<Zone[]>([]);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Rate-limiting notification check
  const [nudgeActive, setNudgeActive] = useState(false);
  const [lastNudgeTime, setLastNudgeTime] = useState<number>(0);

  useEffect(() => {
    const unsubZones = db.listenToZones((data) => setZones(data), () => {});
    const unsubEvents = db.listenToEvents((data) => setEvents(data), () => {});

    return () => {
      unsubZones();
      unsubEvents();
    };
  }, [db]);

  // Handle dynamic push notification logic (Rule 11/17 check)
  useEffect(() => {
    const congestionEvent = events.find(e => e.type === 'congestion' && e.zoneId === 'zone_gate_b');
    if (congestionEvent) {
      const now = Date.now();
      // Rate limit proactive nudges: max 1 per 5 minutes (300,000 ms)
      if (now - lastNudgeTime > 300000) {
        setNudgeActive(true);
        setLastNudgeTime(now);
      }
    } else {
      setNudgeActive(false);
    }
  }, [events, lastNudgeTime]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputText('');

    // Simulated responsive AI support
    setTimeout(() => {
      let reply = t.responseGeneral;
      if (userMsg.toLowerCase().includes('food') || userMsg.toLowerCase().includes('comida') || userMsg.toLowerCase().includes('nourriture')) {
        reply = t.responseFood;
      } else if (userMsg.toLowerCase().includes('exit') || userMsg.toLowerCase().includes('salida') || userMsg.toLowerCase().includes('sortie')) {
        reply = t.responseExit;
      }
      setMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 800);
  };

  const getGateQueueTime = (zoneId: string): string => {
    const z = zones.find(x => x.id === zoneId);
    if (!z) return 'Loading...';
    if (z.currentDensity > 80) return '25 mins (High Delay)';
    if (z.currentDensity > 50) return '12 mins (Moderate)';
    return 'Under 4 mins';
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Rate-Limited Proactive Alert */}
      {nudgeActive && (
        <div className="bg-amber-500 text-slate-950 p-4 rounded-xl font-semibold flex items-center gap-3 animate-pulse shadow-lg">
          <Bell className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{t.rerouteAlert}</span>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{t.welcome}</h1>
        <p className="text-slate-400 text-sm mt-1">Navigate, check wait times, and get assistance in your preferred language.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Queue Predictions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-sky-400" />
            {t.predictions}
          </h3>

          <div className="flex flex-col gap-3">
            {['zone_gate_a', 'zone_gate_b', 'zone_gate_c', 'zone_gate_d'].map((gateId) => {
              const zone = zones.find(z => z.id === gateId);
              const qTime = getGateQueueTime(gateId);
              const isHeavy = zone && zone.currentDensity > 80;
              return (
                <div key={gateId} className="flex justify-between items-center p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                  <span className="text-xs font-semibold text-slate-300">{zone?.name || 'Gate'}</span>
                  <span className={`text-xs font-bold ${isHeavy ? 'text-rose-400' : 'text-emerald-400'}`}>{qTime}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Assistant Chat */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-[400px]">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <Globe className="w-4 h-4 text-sky-400" />
            {t.askHelp}
          </h3>

          {/* Messages Outlet */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 mb-4">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 text-xs my-auto">
                Ask a question to receive real-time translated directions or details.
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-400 flex items-center justify-center flex-shrink-0 w-6 h-6`}>
                  {msg.sender === 'user' ? <User className="w-3 h-3" /> : 'AI'}
                </div>
                <div className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-sky-500 text-slate-950 font-medium' 
                    : 'bg-slate-950 border border-slate-800 text-slate-300'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-850 pt-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.placeholder}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="p-2 bg-sky-500 hover:bg-sky-600 text-slate-950 rounded-lg cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
