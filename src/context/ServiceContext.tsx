import React, { createContext, useContext } from 'react';
import type { DatabaseService, AIService, AuthService, NotificationService, StorageService } from '../services/interfaces';

interface Services {
  database: DatabaseService;
  ai: AIService;
  auth: AuthService;
  notifications: NotificationService;
  storage: StorageService;
}

const ServiceContext = createContext<Services | null>(null);

export const ServiceProvider: React.FC<{ services: Services; children: React.ReactNode }> = ({ services, children }) => {
  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = (): Services => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};

export const useDatabase = (): DatabaseService => useServices().database;
export const useAI = (): AIService => useServices().ai;
export const useAuth = (): AuthService => useServices().auth;
export const useNotifications = (): NotificationService => useServices().notifications;
export const useStorage = (): StorageService => useServices().storage;
