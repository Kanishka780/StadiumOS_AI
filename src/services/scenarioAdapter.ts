import type { DatabaseService, AIService } from './interfaces';
import type { Zone } from '../models/zone';
import type { OperationalEvent, IngestSignalPayload, EventTimelineEntry } from '../models/event';
import type { VolunteerTask } from '../models/task';
import type { Incident } from '../models/incident';
import type { SustainabilityMetrics } from '../models/sustainability';
import type { AuditLog } from '../models/audit';

import { ScenarioRepository } from './scenarioRepository';
import { ScenarioEngine } from './scenarioEngine';
import { RecommendationEngine } from './recommendationEngine';
import { ScenarioExecutor } from './scenarioExecutor';
import { EventDispatcher } from './eventDispatcher';

/**
 * Simulator/Mock Database and AI Adapter rewritten as a Clean Architecture façade
 * that composes decoupled domain-specific modules.
 */
export class ScenarioAdapter implements DatabaseService, AIService {
  private repository = new ScenarioRepository();
  private engine = new ScenarioEngine();
  private recommendation = new RecommendationEngine();
  private dispatcher = new EventDispatcher();
  private executor = new ScenarioExecutor(this.repository, this.engine, this.dispatcher);

  private readLatency = 15;

  // Database Service Implementations
  listenToZones(onUpdate: (zones: Zone[]) => void): () => void {
    return this.engine.listenToZones(onUpdate);
  }

  listenToEvents(onUpdate: (events: OperationalEvent[]) => void): () => void {
    return this.engine.listenToEvents(onUpdate);
  }

  listenToTasks(volunteerId: string, onUpdate: (tasks: VolunteerTask[]) => void): () => void {
    return this.engine.listenToTasks(volunteerId, onUpdate);
  }

  listenToIncidents(onUpdate: (incidents: Incident[]) => void): () => void {
    return this.engine.listenToIncidents(onUpdate);
  }

  listenToSustainability(
    _matchId: string,
    onUpdate: (metrics: SustainabilityMetrics) => void,
  ): () => void {
    return this.engine.listenToSustainability(onUpdate);
  }

  listenToAuditLogs(onUpdate: (logs: AuditLog[]) => void): () => void {
    return this.engine.listenToAuditLogs(onUpdate);
  }

  listenToTimeline(onUpdate: (timeline: EventTimelineEntry[]) => void): () => void {
    return this.engine.listenToTimeline(onUpdate);
  }

  async updateTaskStatus(taskId: string, status: VolunteerTask['status']): Promise<void> {
    const tasks = this.engine.getTasks();
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      this.engine.setTasks([...tasks]);
    }
  }

  async reportIncident(incident: Omit<Incident, 'id' | 'timestamp'>): Promise<string> {
    const id = `inc_${Math.floor(Math.random() * 100000)}`;
    const newIncident: Incident = {
      ...incident,
      id,
      timestamp: new Date().toISOString(),
    };
    const current = this.engine.getIncidents();
    this.engine.setIncidents([...current, newIncident]);
    return id;
  }

  async submitAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const id = `audit_${Math.floor(Math.random() * 100000)}`;
    const newLog: AuditLog = {
      ...log,
      id,
      timestamp: new Date().toISOString(),
    };
    const current = this.engine.getAuditLogs();
    this.engine.setAuditLogs([...current, newLog]);
  }

  async blockRoute(zoneId: string, blocked: boolean): Promise<void> {
    const zones = this.engine.getZones();
    const zone = zones.find((z) => z.id === zoneId);
    if (zone) {
      zone.overlayColor = blocked ? 'crowd-critical' : 'crowd-safe';
      zone.lastUpdated = new Date().toISOString();
      this.engine.setZones([...zones]);
    }
  }

  async updateSustainability(metrics: Partial<SustainabilityMetrics>): Promise<void> {
    const current = this.engine.getSustainability();
    this.engine.setSustainability({
      ...current,
      ...metrics,
      updatedAt: new Date().toISOString(),
    });
  }

  async getReadLatency(): Promise<number> {
    return this.readLatency;
  }

  // AI Service Implementations
  async ingestSignal(
    zoneId: string,
    type: string,
    payload: IngestSignalPayload,
  ): Promise<OperationalEvent> {
    const event = await this.recommendation.ingestSignal(zoneId, type, payload);
    this.engine.addEvent(event);
    this.dispatcher.propagateEvent(event, this.engine);
    return event;
  }

  async summarizeIncident(incidentId: string): Promise<string> {
    return this.recommendation.summarizeIncident(incidentId, this.engine.getIncidents());
  }

  async getSustainabilityAdvice(metrics: SustainabilityMetrics): Promise<string> {
    return this.recommendation.getSustainabilityAdvice(metrics);
  }

  async askAssistant(question: string, language: string): Promise<string> {
    return this.recommendation.askAssistant(question, language);
  }

  async getAILatency(): Promise<number> {
    return this.recommendation.getAILatency();
  }

  // Deterministic Scenarios Trigger API (Development Mode specific)
  public triggerScenario(name: string) {
    this.executor.triggerScenario(name);
  }
}
