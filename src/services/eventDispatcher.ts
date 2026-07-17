import type { OperationalEvent, EventTimelineEntry } from '../models/event';
import type { ScenarioEngine } from './scenarioEngine';

/**
 * Domain dispatcher responsible for coordinating the progressive propagation of events
 * through the operational flow: Digital Twin -> Fan -> Volunteer -> Security -> Accessibility -> Executive.
 */
export class EventDispatcher {
  private activeTimers: number[] = [];

  /**
   * Cancels any active propagation loops to prevent timeline race conditions.
   */
  cancelPendingDispatches() {
    this.activeTimers.forEach((id) => clearTimeout(id));
    this.activeTimers = [];
  }

  /**
   * Executes a step-by-step delayed propagation sequence through all roles.
   */
  propagateEvent(event: OperationalEvent, engine: ScenarioEngine) {
    this.cancelPendingDispatches();

    const stages: Array<'twin' | 'fan' | 'volunteer' | 'security' | 'accessibility' | 'executive'> =
      ['twin', 'fan', 'volunteer', 'security', 'accessibility', 'executive'];

    const stageInfo = {
      twin: {
        title: 'Digital Twin heatmaps updated',
        desc: `Operational event visual overlays activated for zone: ${event.zoneId.replace('zone_', '').toUpperCase()}.`,
      },
      fan: {
        title: 'Lightweight Fan Companion broadcasted',
        desc: `Broadcasted mobile advisory: "${event.recommendedActions.fan}"`,
      },
      volunteer: {
        title: 'Volunteer task assigned',
        desc: `Copilot tasks assigned: "${event.recommendedActions.volunteer}"`,
      },
      security: {
        title: 'Surveillance ledger updated',
        desc: `Security dispatch details logged (Severity: ${event.severity.toUpperCase()}).`,
      },
      accessibility: {
        title: 'ADA routes validated',
        desc: 'Mobility/wheelchair routing alternatives displayed on Map.',
      },
      executive: {
        title: 'Executive dashboard aggregated',
        desc: `Aggregated AI latency, read latency, and sustainability KPIs.`,
      },
    };

    stages.forEach((stage, index) => {
      const timerId = window.setTimeout(() => {
        const entry: EventTimelineEntry = {
          id: `time_${event.id}_${stage}`,
          eventId: event.id,
          timestamp: new Date().toISOString(),
          stage,
          title: stageInfo[stage].title,
          description: stageInfo[stage].desc,
          status: 'completed',
        };
        engine.addTimelineEntry(entry);
      }, index * 800);

      this.activeTimers.push(timerId);
    });
  }
}
