import React from 'react';
import { ShieldCheck, EyeOff, Lock, Server } from 'lucide-react';

export const TrustCenter: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-sky-400" />
          Responsible AI & Trust Center
        </h1>
        <p className="text-slate-400 text-sm mt-1">Our commitments to safety, privacy, explainability, and human-in-the-loop coordination.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core Principles */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <EyeOff className="w-4 h-4 text-sky-400" />
            Privacy by Design (No Individual Tracking)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            StadiumOS AI does not collect, log, or process individual biometric features, facial recognition datasets, or personalized location signals. 
          </p>
          <ul className="list-disc pl-4 text-xs text-slate-400 leading-relaxed flex flex-col gap-1.5">
            <li><strong>Aggregate counters:</strong> Turnstiles measure aggregate crowd volume per minute.</li>
            <li><strong>Zone-level maps:</strong> System overlays group crowd densities into broad zones.</li>
            <li><strong>No profiles:</strong> Personal tickets, seat identities, and user profiles are isolated from AI algorithms.</li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-sky-400" />
            Security & Secret Containment
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The platform isolates all sensitive interactions. No third-party API keys or Google Gemini credentials reside in the client application bundle.
          </p>
          <ul className="list-disc pl-4 text-xs text-slate-400 leading-relaxed flex flex-col gap-1.5">
            <li><strong>Server-side only:</strong> Google Gemini Pro models are invoked exclusively in serverless Firebase Cloud Functions.</li>
            <li><strong>Secret Manager:</strong> Credentials reside in Cloud Secret Manager with strict access permissions.</li>
            <li><strong>Input validations:</strong> Strict Zod validators parse API inputs on every function call.</li>
          </ul>
        </div>

      </div>

      {/* Audit Log Declarations */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
          <Server className="w-4 h-4 text-sky-400" />
          Human-in-the-loop (Audit Log transparency)
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          The system implements a mandatory approval step for high-impact AI recommendations. Organizers can Accept, Override, or Snooze recommendations. All responses are logged to the `/auditLog` collection for full accountability.
        </p>
      </div>

    </div>
  );
};
