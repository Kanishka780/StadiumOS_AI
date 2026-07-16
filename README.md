# StadiumOS AI

StadiumOS AI is a role-aware, AI-unified operations platform for smart stadiums during large-scale tournament events, modeled after the FIFA World Cup 2026 operational requirements. It provides a live Digital Twin of the venue and a centralized Gemini reasoning layer for six distinct personas: Fan, Organizer, Volunteer, Security, Accessibility, and Executive.

Developed for the **Google PromptWars Challenge 4**.

---

## 1. Core Architecture

Built on **Clean Architecture** and **Dependency Inversion** principles:
- **UI Decoupling:** Dashboards consume services via `useService` contexts and are completely environment-agnostic.
- **SVG Digital Twin:** Replaces Google Maps for enhanced accessibility, offline performance, and keyboard navigability.
- **Server-Side Gemini:** All AI inference happens securely via Cloud Functions.
- **Strict Zod Validations:** Guards all system boundaries (Gemini outputs, Firestore inputs, forms, and environment variables).

---

## 2. Predefined Scenarios (Development Mode)

When configured in Simulation Mode (`VITE_USE_SIMULATION=true`), the app uses a deterministic adapter containing 9 preloaded operational scenarios:
1. **Gate B Congestion:** Triggers queue bottlenecks at Entry Gate B.
2. **Medical Emergency:** Logs a dispatcher request and assigns first aid responders.
3. **Accessibility SOS:** Initiates an elevator failure warning and routes wheelchair support.
4. **Volunteer Reassignment:** Displays volunteer crowd controllers moving to high-density zones.
5. **Food Court Overflow:** Flags concourse queue bottlenecks and routes fans elsewhere.
6. **Sustainability Alert:** Triggers recycle bin warnings and flags electricity spikes.
7. **Parking Overflow:** Re-routes incoming fans to public transport metro services.
8. **Severe Weather:** Signals shelter protocols for lightning risks.
9. **Emergency Evacuation:** Activates emergency evacuation routes across the SVG map.

---

## 3. Environment Variables Configuration

Create a `.env` file in the root directory:

```ini
# Core Configuration
VITE_USE_SIMULATION=true # Set to false to use production Firebase

# Firebase Production (Only required if VITE_USE_SIMULATION=false)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_FUNCTIONS_URL=your_functions_endpoint
```

---

## 4. Measurable Quality Targets

We enforce and verify:
- **Lighthouse Performance:** $\ge 95$
- **Lighthouse Accessibility:** $= 100$
- **Lighthouse Best Practices:** $= 100$
- **Core Web Vitals:** LCP $< 2.5\text{s}$, CLS $< 0.1$, INP $< 200\text{ms}$
- **JS Bundle Size:** $< 300\text{KB}$ (gzip)
- **Business Logic Coverage:** $\ge 90\%$
- **Total Test Asserts:** $110+$ total asserts
- **TypeScript & Lint Errors:** $0$

---

## 5. Development & Testing Commands

### Setup
```bash
npm install
```

### Run Locally
```bash
npm run dev
```

### Run Test Suite
```bash
npm run test
```
