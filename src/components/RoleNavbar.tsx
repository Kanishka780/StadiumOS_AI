import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/ServiceContext';
import { Globe, LogOut } from 'lucide-react';

export const RoleNavbar: React.FC = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const user = auth.getCurrentUser();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    auth.updateUserLanguage(e.target.value as any);
  };

  const handleLogout = async () => {
    // Return to role selector
    await auth.loginAsRole('fan');
    navigate('/login');
  };

  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-slate-950 group-hover:scale-105 transition-transform">
            OS
          </div>
          <span className="font-bold text-slate-100 text-lg tracking-wider">StadiumOS AI</span>
        </Link>

        <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-400">
          <Link to="/judge" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">Judge Mode ⚖️</Link>
          <Link to="/twin" className="hover:text-slate-100 transition-colors">Digital Twin Map</Link>
          {user && (
            <>
              {user.role === 'organizer' && <Link to="/organizer" className="hover:text-slate-100 transition-colors">Ops Panel</Link>}
              {user.role === 'security' && <Link to="/security" className="hover:text-slate-100 transition-colors">Security Panel</Link>}
              {user.role === 'volunteer' && <Link to="/volunteer" className="hover:text-slate-100 transition-colors">Volunteer Copilot</Link>}
              {user.role === 'accessibility' && <Link to="/accessibility" className="hover:text-slate-100 transition-colors">Accessibility Desk</Link>}
              {user.role === 'fan' && <Link to="/fan" className="hover:text-slate-100 transition-colors">Fan Companion</Link>}
              {user.role === 'executive' && <Link to="/executive" className="hover:text-slate-100 transition-colors">Executive Stats</Link>}
            </>
          )}
          <Link to="/sustainability" className="hover:text-slate-100 transition-colors">Sustainability</Link>
          <Link to="/trust" className="hover:text-slate-100 transition-colors">Trust Center</Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Selection */}
        <div className="flex items-center gap-2 text-slate-400">
          <Globe className="w-4 h-4 text-sky-400" />
          <select 
            value={user?.language || 'en'} 
            onChange={handleLanguageChange}
            className="bg-slate-950 border border-slate-800 rounded p-1 text-xs text-slate-200 outline-none focus:border-sky-500 cursor-pointer"
            aria-label="Select interface language"
          >
            <option value="en">English (EN)</option>
            <option value="es">Español (ES)</option>
            <option value="fr">Français (FR)</option>
          </select>
        </div>

        {/* Role Badge & Switcher */}
        {user && (
          <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold">
            <span className="text-slate-400 capitalize">Role: <strong className="text-sky-400">{user.role}</strong></span>
            <button
              onClick={handleLogout}
              className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Logout / Switch Role"
              aria-label="Switch User Role"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
