import type { Zone } from '../models/zone';
import { getDefaultZones, getScenarioState } from './scenarioData';

/**
 * Repository service responsible for loading static scenario presets and default zones.
 */
export class ScenarioRepository {
  /**
   * Retrieves the list of standard scenario names available in the simulator.
   */
  getScenarioNames(): string[] {
    return [
      'Gate B Congestion',
      'Medical Emergency',
      'Accessibility SOS',
      'Volunteer Reassignment',
      'Food Court Overflow',
      'Sustainability Alert',
      'Parking Overflow',
      'Severe Weather',
      'Emergency Evacuation',
    ];
  }

  /**
   * Loads the default stadium zones.
   */
  loadDefaultZones(timestamp: string): Zone[] {
    return getDefaultZones(timestamp);
  }

  /**
   * Loads the mock data changes for a specific scenario name.
   */
  loadScenarioState(name: string, timestamp: string, zones: Zone[]) {
    return getScenarioState(name, timestamp, zones);
  }
}
