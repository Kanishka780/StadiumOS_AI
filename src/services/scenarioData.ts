import type { Zone } from '../models/zone';
import type { OperationalEvent } from '../models/event';
import type { VolunteerTask } from '../models/task';
import type { Incident } from '../models/incident';
import type { SustainabilityMetrics } from '../models/sustainability';

/**
 * Returns the default initial list of stadium zones with baselines.
 * @param timestamp DateTime string to populate the updated field.
 */
export function getDefaultZones(timestamp: string): Zone[] {
  return [
    {
      id: 'zone_gate_a',
      name: 'Entry Gate A',
      currentDensity: 30,
      flowRate: 12,
      overlayColor: 'crowd-safe',
      lastUpdated: timestamp,
    },
    {
      id: 'zone_gate_b',
      name: 'Entry Gate B',
      currentDensity: 35,
      flowRate: 15,
      overlayColor: 'crowd-safe',
      lastUpdated: timestamp,
    },
    {
      id: 'zone_gate_c',
      name: 'Entry Gate C',
      currentDensity: 20,
      flowRate: 8,
      overlayColor: 'crowd-safe',
      lastUpdated: timestamp,
    },
    {
      id: 'zone_gate_d',
      name: 'Entry Gate D',
      currentDensity: 15,
      flowRate: 5,
      overlayColor: 'crowd-safe',
      lastUpdated: timestamp,
    },
    {
      id: 'zone_seating',
      name: 'Seating Bowl',
      currentDensity: 45,
      flowRate: 0,
      overlayColor: 'crowd-safe',
      lastUpdated: timestamp,
    },
    {
      id: 'zone_concourse',
      name: 'Food Court Concourse',
      currentDensity: 50,
      flowRate: 30,
      overlayColor: 'crowd-safe',
      lastUpdated: timestamp,
    },
    {
      id: 'zone_parking',
      name: 'Parking Lot 1',
      currentDensity: 40,
      flowRate: 25,
      overlayColor: 'crowd-safe',
      lastUpdated: timestamp,
    },
    {
      id: 'zone_metro',
      name: 'Transit Metro Station',
      currentDensity: 25,
      flowRate: 20,
      overlayColor: 'crowd-safe',
      lastUpdated: timestamp,
    },
  ];
}

interface ScenarioState {
  zones: Zone[];
  events: OperationalEvent[];
  tasks: VolunteerTask[];
  incidents: Incident[];
  sustainability: Partial<SustainabilityMetrics> | null;
}

/**
 * Generates the state updates corresponding to a triggered simulator scenario.
 */
export function getScenarioState(
  name: string,
  timestamp: string,
  currentZones: Zone[],
): ScenarioState {
  // Deep clone current zones
  const zones = JSON.parse(JSON.stringify(currentZones)) as Zone[];
  let events: OperationalEvent[] = [];
  let tasks: VolunteerTask[] = [];
  let incidents: Incident[] = [];
  let sustainability: Partial<SustainabilityMetrics> | null = null;

  switch (name) {
    case 'Gate B Congestion': {
      const zone = zones.find((z) => z.id === 'zone_gate_b');
      if (zone) {
        zone.currentDensity = 92;
        zone.flowRate = 48;
        zone.overlayColor = 'crowd-critical';
        zone.lastUpdated = timestamp;
      }
      events = [
        {
          id: 'evt_gate_b_congestion',
          zoneId: 'zone_gate_b',
          type: 'congestion',
          severity: 'high',
          confidence: 0.88,
          rationale:
            'Turnstile B sensor triggers show entry rate exceeding baseline by 24% consecutively.',
          recommendedActions: {
            organizer: 'Reassign 4 volunteers to Gate B entry zone to manage queue sorting.',
            volunteer: 'Report to Gate B crowd control sector to assist international fans.',
            fan: 'Queue time at Gate B is 25m. Please use alternative Gate C (under 5m queue).',
            security: 'Activate alternate access queue barriers at Gate B entry flow lane.',
          },
          createdAt: timestamp,
        },
      ];
      tasks = [
        {
          id: 'tsk_gate_b_reassign',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_gate_b',
          instructions: 'Proceed to Entry Gate B and assist organizer team with entry sorting.',
          status: 'pending',
          timestamp,
        },
      ];
      break;
    }
    case 'Medical Emergency': {
      incidents = [
        {
          id: 'inc_med_01',
          summary: 'Heat exhaustion incident reported in seating bowl Sector 12.',
          priority: 'high',
          departmentsAffected: ['medical', 'stadium_ops'],
          status: 'reported',
          timestamp,
          zoneId: 'zone_seating',
        },
      ];
      events = [
        {
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
            security: 'Provide clearance route for medical response buggy to Seating Tunnel 12.',
          },
          createdAt: timestamp,
        },
      ];
      tasks = [
        {
          id: 'tsk_med_reassign',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_seating',
          instructions: 'Proceed to Sector 12 seating tunnel and guide medical team.',
          status: 'pending',
          timestamp,
        },
      ];
      break;
    }
    case 'Accessibility SOS': {
      const zone = zones.find((z) => z.id === 'zone_concourse');
      if (zone) {
        zone.overlayColor = 'crowd-warning';
      }
      events = [
        {
          id: 'evt_acc_elevator_fail',
          zoneId: 'zone_concourse',
          type: 'accessibility_sos',
          severity: 'high',
          confidence: 0.98,
          rationale: 'Elevator EL-04 concourse landing fails safety gate checks, auto-locking.',
          recommendedActions: {
            organizer:
              'Deploy accessibility desk companion to guide wheelchair users to alternate ramp.',
            volunteer:
              'Assist mobility users near Elevator EL-04 and direct them to Concourse West Ramp.',
            fan: 'Wheelchair access at Elevator EL-04 is closed. Use alternative ramp at Concourse West.',
            security: 'Secure Elevator EL-04 perimeter for repair technician.',
          },
          createdAt: timestamp,
        },
      ];
      tasks = [
        {
          id: 'tsk_acc_sos',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_concourse',
          instructions:
            'Station near EL-04 elevator. Reroute wheelchair users to Concourse West Ramp.',
          status: 'pending',
          timestamp,
        },
      ];
      break;
    }
    case 'Volunteer Reassignment': {
      tasks = [
        {
          id: 'tsk_vol_re_01',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_gate_a',
          instructions: 'Report to Gate A transit drop-off to assist arrival queues.',
          status: 'pending',
          timestamp,
        },
      ];
      events = [
        {
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
            security: 'Adjust shuttle access lanes at Gate A.',
          },
          createdAt: timestamp,
        },
      ];
      break;
    }
    case 'Food Court Overflow': {
      const zone = zones.find((z) => z.id === 'zone_concourse');
      if (zone) {
        zone.currentDensity = 88;
        zone.overlayColor = 'crowd-warning';
      }
      events = [
        {
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
            security: 'Open auxiliary seating tunnel exits to ease egress pressure.',
          },
          createdAt: timestamp,
        },
      ];
      break;
    }
    case 'Sustainability Alert': {
      sustainability = {
        wasteDiversionRate: 62,
        energyPerAttendee: 1.95,
        updatedAt: timestamp,
      };
      events = [
        {
          id: 'evt_sust_power_spike',
          zoneId: 'zone_concourse',
          type: 'sustainability_alert',
          severity: 'medium',
          confidence: 0.9,
          rationale:
            'Waste diversion drops below 65% target. Energy spike detected at concourse lighting.',
          recommendedActions: {
            organizer: 'Dim unused concourse back-lights. Deploy recycling bin monitors.',
            volunteer: 'Monitor concourse recycle bins to guide sorting.',
            fan: 'Help us match our zero-waste goal by placing plastic cups in the green recycle bins.',
            security: 'Confirm auxiliary utility doors are closed to prevent heating loss.',
          },
          createdAt: timestamp,
        },
      ];
      tasks = [
        {
          id: 'tsk_sust_sort',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_concourse',
          instructions: 'Monitor the green recycle bin hubs at Concourse Sector 4 and guide fans.',
          status: 'pending',
          timestamp,
        },
      ];
      break;
    }
    case 'Parking Overflow': {
      const zone = zones.find((z) => z.id === 'zone_parking');
      if (zone) {
        zone.currentDensity = 98;
        zone.overlayColor = 'crowd-critical';
      }
      events = [
        {
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
            security: 'Establish roadblock at main Parking gate and divert incoming cars.',
          },
          createdAt: timestamp,
        },
      ];
      break;
    }
    case 'Severe Weather': {
      events = [
        {
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
            security: 'Divert pedestrian plazas entry flow to stadium tunnel gates.',
          },
          createdAt: timestamp,
        },
      ];
      tasks = [
        {
          id: 'tsk_weather_shelter',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_parking',
          instructions:
            'Instruct plaza visitors to enter the stadium concourse immediately due to lightning.',
          status: 'pending',
          timestamp,
        },
      ];
      break;
    }
    case 'Emergency Evacuation': {
      zones.forEach((z) => {
        z.overlayColor = 'crowd-critical';
        z.currentDensity = 99;
        z.lastUpdated = timestamp;
      });
      events = [
        {
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
            security: 'Open all emergency security gates. Clear egress paths for vehicles.',
          },
          createdAt: timestamp,
        },
      ];
      tasks = [
        {
          id: 'tsk_evac_assist',
          assignedTo: 'uid_volunteer_user',
          zoneId: 'zone_seating',
          instructions: 'Open Exit Gate 4 immediately and guide seating aisle evacuees.',
          status: 'pending',
          timestamp,
        },
      ];
      break;
    }
    default:
      break;
  }

  return { zones, events, tasks, incidents, sustainability };
}
