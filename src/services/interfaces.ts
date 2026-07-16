import type { Zone } from '../models/zone';
import type { OperationalEvent } from '../models/event';
import type { VolunteerTask } from '../models/task';
import type { Incident } from '../models/incident';
import type { SustainabilityMetrics } from '../models/sustainability';
import type { AuditLog } from '../models/audit';
import type { User } from '../models/user';
import type { UserRole } from '../models/role';

export interface DatabaseService {
  listenToZones(onUpdate: (zones: Zone[]) => void, onError: (err: Error) => void): () => void;
  listenToEvents(onUpdate: (events: OperationalEvent[]) => void, onError: (err: Error) => void): () => void;
  listenToTasks(volunteerId: string, onUpdate: (tasks: VolunteerTask[]) => void, onError: (err: Error) => void): () => void;
  listenToIncidents(onUpdate: (incidents: Incident[]) => void, onError: (err: Error) => void): () => void;
  listenToSustainability(matchId: string, onUpdate: (metrics: SustainabilityMetrics) => void, onError: (err: Error) => void): () => void;
  listenToAuditLogs(onUpdate: (logs: AuditLog[]) => void, onError: (err: Error) => void): () => void;
  
  updateTaskStatus(taskId: string, status: VolunteerTask['status']): Promise<void>;
  reportIncident(incident: Omit<Incident, 'id' | 'timestamp'>): Promise<string>;
  submitAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>;
  blockRoute(zoneId: string, blocked: boolean): Promise<void>;
  updateSustainability(metrics: Partial<SustainabilityMetrics>): Promise<void>;
  
  // Developer diagnostics checks
  getReadLatency(): Promise<number>;
}

export interface AIService {
  ingestSignal(zoneId: string, type: string, payload: Record<string, any>): Promise<OperationalEvent>;
  summarizeIncident(incidentId: string): Promise<string>;
  getSustainabilityAdvice(metrics: SustainabilityMetrics): Promise<string>;
  askAssistant(question: string, language: string): Promise<string>;
  
  // Developer diagnostics checks
  getAILatency(): Promise<number>;
}

export interface AuthService {
  getCurrentUser(): User | null;
  loginAsRole(role: UserRole): Promise<User>;
  updateUserPreferences(prefs: Partial<User['accessibilityPrefs']>): Promise<void>;
  updateUserLanguage(lang: User['language']): Promise<void>;
  listenToCurrentUser(onUpdate: (user: User | null) => void): () => void;
}

export interface NotificationService {
  showLocalNotification(title: string, body: string): void;
  requestPermissions(): Promise<boolean>;
}

export interface StorageService {
  getQueuedTasks(): Promise<Omit<VolunteerTask, 'timestamp'>[]>;
  queueTaskUpdate(taskId: string, status: VolunteerTask['status']): Promise<void>;
  syncOfflineQueue(db: DatabaseService): Promise<void>;
  isOnline(): boolean;
  listenToConnectionStatus(onChange: (online: boolean) => void): () => void;
}
