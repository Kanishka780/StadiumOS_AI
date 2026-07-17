import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ServiceProvider } from './context/ServiceContext';
import { LocalStorageAuthService } from './services/authService';
import { LocalStorageQueueService } from './services/offlineQueue';
import { ScenarioAdapter } from './services/scenarioAdapter';
import { FirebaseDbService } from './services/firebaseService';
import { GeminiAIService } from './services/geminiService';
import type { DatabaseService, AIService, NotificationService } from './services/interfaces';
import { MainLayout } from './components/MainLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

// Lazy loading persona pages for bundle optimization (PromptWars: Efficiency)
const RoleLogin = React.lazy(() =>
  import('./pages/RoleLogin').then((m) => ({ default: m.RoleLogin })),
);
const DigitalTwin = React.lazy(() =>
  import('./pages/DigitalTwin').then((m) => ({ default: m.DigitalTwin })),
);
const FanCompanion = React.lazy(() =>
  import('./pages/FanCompanion').then((m) => ({ default: m.FanCompanion })),
);
const OrganizerDashboard = React.lazy(() =>
  import('./pages/OrganizerDashboard').then((m) => ({ default: m.OrganizerDashboard })),
);
const VolunteerCopilot = React.lazy(() =>
  import('./pages/VolunteerCopilot').then((m) => ({ default: m.VolunteerCopilot })),
);
const SecurityDashboard = React.lazy(() =>
  import('./pages/SecurityDashboard').then((m) => ({ default: m.SecurityDashboard })),
);
const AccessibilityAssistant = React.lazy(() =>
  import('./pages/AccessibilityAssistant').then((m) => ({ default: m.AccessibilityAssistant })),
);
const ExecutiveDashboard = React.lazy(() =>
  import('./pages/ExecutiveDashboard').then((m) => ({ default: m.ExecutiveDashboard })),
);
const SustainabilityIntelligence = React.lazy(() =>
  import('./pages/SustainabilityIntelligence').then((m) => ({
    default: m.SustainabilityIntelligence,
  })),
);
const TrustCenter = React.lazy(() =>
  import('./pages/TrustCenter').then((m) => ({ default: m.TrustCenter })),
);
const IncidentDetail = React.lazy(() =>
  import('./pages/IncidentDetail').then((m) => ({ default: m.IncidentDetail })),
);
const JudgeMode = React.lazy(() =>
  import('./pages/JudgeMode').then((m) => ({ default: m.JudgeMode })),
);
const TransportationIntelligence = React.lazy(() =>
  import('./pages/TransportationIntelligence').then((m) => ({
    default: m.TransportationIntelligence,
  })),
);

// Instantiate Core Services
const useSimulation = import.meta.env.VITE_USE_SIMULATION !== 'false';

const localNotifications: NotificationService = {
  showLocalNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else {
      console.info(`[Local Notification] ${title}: ${body}`);
    }
  },
  async requestPermissions() {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
    return false;
  },
};

const authService = new LocalStorageAuthService();
const storageService = new LocalStorageQueueService();

let dbService: DatabaseService;
let aiService: AIService;

if (useSimulation) {
  const scenarioAdapter = new ScenarioAdapter();
  dbService = scenarioAdapter;
  aiService = scenarioAdapter;
} else {
  dbService = new FirebaseDbService();
  aiService = new GeminiAIService();
}

const services = {
  database: dbService,
  ai: aiService,
  auth: authService,
  notifications: localNotifications,
  storage: storageService,
};

function App() {
  return (
    <ErrorBoundary>
      <ServiceProvider services={services}>
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-sky-400 font-mono">
                Loading StadiumOS AI Portal...
              </div>
            }
          >
            <MainLayout>
              <Routes>
                <Route path="/login" element={<RoleLogin />} />
                <Route path="/" element={<JudgeMode />} />
                <Route path="/judge" element={<JudgeMode />} />
                <Route path="/twin" element={<DigitalTwin />} />
                <Route
                  path="/fan"
                  element={
                    <ProtectedRoute allowedRoles={['fan']}>
                      <FanCompanion />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/organizer"
                  element={
                    <ProtectedRoute allowedRoles={['organizer']}>
                      <OrganizerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/volunteer"
                  element={
                    <ProtectedRoute allowedRoles={['volunteer']}>
                      <VolunteerCopilot />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/security"
                  element={
                    <ProtectedRoute allowedRoles={['security']}>
                      <SecurityDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/accessibility"
                  element={
                    <ProtectedRoute allowedRoles={['accessibility']}>
                      <AccessibilityAssistant />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/executive"
                  element={
                    <ProtectedRoute allowedRoles={['executive']}>
                      <ExecutiveDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/sustainability" element={<SustainabilityIntelligence />} />
                <Route path="/transportation" element={<TransportationIntelligence />} />
                <Route path="/trust" element={<TrustCenter />} />
                <Route path="/incidents/:id" element={<IncidentDetail />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </Suspense>
        </BrowserRouter>
      </ServiceProvider>
    </ErrorBoundary>
  );
}

export default App;
