import type { AIService } from './interfaces';
import {
  OperationalEventSchema,
  type OperationalEvent,
  type IngestSignalPayload,
} from '../models/event';
import type { SustainabilityMetrics } from '../models/sustainability';

export class GeminiAIService implements AIService {
  private functionsUrl: string;
  private aiLatency: number = 0;

  constructor() {
    this.functionsUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || '';
  }

  private checkConfig() {
    if (!this.functionsUrl) {
      throw new Error('Firebase Functions URL is not configured. Set VITE_FIREBASE_FUNCTIONS_URL.');
    }
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs = 8000,
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (retries > 0) {
        // short backoff
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.executeWithRetry(fn, retries - 1);
      }
      throw err;
    }
  }

  async ingestSignal(
    zoneId: string,
    type: string,
    payload: IngestSignalPayload,
  ): Promise<OperationalEvent> {
    this.checkConfig();
    const url = `${this.functionsUrl}/api/events/ingest`;

    return this.executeWithRetry(async () => {
      const startTime = performance.now();
      const res = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId, type, payload }),
      });
      this.aiLatency = performance.now() - startTime;

      if (!res.ok) {
        throw new Error(`Ingest API returned error status ${res.status}`);
      }

      const body = await res.json();
      if (body.error) {
        throw new Error(body.error);
      }

      // strict validation of AI-reasoned operational event
      return OperationalEventSchema.parse(body.data);
    });
  }

  async summarizeIncident(incidentId: string): Promise<string> {
    this.checkConfig();
    const url = `${this.functionsUrl}/api/incidents/${incidentId}/summary`;

    return this.executeWithRetry(async () => {
      const startTime = performance.now();
      const res = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      this.aiLatency = performance.now() - startTime;

      if (!res.ok) {
        throw new Error(`Incident summary API returned error status ${res.status}`);
      }

      const body = await res.json();
      if (body.error) {
        throw new Error(body.error);
      }

      return String(body.data.summary);
    });
  }

  async getSustainabilityAdvice(metrics: SustainabilityMetrics): Promise<string> {
    this.checkConfig();
    const url = `${this.functionsUrl}/api/sustainability/advice`;

    return this.executeWithRetry(async () => {
      const startTime = performance.now();
      const res = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics }),
      });
      this.aiLatency = performance.now() - startTime;

      if (!res.ok) {
        throw new Error(`Sustainability advice API returned error status ${res.status}`);
      }

      const body = await res.json();
      if (body.error) {
        throw new Error(body.error);
      }

      return String(body.data.advice);
    });
  }

  async askAssistant(question: string, language: string): Promise<string> {
    this.checkConfig();
    const url = `${this.functionsUrl}/api/assistant/ask`;

    return this.executeWithRetry(async () => {
      const startTime = performance.now();
      const res = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language }),
      });
      this.aiLatency = performance.now() - startTime;

      if (!res.ok) {
        throw new Error(`Assistant API returned error status ${res.status}`);
      }

      const body = await res.json();
      if (body.error) {
        throw new Error(body.error);
      }

      return String(body.data.reply);
    });
  }

  async getAILatency(): Promise<number> {
    return Math.round(this.aiLatency);
  }
}
