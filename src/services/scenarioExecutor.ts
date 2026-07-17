import type { ScenarioRepository } from './scenarioRepository';
import type { ScenarioEngine } from './scenarioEngine';
import type { EventDispatcher } from './eventDispatcher';

/**
 * Domain executor responsible for managing scenario trigger lifecycle and updates.
 */
export class ScenarioExecutor {
  private repository: ScenarioRepository;
  private engine: ScenarioEngine;
  private dispatcher: EventDispatcher;

  constructor(repository: ScenarioRepository, engine: ScenarioEngine, dispatcher: EventDispatcher) {
    this.repository = repository;
    this.engine = engine;
    this.dispatcher = dispatcher;
  }

  /**
   * Triggers a named simulation scenario, applying state changes and launching the timeline propagation.
   */
  triggerScenario(name: string) {
    const timestamp = new Date().toISOString();

    // 1. Cancel pending runs
    this.dispatcher.cancelPendingDispatches();

    // 2. Clear state
    this.engine.reset();

    // 3. Load next scenario state
    const state = this.repository.loadScenarioState(name, timestamp, this.engine.getZones());

    // 4. Populate simulation engine state
    this.engine.setZones(state.zones);
    this.engine.setEvents(state.events);
    this.engine.setTasks(state.tasks);
    this.engine.setIncidents(state.incidents);

    if (state.sustainability) {
      this.engine.setSustainability({
        ...this.engine.getSustainability(),
        ...state.sustainability,
        updatedAt: timestamp,
      });
    }

    // 5. Trigger end-to-end event propagation pipeline
    if (state.events.length > 0) {
      this.dispatcher.propagateEvent(state.events[0], this.engine);
    }
  }
}
