import type { DatabaseService, AIService } from './interfaces';
import type { Zone } from '../models/zone';
import type { OperationalEvent } from '../models/event';
import type { VolunteerTask } from '../models/task';
import type { Incident } from '../models/incident';
import type { SustainabilityMetrics } from '../models/sustainability';
import type { AuditLog } from '../models/audit';

export class ScenarioAdapter implements DatabaseService, AIService {
  private zones: Zone[] = [];
  private events: OperationalEvent[] = [];
  private tasks: VolunteerTask[] = [];
  private incidents: Incident[] = [];
  private auditLogs: AuditLog[] = [];
  private sustainability: SustainabilityMetrics = {
    matchId: 'match_wc2026_01',
    transitModeShare: { transit: 60, driving: 30, walking: 10 },
    wasteDiversionRate: 75,
    energyPerAttendee: 1.2,
    waterUsage: 45000,
    updatedAt: new Date().toISOString(),
  };

  // Subscription listeners
  private zoneListeners: Set<(zones: Zone[]) => void> = new Set();
  private eventListeners: Set<(events: OperationalEvent[]) => void> = new Set();
  private taskListeners: Map<string, Set<(tasks: VolunteerTask[]) => void>> = new Map();
  private incidentListeners: Set<(incidents: Incident[]) => void> = new Set();
  private sustainabilityListeners: Set<(metrics: SustainabilityMetrics) => void> = new Set();
  private auditListeners: Set<(logs: AuditLog[]) => void> = new Set();

  private readLatency = 15;
  private aiLatency = 240;

  constructor() {
    this.resetState();
  }

  private resetState() {
    const timestamp = new Date().toISOString();
    this.zones = [
      { id: 'zone_gate_a', name: 'Entry Gate A', currentDensity: 30, flowRate: 12, overlayColor: 'crowd-safe', lastUpdated: timestamp },
      { id: 'zone_gate_b', name: 'Entry Gate B', currentDensity: 35, flowRate: 15, overlayColor: 'crowd-safe', lastUpdated: timestamp },
      { id: 'zone_gate_c', name: 'Entry Gate C', currentDensity: 20, flowRate: 8, overlayColor: 'crowd-safe', lastUpdated: timestamp },
      { id: 'zone_gate_d', name: 'Entry Gate D', currentDensity: 15, flowRate: 5, overlayColor: 'crowd-safe', lastUpdated: timestamp },
      { id: 'zone_seating', name: 'Seating Bowl', currentDensity: 45, flowRate: 0, overlayColor: 'crowd-safe', lastUpdated: timestamp },
      { id: 'zone_concourse', name: 'Food Court Concourse', currentDensity: 50, flowRate: 30, overlayColor: 'crowd-safe', lastUpdated: timestamp },
      { id: 'zone_parking', name: 'Parking Lot 1', currentDensity: 40, flowRate: 25, overlayColor: 'crowd-safe', lastUpdated: timestamp },
      { id: 'zone_metro', name: 'Transit Metro Station', currentDensity: 25, flowRate: 20, overlayColor: 'crowd-safe', lastUpdated: timestamp },
    ];
    this.events = [];
    this.tasks = [];
    this.incidents = [];
    this.auditLogs = [];
    this.sustainability = {
      matchId: 'match_wc2026_01',
      transitModeShare: { transit: 60, driving: 30, walking: 10 },
      wasteDiversionRate: 75,
      energyPerAttendee: 1.2,
      waterUsage: 45000,
      updatedAt: new Date().toISOString(),
    };
  }

  private notifyZones() { this.zoneListeners.forEach(l => l([...this.zones])); }
  private notifyEvents() { this.eventListeners.forEach(l => l([...this.events])); }
  private notifyIncidents() { this.incidentListeners.forEach(l => l([...this.incidents])); }
  private notifySustainability() { this.sustainabilityListeners.forEach(l => l({ ...this.sustainability })); }
  private notifyAuditLogs() { this.auditListeners.forEach(l => l([...this.auditLogs])); }
  private notifyTasks(volId: string) {
    const list = this.taskListeners.get(volId);
    if (list) {
      const volTasks = this.tasks.filter(t => t.assignedTo === volId);
      list.forEach(l => l(volTasks));
    }
  }

  // Database Service Implementations
  listenToZones(onUpdate: (zones: Zone[]) => void): () => void {
    this.zoneListeners.add(onUpdate);
    onUpdate([...this.zones]);
    return () => { this.zoneListeners.delete(onUpdate); };
  }

  listenToEvents(onUpdate: (events: OperationalEvent[]) => void): () => void {
    this.eventListeners.add(onUpdate);
    onUpdate([...this.events]);
    return () => { this.eventListeners.delete(onUpdate); };
  }

  listenToTasks(volunteerId: string, onUpdate: (tasks: VolunteerTask[]) => void): () => void {
    if (!this.taskListeners.has(volunteerId)) {
      this.taskListeners.set(volunteerId, new Set());
    }
    this.taskListeners.get(volunteerId)!.add(onUpdate);
    onUpdate(this.tasks.filter(t => t.assignedTo === volunteerId));
    return () => {
      this.taskListeners.get(volunteerId)!.delete(onUpdate);
    };
  }

  listenToIncidents(onUpdate: (incidents: Incident[]) => void): () => void {
    this.incidentListeners.add(onUpdate);
    onUpdate([...this.incidents]);
    return () => { this.incidentListeners.delete(onUpdate); };
  }

  listenToSustainability(_matchId: string, onUpdate: (metrics: SustainabilityMetrics) => void): () => void {
    this.sustainabilityListeners.add(onUpdate);
    onUpdate({ ...this.sustainability });
    return () => { this.sustainabilityListeners.delete(onUpdate); };
  }

  listenToAuditLogs(onUpdate: (logs: AuditLog[]) => void): () => void {
    this.auditLogs.push();
    this.auditListeners.add(onUpdate);
    onUpdate([...this.auditLogs]);
    return () => { this.auditListeners.delete(onUpdate); };
  }

  async updateTaskStatus(taskId: string, status: VolunteerTask['status']): Promise<void> {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      this.notifyTasks(task.assignedTo);
    }
  }

  async reportIncident(incident: Omit<Incident, 'id' | 'timestamp'>): Promise<string> {
    const id = `inc_${Math.floor(Math.random() * 100000)}`;
    const newIncident: Incident = {
      ...incident,
      id,
      timestamp: new Date().toISOString(),
    };
    this.incidents.push(newIncident);
    this.notifyIncidents();
    return id;
  }

  async submitAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const id = `audit_${Math.floor(Math.random() * 100000)}`;
    const newLog: AuditLog = {
      ...log,
      id,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.push(newLog);
    this.notifyAuditLogs();
  }

  async blockRoute(zoneId: string, blocked: boolean): Promise<void> {
    const zone = this.zones.find(z => z.id === zoneId);
    if (zone) {
      zone.overlayColor = blocked ? 'crowd-critical' : 'crowd-safe';
      zone.lastUpdated = new Date().toISOString();
      this.notifyZones();
    }
  }

  async updateSustainability(metrics: Partial<SustainabilityMetrics>): Promise<void> {
    this.sustainability = {
      ...this.sustainability,
      ...metrics,
      updatedAt: new Date().toISOString(),
    };
    this.notifySustainability();
  }

  async getReadLatency(): Promise<number> {
    return this.readLatency;
  }

  // AI Service Implementations
  async ingestSignal(zoneId: string, type: string, _payload: Record<string, any>): Promise<OperationalEvent> {
    const eventId = `event_${Math.floor(Math.random() * 100000)}`;
    const newEvent: OperationalEvent = {
      id: eventId,
      zoneId,
      type: 'congestion',
      severity: 'medium',
      confidence: 0.85,
      rationale: `Manual ingest of type ${type} in zone ${zoneId}.`,
      recommendedActions: {
        organizer: 'Monitor zone crowd updates and adjust signage.',
        volunteer: 'Direct fans to nearby queues.',
        fan: 'Please move carefully through this zone.',
        security: 'Keep visual check on crowd density levels.'
      },
      createdAt: new Date().toISOString(),
    };
    this.events.push(newEvent);
    this.notifyEvents();
    return newEvent;
  }

  async summarizeIncident(incidentId: string): Promise<string> {
    const incident = this.incidents.find(i => i.id === incidentId);
    if (!incident) return 'Incident not found.';
    return `AI Summary: ${incident.summary} (Priority: ${incident.priority}). Status is currently ${incident.status}.`;
  }

  async getSustainabilityAdvice(metrics: SustainabilityMetrics): Promise<string> {
    if (metrics.wasteDiversionRate < 80) {
      return 'Waste diversion is currently 75%. Suggesting additional waste sorting volunteers at Concourse bins.';
    }
    return 'Sustainability operations are running optimally within standard tournament baselines.';
  }

  async askAssistant(question: string, language: string): Promise<string> {
    const lower = question.toLowerCase();
    const isEs = language === 'es';
    const isFr = language === 'fr';

    if (lower.includes('food') || lower.includes('comida') || lower.includes('nourriture')) {
      return isEs ? 'Los puestos de comida del norte no tienen tiempo de espera. Los del sur tienen 20 minutos.' : 
             isFr ? 'Les stands de nourriture Nord ont zéro temps d\'attente. Les stands Sud sont à 20 minutes.' :
             'North food stands currently have zero wait times. South food stands are at 20 minutes.';
    }
    if (lower.includes('exit') || lower.includes('salida') || lower.includes('sortie') || lower.includes('metro')) {
      return isEs ? 'Siga la ruta de salida C (marcada en verde) hacia la estación de metro para evitar multitudes.' :
             isFr ? 'Veuillez suivre la route de sortie C (marquée en vert) vers la station de métro pour éviter les foules.' :
             'Please follow Exit Route C (marked green) to the metro station to avoid crowds.';
    }
    return isEs ? 'Puedo ayudarle con tiempos de cola, rutas accesibles y caminos de salida. Indíqueme qué necesita.' :
           isFr ? 'Je peux vous aider avec les temps d\'attente, les itinéraires accessibles et les sorties. Dites-moi ce dont vous avez besoin.' :
           'I can assist you with queue times, accessible routes, and exit paths. Please let me know what you need.';
  }

  async getAILatency(): Promise<number> {
    return this.aiLatency;
  }

  // Deterministic Scenarios Trigger API (Development Mode specific)
  public triggerScenario(name: string) {
    const timestamp = new Date().toISOString();
    this.resetState(); // clean slate for scenario

    switch (name) {
      case 'Gate B Congestion': {
        const zone = this.zones.find(z => z.id === 'zone_gate_b');
        if (zone) {
          zone.currentDensity = 92;
          zone.flowRate = 48;
          zone.overlayColor = 'crowd-critical';
          zone.lastUpdated = timestamp;
        }
        this.events = [{
          id: 'evt_gate_b_congestion',
          zoneId: 'zone_gate_b',
          type: 'congestion',
          severity: 'high',
          confidence: 0.88,
          rationale: 'Turnstile B sensor triggers show entry rate exceeding baseline by 24% consecutively.',
          recommendedActions: {
            organizer: 'Reassign 4 volunteers to Gate B entry zone to manage queue sorting.',
            volunteer: 'Report to Gate B crowd control sector to assist international fans.',
            fan: 'Queue time at Gate B is 25m. Please use alternative Gate C (under 5m queue).',
            security: 'Activate alternate access queue barriers at Gate B entry flow lane.'
          },
          createdAt: timestamp,
        }];
        this.tasks = [{
          id: 'tsk_gate_b_reassign',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_gate_b',
          instructions: 'Proceed to Entry Gate B and assist organizer team with entry sorting.',
          status: 'pending',
          timestamp,
        }];
        break;
      }
      case 'Medical Emergency': {
        this.incidents = [{
          id: 'inc_med_01',
          summary: 'Heat exhaustion incident reported in seating bowl Sector 12.',
          priority: 'high',
          departmentsAffected: ['medical', 'stadium_ops'],
          status: 'reported',
          timestamp,
          zoneId: 'zone_seating',
        }];
        this.events = [{
          id: 'evt_med_emergency',
          zoneId: 'zone_seating',
          type: 'security_anomaly',
          severity: 'high',
          confidence: 0.95,
          rationale: 'First-aid radio beacon activated in seating bowl sector 12.',
          recommendedActions: {
            organizer: 'Dispatch seating section volunteer with hydration packs to sector 12.',
            volunteer: 'Keep lane 12 clear for first responders.',
            fan: 'Please cooperate with staff requesting right-of-way in seating aisle 12.',
            security: 'Provide clearance route for medical response buggy to Seating Tunnel 12.'
          },
          createdAt: timestamp,
        }];
        this.tasks = [{
          id: 'tsk_med_reassign',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_seating',
          instructions: 'Proceed to Sector 12 seating tunnel and guide medical team.',
          status: 'pending',
          timestamp,
        }];
        break;
      }
      case 'Accessibility SOS': {
        const zone = this.zones.find(z => z.id === 'zone_concourse');
        if (zone) {
          zone.overlayColor = 'crowd-warning';
        }
        this.events = [{
          id: 'evt_acc_elevator_fail',
          zoneId: 'zone_concourse',
          type: 'accessibility_sos',
          severity: 'high',
          confidence: 0.98,
          rationale: 'Elevator EL-04 concourse landing fails safety gate checks, auto-locking.',
          recommendedActions: {
            organizer: 'Deploy accessibility desk companion to guide wheelchair users to alternate ramp.',
            volunteer: 'Assist mobility users near Elevator EL-04 and direct them to Concourse West Ramp.',
            fan: 'Wheelchair access at Elevator EL-04 is closed. Use alternative ramp at Concourse West.',
            security: 'Secure Elevator EL-04 perimeter for repair technician.'
          },
          createdAt: timestamp,
        }];
        this.tasks = [{
          id: 'tsk_acc_sos',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_concourse',
          instructions: 'Station near EL-04 elevator. Reroute wheelchair users to Concourse West Ramp.',
          status: 'pending',
          timestamp,
        }];
        break;
      }
      case 'Volunteer Reassignment': {
        this.tasks = [
          {
            id: 'tsk_vol_re_01',
            assignedTo: 'uid_volunteer_user',
            zoneId: 'zone_gate_a',
            instructions: 'Report to Gate A transit drop-off to assist arrival queues.',
            status: 'pending',
            timestamp,
          }
        ];
        this.events = [{
          id: 'evt_vol_reassign',
          zoneId: 'zone_gate_a',
          type: 'congestion',
          severity: 'medium',
          confidence: 0.82,
          rationale: 'Shuttle buses arriving early. Shift volunteer deployment to Gate A drop-off.',
          recommendedActions: {
            organizer: 'Approve shift of 3 volunteers to Gate A.',
            volunteer: 'Relocate to Gate A transit drop-off immediately.',
            fan: 'Gate A arrival flow is heavy. Check visual path flags.',
            security: 'Adjust shuttle access lanes at Gate A.'
          },
          createdAt: timestamp,
        }];
        break;
      }
      case 'Food Court Overflow': {
        const zone = this.zones.find(z => z.id === 'zone_concourse');
        if (zone) {
          zone.currentDensity = 88;
          zone.overlayColor = 'crowd-warning';
        }
        this.events = [{
          id: 'evt_food_court',
          zoneId: 'zone_concourse',
          type: 'congestion',
          severity: 'medium',
          confidence: 0.84,
          rationale: 'Halftime traffic peak in Food Court Concourse exceeds comfort index.',
          recommendedActions: {
            organizer: 'Activate secondary concourse exits to distribute fan foot traffic.',
            volunteer: 'Direct fans to the North Concourse concessions (currently 10% density).',
            fan: 'Central concourse food lines are 20m. North food stands are open with 0 wait time.',
            security: 'Open auxiliary seating tunnel exits to ease egress pressure.'
          },
          createdAt: timestamp,
        }];
        break;
      }
      case 'Sustainability Alert': {
        this.sustainability.wasteDiversionRate = 62;
        this.sustainability.energyPerAttendee = 1.95;
        this.sustainability.updatedAt = timestamp;

        this.events = [{
          id: 'evt_sust_power_spike',
          zoneId: 'zone_concourse',
          type: 'sustainability_alert',
          severity: 'medium',
          confidence: 0.90,
          rationale: 'Waste diversion drops below 65% target. Energy spike detected at concourse lighting.',
          recommendedActions: {
            organizer: 'Dim unused concourse back-lights. Deploy recycling bin monitors.',
            volunteer: 'Monitor concourse recycle bins to guide sorting.',
            fan: 'Help us match our zero-waste goal by placing plastic cups in the green recycle bins.',
            security: 'Confirm auxiliary utility doors are closed to prevent heating loss.'
          },
          createdAt: timestamp,
        }];
        this.tasks = [{
          id: 'tsk_sust_sort',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_concourse',
          instructions: 'Monitor the green recycle bin hubs at Concourse Sector 4 and guide fans.',
          status: 'pending',
          timestamp,
        }];
        break;
      }
      case 'Parking Overflow': {
        const zone = this.zones.find(z => z.id === 'zone_parking');
        if (zone) {
          zone.currentDensity = 98;
          zone.overlayColor = 'crowd-critical';
        }
        this.events = [{
          id: 'evt_parking_full',
          zoneId: 'zone_parking',
          type: 'congestion',
          severity: 'high',
          confidence: 0.94,
          rationale: 'Parking lot sensor logs report 98% space occupancy.',
          recommendedActions: {
            organizer: 'Display PARKING FULL signs. Direct road transit to Metro Station lot.',
            volunteer: 'Redirect arriving vehicles at Parking entry Sector 1.',
            fan: 'Stadium parking is full. Use free Metro Station park-and-ride lot (Exit 14B).',
            security: 'Establish roadblock at main Parking gate and divert incoming cars.'
          },
          createdAt: timestamp,
        }];
        break;
      }
      case 'Severe Weather': {
        this.events = [{
          id: 'evt_weather_lightning',
          zoneId: 'zone_parking',
          type: 'weather_hazard',
          severity: 'high',
          confidence: 0.99,
          rationale: 'National Weather Service lightning strikes logged within 5 miles of venue.',
          recommendedActions: {
            organizer: 'Activate stadium severe weather PA announcement. Suspend open-air queues.',
            volunteer: 'Direct fans out of open parking and plazas into covered concourses.',
            fan: 'Severe weather warning. Seek shelter inside covered concourse zones immediately.',
            security: 'Divert pedestrian plazas entry flow to stadium tunnel gates.'
          },
          createdAt: timestamp,
        }];
        this.tasks = [{
          id: 'tsk_weather_shelter',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_parking',
          instructions: 'Instruct plaza visitors to enter the stadium concourse immediately due to lightning.',
          status: 'pending',
          timestamp,
        }];
        break;
      }
      case 'Emergency Evacuation': {
        this.zones.forEach(z => {
          z.overlayColor = 'crowd-critical';
          z.currentDensity = 99;
          z.lastUpdated = timestamp;
        });
        this.events = [{
          id: 'evt_evac_protocol',
          zoneId: 'zone_seating',
          type: 'evacuation',
          severity: 'critical',
          confidence: 1.0,
          rationale: 'Evacuation protocol initiated by Operations Commander.',
          recommendedActions: {
            organizer: 'Activate all visual and audio fire escape markers. Deploy emergency PA.',
            volunteer: 'Direct seating sections to nearest illuminated exit gates.',
            fan: 'EMERGENCY EVACUATION. Leave seating bowl immediately. Follow illuminated exit signs.',
            security: 'Open all emergency security gates. Clear egress paths for vehicles.'
          },
          createdAt: timestamp,
        }];
        this.tasks = [{
          id: 'tsk_evac_assist',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_seating',
          instructions: 'Open Exit Gate 4 immediately and guide seating aisle evacuees.',
          status: 'pending',
          timestamp,
        }];
        break;
      }
      default:
        this.resetState();
        break;
    }

    this.notifyZones();
    this.notifyEvents();
    this.notifyIncidents();
    this.notifySustainability();
    this.notifyAuditLogs();
    
    // notify tasks for standard simulated users
    this.notifyTasks('uid_volunteer_user');
  }
}
