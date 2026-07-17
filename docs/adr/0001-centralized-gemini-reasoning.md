# ADR-0001: Centralized Gemini Reasoning Layer over Per-Role Bots

## Status
Accepted

## Context
We need to provide operational recommendations for various roles (Organizer, Security, Fan, Volunteer) in response to stadium events. Designing separate AI bots for each role increases complexity, prompt management overhead, API latency, and inconsistencies in decision-making.

## Decision
We choose a single, centralized Gemini AI reasoning layer that takes raw telemetry signals and produces a single unified `OperationalEvent` detailing context-aware instructions for all roles simultaneously.

## Consequences
- **Consistency:** Ensures that all roles see coordinated actions.
- **Latency:** Reduces total model calls to 1 per event.
- **Maintainability:** System prompts and reasoning schema updates are managed in a single Firestore/Functions pipeline.
