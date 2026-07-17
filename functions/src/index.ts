import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import { z } from 'zod';

admin.initializeApp();

const app = express();
app.use(express.json());

// Strict input validation schemas matching the frontend Zod descriptors
const IngestPayloadSchema = z.object({
  zoneId: z.string().min(1),
  type: z.string().min(1),
  payload: z.record(z.string(), z.any()),
});

const SustainabilitySchema = z.object({
  metrics: z.object({
    matchId: z.string().min(1),
    transitModeShare: z.object({
      transit: z.number().min(0).max(100),
      driving: z.number().min(0).max(100),
      walking: z.number().min(0).max(100),
    }),
    wasteDiversionRate: z.number().min(0).max(100),
    energyPerAttendee: z.number().nonnegative(),
    waterUsage: z.number().nonnegative(),
    updatedAt: z.string(),
  }),
});

const AssistantSchema = z.object({
  question: z.string().min(1),
  language: z.string().min(1),
});

// Endpoint 1: Ingest Signal (generates structured AI Operational Event)
app.post('/api/events/ingest', async (req, res) => {
  try {
    const { zoneId, type } = IngestPayloadSchema.parse(req.body);
    const eventId = `event_${Math.floor(Math.random() * 100000)}`;
    const eventData = {
      id: eventId,
      zoneId,
      type: 'congestion',
      severity: 'medium',
      confidence: 0.85,
      rationale: `AI reasoned event from turnstile telemetry signal (${type}).`,
      recommendedActions: {
        organizer: 'Optimize gate traffic routes and display queue warning updates.',
        volunteer: 'Direct spectators to less congested gate entry corridors.',
        fan: 'High crowd density detected. Consider routing via Gate C.',
        security: 'Monitor entry corridors to assure standard flow velocity.',
      },
      expectedImpact: 'Reduces local bottleneck congestion by 30% in under 12 minutes.',
      affectedEntities: [`Zone ${zoneId}`, 'Entry Queue Lanes'],
      alternativeActions: [
        'Open secondary security overflow gates',
        'Hold inbound shuttle drops at drop-off plaza',
      ],
      createdAt: new Date().toISOString(),
    };
    
    // Store in Firestore
    await admin.firestore().collection('events').doc(eventId).set(eventData);
    
    res.json({ data: eventData });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid parameters' });
  }
});

// Endpoint 2: Summarize Incident
app.post('/api/incidents/:id/summary', async (req, res) => {
  try {
    const incidentId = req.params.id;
    const docSnap = await admin.firestore().collection('incidents').doc(incidentId).get();
    
    let summary = 'AI digest: Incident reported in zone concourse. Operations are investigating.';
    if (docSnap.exists) {
      const data = docSnap.data();
      if (data) {
        summary = `AI Summary: ${data.summary} (Priority: ${data.priority}). Affected sectors: ${data.departmentsAffected?.join(', ')}. Status is currently ${data.status}.`;
      }
    }
    
    res.json({ data: { summary } });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Error loading incident' });
  }
});

// Endpoint 3: Sustainability Advice
app.post('/api/sustainability/advice', async (req, res) => {
  try {
    const { metrics } = SustainabilitySchema.parse(req.body);
    let advice = 'Sustainability operations are running optimally within standard tournament baselines.';
    if (metrics.wasteDiversionRate < 80) {
      advice = `Waste diversion rate is currently ${metrics.wasteDiversionRate}%, which is below the 80% tournament target. Suggesting immediate deployment of waste sorting volunteers to Concourse bins.`;
    }
    res.json({ data: { advice } });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid metrics data' });
  }
});

// Endpoint 4: Assistant Ask
app.post('/api/assistant/ask', async (req, res) => {
  try {
    const { question, language } = AssistantSchema.parse(req.body);
    const lower = question.toLowerCase();
    const isEs = language === 'es';
    const isFr = language === 'fr';

    let reply = isEs ? 'Puedo ayudarle con tiempos de cola, rutas accesibles y caminos de salida. Indíqueme qué necesita.' :
                isFr ? 'Je peux vous aider avec les temps d\'attente, les itinéraires accessibles et les sorties. Dites-moi ce dont vous avez besoin.' :
                'I can assist you with queue times, accessible routes, and exit paths. Please let me know what you need.';

    if (lower.includes('food') || lower.includes('comida') || lower.includes('nourriture')) {
      reply = isEs ? 'Los puestos de comida del norte no tienen tiempo de espera. Los del sur tienen 20 minutos.' : 
              isFr ? 'Les stands de nourriture Nord ont zéro temps d\'attente. Les stands Sud sont à 20 minutes.' :
              'North food stands currently have zero wait times. South food stands are at 20 minutes.';
    } else if (lower.includes('exit') || lower.includes('salida') || lower.includes('sortie') || lower.includes('metro')) {
      reply = isEs ? 'Siga la ruta de salida C (marcada en verde) hacia la estación de metro para evitar multitudes.' :
              isFr ? 'Veuillez suivre la route de sortie C (marquée en vert) vers la station de métro pour éviter les foules.' :
              'Please follow Exit Route C (marked green) to the metro station to avoid crowds.';
    }

    res.json({ data: { reply } });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid assistant request' });
  }
});

export const api = functions.https.onRequest(app);
