import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  Firestore,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import type { DatabaseService } from './interfaces';
import { ZoneSchema, type Zone } from '../models/zone';
import { OperationalEventSchema, type OperationalEvent } from '../models/event';
import { VolunteerTaskSchema, type VolunteerTask } from '../models/task';
import { IncidentSchema, type Incident } from '../models/incident';
import { SustainabilityMetricsSchema, type SustainabilityMetrics } from '../models/sustainability';
import type { AuditLog } from '../models/audit';

export class FirebaseDbService implements DatabaseService {
  private db: Firestore | null = null;
  private readLatency: number = 0;

  constructor() {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

    if (apiKey && projectId) {
      try {
        const firebaseConfig = {
          apiKey,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
          projectId,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        this.db = getFirestore(app);
      } catch (err) {
        console.error('Firebase initialization failed:', err);
      }
    }
  }

  private checkDb(): Firestore {
    if (!this.db) {
      throw new Error('Firebase Database not configured. Check environment variables.');
    }
    return this.db;
  }

  // Listening Operations
  listenToZones(onUpdate: (zones: Zone[]) => void, onError: (err: Error) => void): () => void {
    try {
      const dbRef = this.checkDb();
      const zonesCol = collection(dbRef, 'zones');
      
      const startTime = performance.now();
      return onSnapshot(zonesCol, (snapshot) => {
        this.readLatency = performance.now() - startTime;
        const list: Zone[] = [];
        snapshot.forEach((docSnap) => {
          const parsed = ZoneSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
          if (parsed.success) {
            list.push(parsed.data);
          }
        });
        onUpdate(list);
      }, onError);
    } catch (err) {
      onError(err as Error);
      return () => {};
    }
  }

  listenToEvents(onUpdate: (events: OperationalEvent[]) => void, onError: (err: Error) => void): () => void {
    try {
      const dbRef = this.checkDb();
      const q = query(collection(dbRef, 'events'), orderBy('createdAt', 'desc'));
      
      const startTime = performance.now();
      return onSnapshot(q, (snapshot) => {
        this.readLatency = performance.now() - startTime;
        const list: OperationalEvent[] = [];
        snapshot.forEach((docSnap) => {
          const parsed = OperationalEventSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
          if (parsed.success) {
            list.push(parsed.data);
          }
        });
        onUpdate(list);
      }, onError);
    } catch (err) {
      onError(err as Error);
      return () => {};
    }
  }

  listenToTasks(volunteerId: string, onUpdate: (tasks: VolunteerTask[]) => void, onError: (err: Error) => void): () => void {
    try {
      const dbRef = this.checkDb();
      const q = query(
        collection(dbRef, 'tasks'), 
        where('assignedTo', '==', volunteerId),
        orderBy('timestamp', 'desc')
      );
      
      const startTime = performance.now();
      return onSnapshot(q, (snapshot) => {
        this.readLatency = performance.now() - startTime;
        const list: VolunteerTask[] = [];
        snapshot.forEach((docSnap) => {
          const parsed = VolunteerTaskSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
          if (parsed.success) {
            list.push(parsed.data);
          }
        });
        onUpdate(list);
      }, onError);
    } catch (err) {
      onError(err as Error);
      return () => {};
    }
  }

  listenToIncidents(onUpdate: (incidents: Incident[]) => void, onError: (err: Error) => void): () => void {
    try {
      const dbRef = this.checkDb();
      const q = query(collection(dbRef, 'incidents'), orderBy('timestamp', 'desc'));
      
      const startTime = performance.now();
      return onSnapshot(q, (snapshot) => {
        this.readLatency = performance.now() - startTime;
        const list: Incident[] = [];
        snapshot.forEach((docSnap) => {
          const parsed = IncidentSchema.safeParse({ id: docSnap.id, ...docSnap.data() });
          if (parsed.success) {
            list.push(parsed.data);
          }
        });
        onUpdate(list);
      }, onError);
    } catch (err) {
      onError(err as Error);
      return () => {};
    }
  }

  listenToSustainability(matchId: string, onUpdate: (metrics: SustainabilityMetrics) => void, onError: (err: Error) => void): () => void {
    try {
      const dbRef = this.checkDb();
      const docRef = doc(dbRef, 'sustainability', matchId);
      
      const startTime = performance.now();
      return onSnapshot(docRef, (docSnap) => {
        this.readLatency = performance.now() - startTime;
        if (docSnap.exists()) {
          const parsed = SustainabilityMetricsSchema.safeParse({ matchId: docSnap.id, ...docSnap.data() });
          if (parsed.success) {
            onUpdate(parsed.data);
          }
        }
      }, onError);
    } catch (err) {
      onError(err as Error);
      return () => {};
    }
  }

  listenToAuditLogs(onUpdate: (logs: AuditLog[]) => void, onError: (err: Error) => void): () => void {
    try {
      const dbRef = this.checkDb();
      const q = query(collection(dbRef, 'auditLog'), orderBy('timestamp', 'desc'));
      
      const startTime = performance.now();
      return onSnapshot(q, (snapshot) => {
        this.readLatency = performance.now() - startTime;
        const list: AuditLog[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
        });
        onUpdate(list);
      }, onError);
    } catch (err) {
      onError(err as Error);
      return () => {};
    }
  }

  // Writing Operations
  async updateTaskStatus(taskId: string, status: VolunteerTask['status']): Promise<void> {
    const dbRef = this.checkDb();
    const docRef = doc(dbRef, 'tasks', taskId);
    await updateDoc(docRef, { status });
  }

  async reportIncident(incident: Omit<Incident, 'id' | 'timestamp'>): Promise<string> {
    const dbRef = this.checkDb();
    const incidentsCol = collection(dbRef, 'incidents');
    const docRef = await addDoc(incidentsCol, {
      ...incident,
      timestamp: new Date().toISOString(),
    });
    return docRef.id;
  }

  async submitAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const dbRef = this.checkDb();
    const auditCol = collection(dbRef, 'auditLog');
    await addDoc(auditCol, {
      ...log,
      timestamp: new Date().toISOString(),
    });
  }

  async blockRoute(zoneId: string, blocked: boolean): Promise<void> {
    const dbRef = this.checkDb();
    const docRef = doc(dbRef, 'zones', zoneId);
    await updateDoc(docRef, {
      overlayColor: blocked ? 'crowd-critical' : 'crowd-safe',
      lastUpdated: new Date().toISOString(),
    });
  }

  async updateSustainability(metrics: Partial<SustainabilityMetrics>): Promise<void> {
    const dbRef = this.checkDb();
    if (!metrics.matchId) return;
    const docRef = doc(dbRef, 'sustainability', metrics.matchId);
    await updateDoc(docRef, {
      ...metrics,
      updatedAt: new Date().toISOString(),
    });
  }

  async getReadLatency(): Promise<number> {
    return Math.round(this.readLatency);
  }
}
