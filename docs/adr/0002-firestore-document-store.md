# ADR-0002: Firestore Document Store over Relational Database

## Status
Accepted

## Context
Stadium operational telemetry updates rapidly and irregularly. Real-time visualization is critical for digital twins. Setting up relational database polling pipelines introduces lag and increases server-side complexity.

## Decision
We select Google Cloud Firestore as our primary real-time document store, leveraging its native WebSocket-based `onSnapshot` listeners to push updates immediately to client dashboards.

## Consequences
- **Latency:** Telemetry updates render instantly (<20ms).
- **Scalability:** Handles sudden spikes in sensor traffic.
- **Offline-First:** Integrates well with client-side caches and local queues.
