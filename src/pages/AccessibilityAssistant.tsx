import React, { useState, useEffect } from 'react';
import { useDatabase, useAuth } from '../context/ServiceContext';
import { MapPin, Eye, Accessibility, ShieldAlert } from 'lucide-react';


export const AccessibilityAssistant: React.FC = () => {
  const db = useDatabase();
  const auth = useAuth();
  const user = auth.getCurrentUser();

  const [sosStatus, setSosStatus] = useState<'idle' | 'triggered' | 'resolved'>('idle');

  // Accessibility Toggles
  const needsCognitive = user?.accessibilityPrefs.needsCognitiveMode || false;
  const needsVoice = user?.accessibilityPrefs.needsVoiceGuidance || false;
  const needsHighContrast = user?.accessibilityPrefs.needsHighContrast || false;

  useEffect(() => {
    const unsub = db.listenToIncidents((data) => {
      // check if our SOS is active in the feed
      const activeSOS = data.find(i => i.summary.includes('Accessibility SOS') && i.status !== 'resolved');
      if (activeSOS) {
        setSosStatus('triggered');
      } else {
        setSosStatus('idle');
      }
    }, () => {});
    return () => unsub();
  }, [db]);

  const speakNavigation = (text: string) => {
    if (needsVoice && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleTogglePref = async (key: 'needsCognitiveMode' | 'needsVoiceGuidance' | 'needsHighContrast') => {
    const current = user?.accessibilityPrefs[key] || false;
    await auth.updateUserPreferences({ [key]: !current });

    if (key === 'needsVoiceGuidance' && !current) {
      // test speech immediately on enable
      setTimeout(() => speakNavigation('Voice guidance enabled. Standing by for navigation instructions.'), 300);
    }
  };

  const triggerSOS = async () => {
    setSosStatus('triggered');
    speakNavigation('Accessibility S.O.S. triggered. Emergency support is on the way to your current location.');
    await db.reportIncident({
      summary: 'Accessibility SOS triggered. Mobility support assistance required at concourse corridor EL-04.',
      priority: 'critical',
      departmentsAffected: ['medical', 'stadium_ops'],
      status: 'reported',
      zoneId: 'zone_concourse',
    });
  };

  // Predefined elevator statuses
  const elevators = [
    { name: 'Elevator Lift EL-01', status: 'operational', location: 'Gate A Entrance' },
    { name: 'Elevator Lift EL-02', status: 'operational', location: 'Gate C Entrance' },
    { name: 'Elevator Lift EL-03', status: 'operational', location: 'Concourse East Corridor' },
    { name: 'Elevator Lift EL-04', status: 'maintenance', location: 'Concourse West (Locked)' },
  ];

  return (
    <div className={`flex flex-col gap-6 ${needsCognitive ? 'max-w-xl mx-auto' : ''}`}>
      
      {/* Page Header */}
      <div>
        <h1 className={`${needsCognitive ? 'text-3xl font-extrabold' : 'text-2xl font-bold'} text-slate-100 flex items-center gap-2`}>
          <Accessibility className="w-6 h-6 text-sky-400" />
          Accessibility Assistant
        </h1>
        {!needsCognitive && (
          <p className="text-slate-400 text-sm mt-1">Request step-by-step assistance, monitor barrier-free elevator statuses, and adjust visual guides.</p>
        )}
      </div>

      {/* Accessibility Controls Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleTogglePref('needsHighContrast')}
          className={`flex items-center justify-between p-3 border rounded-lg text-xs font-semibold cursor-pointer outline-none ${
            needsHighContrast ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}
        >
          <span>High Contrast Mode</span>
          <span>{needsHighContrast ? 'ON' : 'OFF'}</span>
        </button>
        <button
          onClick={() => handleTogglePref('needsVoiceGuidance')}
          className={`flex items-center justify-between p-3 border rounded-lg text-xs font-semibold cursor-pointer outline-none ${
            needsVoice ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}
        >
          <span>Voice Guidance Navigation</span>
          <span>{needsVoice ? 'ON' : 'OFF'}</span>
        </button>
        <button
          onClick={() => handleTogglePref('needsCognitiveMode')}
          className={`flex items-center justify-between p-3 border rounded-lg text-xs font-semibold cursor-pointer outline-none ${
            needsCognitive ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}
        >
          <span>Cognitive Mode (Simple View)</span>
          <span>{needsCognitive ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Main Grid: Adapts Layout if Cognitive Mode is Active */}
      <div className={needsCognitive ? 'flex flex-col gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
        
        {/* Left/Top: Navigation & Emergency SOS */}
        <div className="flex flex-col gap-6">
          
          {/* Evacuation / Wheelchair Routes directions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className={`${needsCognitive ? 'text-xl font-bold' : 'text-sm font-semibold'} text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3`}>
              <MapPin className="w-4 h-4 text-sky-400" />
              Wheelchair Access Directions
            </h3>

            <div className="flex flex-col gap-3">
              <div 
                className="p-3.5 bg-slate-950/50 border border-slate-850 rounded-lg text-xs hover:border-slate-800 transition-all cursor-pointer"
                onClick={() => speakNavigation('Route 1: From Parking sector B to Entrance Gate C. Access via ramp East. Estimated time 8 minutes.')}
              >
                <div className="font-semibold text-slate-200">Route 1: Parking lot to Entry Gate C</div>
                <p className="text-slate-400 mt-1 leading-relaxed">Direct path via East outer concrete ramp. Surface is anti-slip concrete. Cross-slope under 2%.</p>
              </div>

              <div 
                className="p-3.5 bg-slate-950/50 border border-slate-850 rounded-lg text-xs hover:border-slate-800 transition-all cursor-pointer"
                onClick={() => speakNavigation('Route 2: Concourse corridor elevator EL-02 to Seating Section tunnel 4. All lifts functional.')}
              >
                <div className="font-semibold text-slate-200">Route 2: Concourse elevator to Seating Tunnel 4</div>
                <p className="text-slate-400 mt-1 leading-relaxed">Access Elevator EL-02 on level 1 concourse. Direct connection to wheelchair companion seating deck 4.</p>
              </div>
            </div>
          </div>

          {/* SOS Dispatch Trigger */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-center flex flex-col gap-4">
            <h3 className={`${needsCognitive ? 'text-xl font-bold' : 'text-sm font-semibold'} text-slate-200 flex items-center justify-center gap-2`}>
              <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
              Emergency Assistance Dispatch
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed px-4">
              Need immediate mobility, medical, or evacuation help? Click the button below to notify nearby supervisors instantly.
            </p>

            <button
              onClick={triggerSOS}
              disabled={sosStatus === 'triggered'}
              className={`w-full py-4 text-slate-950 font-bold ${
                needsCognitive ? 'text-lg rounded-xl' : 'text-xs rounded-lg'
              } transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
                sosStatus === 'triggered' ? 'bg-rose-900 text-rose-300' : 'bg-rose-500 hover:bg-rose-600'
              }`}
            >
              {sosStatus === 'triggered' ? 'SOS Active - Support Dispatched' : 'TRIGGER EMERGENCY SOS'}
            </button>
          </div>

        </div>

        {/* Right/Bottom: Elevator statuses */}
        {!needsCognitive && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Eye className="w-4 h-4 text-sky-400" />
              Live Elevator Lift Telemetry
            </h3>

            <div className="flex flex-col gap-3">
              {elevators.map((elv, index) => {
                const isDown = elv.status !== 'operational';
                return (
                  <div key={index} className="flex justify-between items-center p-3 bg-slate-950/50 border border-slate-850 rounded-lg text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{elv.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Location: {elv.location}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full uppercase font-bold text-[9px] ${
                      isDown ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {elv.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
