import React from 'react';
import { useAuth } from '../context/ServiceContext';
import type { UserRole } from '../models/role';
import { Shield, User, HelpCircle, Users, Activity, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ROLES: { id: UserRole; name: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'organizer', name: 'Operations Organizer', icon: <Briefcase className="w-5 h-5" />, desc: 'Approve resource reassignments and view full stadium operations telemetry.' },
  { id: 'security', name: 'Security Commander', icon: <Shield className="w-5 h-5" />, desc: 'Monitor anomalies, dispatch responders, and block congested pathways.' },
  { id: 'volunteer', name: 'Volunteer Copilot', icon: <Activity className="w-5 h-5" />, desc: 'Receive tasks, report incidents, and utilize offline sync queue.' },
  { id: 'accessibility', name: 'Accessibility User', icon: <HelpCircle className="w-5 h-5" />, desc: 'Request barrier-free routing, view elevator status, and trigger SOS support.' },
  { id: 'fan', name: 'Fan Companion', icon: <User className="w-5 h-5" />, desc: 'Check gate queue predictions, receive rerouting notifications, and use chat help.' },
  { id: 'executive', name: 'Executive Officer', icon: <Users className="w-5 h-5" />, desc: 'Review sustainability metrics and inspect human-override audit logs.' },
];

export const RoleLogin: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = async (role: UserRole) => {
    await auth.loginAsRole(role);
    // Navigate to respective dashboard or main twin view
    if (role === 'fan') navigate('/fan');
    else if (role === 'organizer') navigate('/organizer');
    else if (role === 'volunteer') navigate('/volunteer');
    else if (role === 'security') navigate('/security');
    else if (role === 'accessibility') navigate('/accessibility');
    else if (role === 'executive') navigate('/executive');
    else navigate('/');
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Access StadiumOS AI Portal</h2>
          <p className="text-slate-400 mt-2 text-sm">Select a role view below to enter the live Digital Twin and operational workflows.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role.id)}
              className="flex items-start gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-950 hover:border-sky-500/50 transition-all duration-200 text-left cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <div className="p-3 bg-slate-900 rounded-lg text-slate-400 group-hover:text-sky-400 transition-colors">
                {role.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200 group-hover:text-sky-300 transition-colors">{role.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{role.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
