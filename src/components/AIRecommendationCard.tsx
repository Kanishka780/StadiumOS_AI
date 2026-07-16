import React, { useState } from 'react';
import type { OperationalEvent } from '../models/event';
import { useDatabase } from '../context/ServiceContext';
import { useRoleView } from '../hooks/useRoleView';
import { ShieldCheck, ShieldAlert, Cpu, Check, X, Bell } from 'lucide-react';

interface AIRecommendationCardProps {
  event: OperationalEvent;
  onDecisionSubmitted?: () => void;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  event,
  onDecisionSubmitted,
}) => {
  const db = useDatabase();
  const { role, canViewField } = useRoleView();
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<'accepted' | 'overridden' | 'snoozed' | null>(null);

  const handleDecision = async (decision: 'accept' | 'override' | 'snooze') => {
    if (!role) return;
    setSubmitting(true);
    try {
      await db.submitAuditLog({
        actorUid: `uid_${role}_user`,
        action: `Responded to ${event.type} recommendation`,
        aiRecommendationId: event.id,
        decision,
        rationale: decision === 'override' ? 'Manual override based on operations visual' : undefined,
      });

      // If organizer accepted, simulate reassigning tasks or blocking routes
      if (role === 'organizer' && decision === 'accept') {
        if (event.type === 'congestion' && event.zoneId === 'zone_gate_b') {
          // Accept volunteer reassignment
          await db.updateTaskStatus('tsk_gate_b_reassign', 'in_progress');
        }
      }

      setOutcome(decision === 'accept' ? 'accepted' : decision === 'override' ? 'overridden' : 'snoozed');
      if (onDecisionSubmitted) onDecisionSubmitted();
    } catch (err) {
      console.error('Failed to submit decision:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Determine specific text for current user's role
  const roleActionText = event.recommendedActions[role || 'fan'];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] tracking-wider uppercase font-semibold text-sky-400">Gemini Reasoning Layer</span>
            <h4 className="text-sm font-bold text-slate-100 mt-0.5 capitalize">{event.type.replace('_', ' ')} Advisory</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-400 font-medium">
            Conf: <strong className="text-sky-400">{(event.confidence * 100).toFixed(0)}%</strong>
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full uppercase font-bold text-slate-950 ${
            event.severity === 'critical' ? 'bg-rose-500' :
            event.severity === 'high' ? 'bg-amber-500' : 'bg-emerald-400'
          }`}>
            {event.severity}
          </span>
        </div>
      </div>

      <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-4 mb-4 text-xs leading-relaxed text-slate-300">
        <strong className="text-slate-100 font-semibold block mb-1">AI Rationale:</strong>
        {event.rationale}
      </div>

      {roleActionText && (
        <div className="bg-sky-500/5 border border-sky-500/10 rounded-lg p-4 mb-4 text-xs">
          <strong className="text-sky-400 font-semibold block mb-1">Actionable Recommendation for you:</strong>
          <p className="text-slate-300 leading-relaxed font-medium">{roleActionText}</p>
        </div>
      )}

      {/* Decision Buttons for Organizer & Security */}
      {canViewField('zones_write') && !outcome && (
        <div className="flex items-center gap-3 mt-4 border-t border-slate-800 pt-4">
          <button
            onClick={() => handleDecision('accept')}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer outline-none"
          >
            <Check className="w-3.5 h-3.5" />
            Accept Recommendation
          </button>
          <button
            onClick={() => handleDecision('override')}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-200 disabled:opacity-50 font-semibold text-xs rounded-lg transition-all cursor-pointer outline-none"
          >
            <X className="w-3.5 h-3.5" />
            Override AI
          </button>
          <button
            onClick={() => handleDecision('snooze')}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-50 font-medium text-xs rounded-lg transition-all cursor-pointer outline-none"
          >
            <Bell className="w-3.5 h-3.5" />
            Snooze Alert
          </button>
        </div>
      )}

      {outcome && (
        <div className="mt-4 border-t border-slate-800 pt-4 flex items-center gap-2 text-xs font-semibold">
          {outcome === 'accepted' && <span className="text-emerald-400 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Recommendation Accepted & Logged</span>}
          {outcome === 'overridden' && <span className="text-rose-400 flex items-center gap-1.5"><ShieldAlert className="w-4 h-4" /> Recommendation Overridden & Audit Saved</span>}
          {outcome === 'snoozed' && <span className="text-slate-400 flex items-center gap-1.5"><Bell className="w-4 h-4" /> Alert Snoozed for 10 minutes</span>}
        </div>
      )}
    </div>
  );
};
