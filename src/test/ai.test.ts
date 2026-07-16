import { describe, it, expect } from 'vitest';
import { ScenarioAdapter } from '../services/scenarioAdapter';

describe('ScenarioAdapter AI Integrations', () => {
  const adapter = new ScenarioAdapter();

  describe('askAssistant', () => {
    it('should return English directions for food query', async () => {
      const res = await adapter.askAssistant('Where is the nearest food vendor?', 'en');
      expect(res).toContain('North food stands currently have zero wait times');
    });

    it('should return Spanish directions for food query', async () => {
      const res = await adapter.askAssistant('¿Dónde hay comida?', 'es');
      expect(res).toContain('Los puestos de comida del norte no tienen tiempo de espera');
    });

    it('should return French directions for exit query', async () => {
      const res = await adapter.askAssistant('Où est la sortie?', 'fr');
      expect(res).toContain('Veuillez suivre la route de sortie C');
    });

    it('should return default fallback directions for unspecific query', async () => {
      const res = await adapter.askAssistant('Hello assistance please', 'en');
      expect(res).toContain('I can assist you with queue times');
    });
  });

  describe('summarizeIncident', () => {
    it('should summarize a simulated incident', async () => {
      // Ingest a simulated incident first
      const incId = await adapter.reportIncident({
        summary: 'Elevator EL-01 stuck',
        priority: 'high',
        departmentsAffected: ['facilities'],
        status: 'reported',
        zoneId: 'zone_concourse',
      });

      const res = await adapter.summarizeIncident(incId);
      expect(res).toContain('AI Summary: Elevator EL-01 stuck');
      expect(res).toContain('Priority: high');
    });

    it('should handle non-existent incident summary requests', async () => {
      const res = await adapter.summarizeIncident('inc_invalid_id');
      expect(res).toBe('Incident not found.');
    });
  });

  describe('getSustainabilityAdvice', () => {
    it('should return optimal advice when metrics are high', async () => {
      const res = await adapter.getSustainabilityAdvice({
        matchId: 'match_01',
        transitModeShare: { transit: 70, driving: 20, walking: 10 },
        wasteDiversionRate: 85, // > 80
        energyPerAttendee: 1.1,
        waterUsage: 25000,
        updatedAt: new Date().toISOString(),
      });
      expect(res).toBe('Sustainability operations are running optimally within standard tournament baselines.');
    });

    it('should trigger alert action advice when waste diversion rate falls below 80%', async () => {
      const res = await adapter.getSustainabilityAdvice({
        matchId: 'match_01',
        transitModeShare: { transit: 70, driving: 20, walking: 10 },
        wasteDiversionRate: 75, // < 80
        energyPerAttendee: 1.1,
        waterUsage: 25000,
        updatedAt: new Date().toISOString(),
      });
      expect(res).toContain('Waste diversion is currently 75%');
    });
  });
});
