import { describe, it, expect, vi } from 'vitest';
import { ScenarioRepository } from '../services/scenarioRepository';
import { ScenarioEngine } from '../services/scenarioEngine';
import { RecommendationEngine } from '../services/recommendationEngine';
import { ScenarioExecutor } from '../services/scenarioExecutor';
import { EventDispatcher } from '../services/eventDispatcher';

describe('Simulation Domain Services', () => {
  it('ScenarioRepository should load default zones and scenario states', () => {
    const repo = new ScenarioRepository();
    expect(repo.getScenarioNames().length).toBeGreaterThan(0);
    const zones = repo.loadDefaultZones(new Date().toISOString());
    expect(zones.length).toBe(8);
  });

  it('ScenarioEngine should manage state changes and trigger subscribers', () => {
    const engine = new ScenarioEngine();
    let updatedZones = false;
    engine.listenToZones((zones) => {
      if (zones.length > 0) updatedZones = true;
    });
    expect(updatedZones).toBe(true);
  });

  it('RecommendationEngine should return expected impact, affected entities, and alternative actions', async () => {
    const rec = new RecommendationEngine();
    const event = await rec.ingestSignal('zone_gate_b', 'turnstile_density', {
      count: 120,
      severity: 'high',
      description: 'density',
    });
    expect(event.expectedImpact).toBeDefined();
    expect(event.affectedEntities?.length).toBeGreaterThan(0);
    expect(event.alternativeActions?.length).toBeGreaterThan(0);
  });

  it('ScenarioExecutor and EventDispatcher should run scenarios and propagate events on timeline', async () => {
    vi.useFakeTimers();
    const repo = new ScenarioRepository();
    const engine = new ScenarioEngine();
    const dispatcher = new EventDispatcher();
    const executor = new ScenarioExecutor(repo, engine, dispatcher);

    executor.triggerScenario('Gate B Congestion');

    // Check initial event is populated
    expect(engine.getEvents().length).toBe(1);

    // Fast-forward timeline events propagation (800ms per stage)
    vi.advanceTimersByTime(5000);

    expect(engine.getTimeline().length).toBe(6); // 6 stages populated
    vi.useRealTimers();
  });
});
