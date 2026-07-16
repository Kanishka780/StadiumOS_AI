import { describe, it, expect } from 'vitest';
import { ZoneSchema } from '../models/zone';
import { OperationalEventSchema } from '../models/event';
import { VolunteerTaskSchema } from '../models/task';
import { IncidentSchema } from '../models/incident';
import { SustainabilityMetricsSchema } from '../models/sustainability';
import { AuditLogSchema } from '../models/audit';
import { UserSchema } from '../models/user';

describe('Domain Models & Zod Validations', () => {
  
  describe('Zone Schema', () => {
    it('should validate a valid Zone object', () => {
      const valid = {
        id: 'zone_gate_a',
        name: 'Entry Gate A',
        currentDensity: 45,
        flowRate: 15,
        overlayColor: 'crowd-safe',
        lastUpdated: new Date().toISOString(),
      };
      const result = ZoneSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('zone_gate_a');
        expect(result.data.currentDensity).toBe(45);
        expect(result.data.flowRate).toBe(15);
      }
    });

    it('should fail validation on negative densities or flow rates', () => {
      const invalid = {
        id: 'zone_gate_a',
        name: 'Entry Gate A',
        currentDensity: -5,
        flowRate: -10,
        overlayColor: 'crowd-safe',
        lastUpdated: new Date().toISOString(),
      };
      const result = ZoneSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('OperationalEvent Schema', () => {
    it('should validate a valid OperationalEvent', () => {
      const valid = {
        id: 'evt_01',
        zoneId: 'zone_gate_b',
        type: 'congestion',
        severity: 'high',
        confidence: 0.88,
        rationale: 'Density index spike.',
        recommendedActions: {
          organizer: 'Deploy volunteers.',
          fan: 'Seek gate C.',
        },
        createdAt: new Date().toISOString(),
      };
      const result = OperationalEventSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.confidence).toBe(0.88);
        expect(result.data.severity).toBe('high');
        expect(result.data.recommendedActions.organizer).toBe('Deploy volunteers.');
      }
    });

    it('should fail if confidence is out of 0-1 bounds', () => {
      const invalid = {
        id: 'evt_01',
        zoneId: 'zone_gate_b',
        type: 'congestion',
        severity: 'high',
        confidence: 1.5,
        rationale: 'Density index spike.',
        recommendedActions: {},
        createdAt: new Date().toISOString(),
      };
      const result = OperationalEventSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('VolunteerTask Schema', () => {
    it('should validate a correct VolunteerTask', () => {
      const valid = {
        id: 'task_01',
        assignedTo: 'vol_01',
        zoneId: 'zone_gate_c',
        instructions: 'Clear passage 3.',
        status: 'pending',
        timestamp: new Date().toISOString(),
      };
      const result = VolunteerTaskSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('pending');
      }
    });

    it('should fail on invalid task status value', () => {
      const invalid = {
        id: 'task_01',
        assignedTo: 'vol_01',
        zoneId: 'zone_gate_c',
        instructions: 'Clear passage 3.',
        status: 'not_started', // Invalid status option
        timestamp: new Date().toISOString(),
      };
      const result = VolunteerTaskSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Incident Schema', () => {
    it('should validate a correct Incident', () => {
      const valid = {
        id: 'inc_01',
        summary: 'Elevator fail EL-04.',
        priority: 'high',
        departmentsAffected: ['facilities'],
        status: 'reported',
        timestamp: new Date().toISOString(),
        zoneId: 'zone_concourse',
      };
      const result = IncidentSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('SustainabilityMetrics Schema', () => {
    it('should validate valid sustainability values', () => {
      const valid = {
        matchId: 'match_01',
        transitModeShare: { transit: 70, driving: 20, walking: 10 },
        wasteDiversionRate: 85,
        energyPerAttendee: 1.15,
        waterUsage: 35000,
        updatedAt: new Date().toISOString(),
      };
      const result = SustainabilityMetricsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should fail on invalid waste diversion percentage', () => {
      const invalid = {
        matchId: 'match_01',
        transitModeShare: { transit: 70, driving: 20, walking: 10 },
        wasteDiversionRate: 120, // percentage > 100
        energyPerAttendee: 1.15,
        waterUsage: 35000,
        updatedAt: new Date().toISOString(),
      };
      const result = SustainabilityMetricsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('AuditLog Schema', () => {
    it('should validate a correct AuditLog', () => {
      const valid = {
        id: 'audit_01',
        actorUid: 'org_user',
        action: 'Accepted Gate B reroute',
        aiRecommendationId: 'rec_01',
        decision: 'accept',
        timestamp: new Date().toISOString(),
      };
      const result = AuditLogSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('User Schema', () => {
    it('should validate a correct User profile', () => {
      const valid = {
        uid: 'user_01',
        role: 'security',
        language: 'es',
        accessibilityPrefs: {
          needsHighContrast: true,
          needsCognitiveMode: false,
          needsVoiceGuidance: true,
        },
      };
      const result = UserSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

});
