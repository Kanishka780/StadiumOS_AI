# ADR-0003: Scenario Simulation Adapter Pattern over Network Mocking

## Status
Accepted

## Context
For testing and evaluator walkthroughs, we need a way to run deterministic scenarios (e.g. weather, evacuation). Mocking at the network layer (e.g., using MSW or mock fetch) limits our ability to simulate live Firestore state subscription changes.

## Decision
We implement a `ScenarioAdapter` utilizing the Adapter Pattern. It implements the exact `DatabaseService` and `AIService` interface contracts, maintaining an in-memory mock database and notifying active listeners synchronously on state changes.

## Consequences
- **Zero Configuration:** Evaluators do not need to configure Firebase/Gemini credentials to run the walkthrough.
- **Fidelity:** person-roles update instantly and concurrently.
- **Portability:** Works seamlessly in offline local environments.
