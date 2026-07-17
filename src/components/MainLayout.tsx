import React from 'react';
import { RoleNavbar } from './RoleNavbar';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { useAuth } from '../context/ServiceContext';
import { SkipToContent } from './layout/SkipToContent';
import { LiveRegion } from './shared/LiveRegion';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const auth = useAuth();
  const user = auth.getCurrentUser();

  // Dynamically set high contrast classes based on user preferences
  const highContrastClass = user?.accessibilityPrefs.needsHighContrast
    ? 'high-contrast-theme bg-black text-white'
    : 'bg-slate-950 text-slate-100';

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-200 ${highContrastClass}`}>
      <SkipToContent />
      <LiveRegion />
      <RoleNavbar />
      <main id="main-content" className="flex-1 w-full max-w-7xl mx-auto px-6 py-8" tabIndex={-1}>
        {children}
      </main>
      <DiagnosticsPanel />
    </div>
  );
};
