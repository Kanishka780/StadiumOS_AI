import type { Zone } from '../models/zone';
import type { OperationalEvent, EventTimelineEntry } from '../models/event';
import type { VolunteerTask } from '../models/task';
import type { Incident } from '../models/incident';
import type { SustainabilityMetrics } from '../models/sustainability';
import type { AuditLog } from '../models/audit';
import { getDefaultZones } from './scenarioData';

/**
 * Domain Engine responsible for managing the in-memory state of the simulator
 * and notifying subscribers when data fields change.
 */
export class ScenarioEngine {
  private zones: Zone[] = [];
  private events: OperationalEvent[] = [];
  private tasks: VolunteerTask[] = [];
  private incidents: Incident[] = [];
  private auditLogs: AuditLog[] = [];
  private timeline: EventTimelineEntry[] = [];
  private sustainability: SustainabilityMetrics = this.getInitialSustainability();

  // Subscription registers
  private zoneListeners = new Set<(zones: Zone[]) => void>();
  private eventListeners = new Set<(events: OperationalEvent[]) => void>();
  private taskListeners = new Map<string, Set<(tasks: VolunteerTask[]) => void>>();
  private incidentListeners = new Set<(incidents: Incident[]) => void>();
  private sustainabilityListeners = new Set<(metrics: SustainabilityMetrics) => void>();
  private auditListeners = new Set<(logs: AuditLog[]) => void>();
  private timelineListeners = new Set<(timeline: EventTimelineEntry[]) => void>();

  constructor() {
    this.reset();
  }

  private getInitialSustainability(): SustainabilityMetrics {
    return {
      matchId: 'match_wc2026_01',
      transitModeShare: { transit: 60, driving: 30, walking: 10 },
      wasteDiversionRate: 75,
      energyPerAttendee: 1.2,
      waterUsage: 45000,
      updatedAt: new Date().toISOString(),
    };
  }

  reset() {
    const timestamp = new Date().toISOString();
    this.zones = getDefaultZones(timestamp);
    this.events = [];
    this.tasks = [];
    this.incidents = [];
    this.auditLogs = [];
    this.timeline = [];
    this.sustainability = this.getInitialSustainability();
    this.notifyAll();
  }

  // State Getters/Setters
  getZones(): Zone[] {
    return this.zones;
  }
  setZones(zones: Zone[]) {
    this.zones = zones;
    this.notifyZones();
  }

  getEvents(): OperationalEvent[] {
    return this.events;
  }
  setEvents(events: OperationalEvent[]) {
    this.events = events;
    this.notifyEvents();
  }

  addEvent(event: OperationalEvent) {
    this.events.unshift(event);
    this.notifyEvents();
  }

  getTasks(): VolunteerTask[] {
    return this.tasks;
  }
  setTasks(tasks: VolunteerTask[]) {
    this.tasks = tasks;
    this.notifyTasksAll();
  }

  getIncidents(): Incident[] {
    return this.incidents;
  }
  setIncidents(incidents: Incident[]) {
    this.incidents = incidents;
    this.notifyIncidents();
  }

  getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }
  setAuditLogs(logs: AuditLog[]) {
    this.auditLogs = logs;
    this.notifyAuditLogs();
  }

  getTimeline(): EventTimelineEntry[] {
    return this.timeline;
  }
  setTimeline(timeline: EventTimelineEntry[]) {
    this.timeline = timeline;
    this.notifyTimeline();
  }

  addTimelineEntry(entry: EventTimelineEntry) {
    this.timeline.unshift(entry);
    this.notifyTimeline();
  }

  getSustainability(): SustainabilityMetrics {
    return this.sustainability;
  }
  setSustainability(metrics: SustainabilityMetrics) {
    this.sustainability = metrics;
    this.notifySustainability();
  }

  // Subscriptions
  listenToZones(onUpdate: (zones: Zone[]) => void): () => void {
    this.zoneListeners.add(onUpdate);
    onUpdate([...this.zones]);
    return () => {
      this.zoneListeners.delete(onUpdate);
    };
  }

  listenToEvents(onUpdate: (events: OperationalEvent[]) => void): () => void {
    this.eventListeners.add(onUpdate);
    onUpdate([...this.events]);
    return () => {
      this.eventListeners.delete(onUpdate);
    };
  }

  listenToTasks(volunteerId: string, onUpdate: (tasks: VolunteerTask[]) => void): () => void {
    if (!this.taskListeners.has(volunteerId)) {
      this.taskListeners.set(volunteerId, new Set());
    }
    this.taskListeners.get(volunteerId)!.add(onUpdate);
    onUpdate(this.tasks.filter((t) => t.assignedTo === volunteerId));
    return () => {
      this.taskListeners.get(volunteerId)!.delete(onUpdate);
    };
  }

  listenToIncidents(onUpdate: (incidents: Incident[]) => void): () => void {
    this.incidentListeners.add(onUpdate);
    onUpdate([...this.incidents]);
    return () => {
      this.incidentListeners.delete(onUpdate);
    };
  }

  listenToSustainability(onUpdate: (metrics: SustainabilityMetrics) => void): () => void {
    this.sustainabilityListeners.add(onUpdate);
    onUpdate({ ...this.sustainability });
    return () => {
      this.sustainabilityListeners.delete(onUpdate);
    };
  }

  listenToAuditLogs(onUpdate: (logs: AuditLog[]) => void): () => void {
    this.auditListeners.add(onUpdate);
    onUpdate([...this.auditLogs]);
    return () => {
      this.auditListeners.delete(onUpdate);
    };
  }

  listenToTimeline(onUpdate: (timeline: EventTimelineEntry[]) => void): () => void {
    this.timelineListeners.add(onUpdate);
    onUpdate([...this.timeline]);
    return () => {
      this.timelineListeners.delete(onUpdate);
    };
  }

  // Notifiers
  private notifyZones() {
    this.zoneListeners.forEach((l) => l([...this.zones]));
  }
  private notifyEvents() {
    this.eventListeners.forEach((l) => l([...this.events]));
  }
  private notifyIncidents() {
    this.incidentListeners.forEach((l) => l([...this.incidents]));
  }
  private notifySustainability() {
    this.sustainabilityListeners.forEach((l) => l({ ...this.sustainability }));
  }
  private notifyAuditLogs() {
    this.auditListeners.forEach((l) => l([...this.auditLogs]));
  }
  private notifyTimeline() {
    this.timelineListeners.forEach((l) => l([...this.timeline]));
  }

  private notifyTasksAll() {
    this.taskListeners.forEach((listeners, volunteerId) => {
      const volTasks = this.tasks.filter((t) => t.assignedTo === volunteerId);
      listeners.forEach((l) => l(volTasks));
    });
  }

  notifyTasks(volunteerId: string) {
    const list = this.taskListeners.get(volunteerId);
    if (list) {
      const volTasks = this.tasks.filter((t) => t.assignedTo === volunteerId);
      list.forEach((l) => l(volTasks));
    }
  }

  private notifyAll() {
    this.notifyZones();
    this.notifyEvents();
    this.notifyIncidents();
    this.notifySustainability();
    this.notifyAuditLogs();
    this.notifyTimeline();
    this.notifyTasksAll();
  }
}
