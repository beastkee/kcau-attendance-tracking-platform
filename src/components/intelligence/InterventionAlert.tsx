import React, { useState } from 'react';
import type { Intervention } from '@/lib/interventions';

export interface InterventionAlertProps {
  intervention: Intervention;
  onAcknowledge?: (id: string) => Promise<void>;
  onResolve?: (id: string, notes: string) => Promise<void>;
  compact?: boolean;
}

const statusColors = {
  triggered: 'bg-red-100 border-red-300 text-red-800',
  acknowledged: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  'in-progress': 'bg-blue-100 border-blue-300 text-blue-800',
  resolved: 'bg-green-100 border-green-300 text-green-800',
  escalated: 'bg-purple-100 border-purple-300 text-purple-800',
};

const typeIcons = {
  warning: '⚠️',
  'email-alert': '📧',
  'teacher-notification': '👨‍🏫',
  'counselor-referral': '🚨',
  'parent-contact': '👨‍👩‍👧',
};

export const InterventionAlert: React.FC<InterventionAlertProps> = ({
  intervention,
  onAcknowledge,
  onResolve,
  compact = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const handleAcknowledge = async () => {
    if (!onAcknowledge) return;
    setIsLoading(true);
    try {
      await onAcknowledge(intervention.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!onResolve) return;
    setIsLoading(true);
    try {
      await onResolve(intervention.id, resolutionNotes);
      setShowResolveForm(false);
      setResolutionNotes('');
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className={`border-l-4 p-3 rounded text-sm ${statusColors[intervention.status]}`}>
        <div className="font-semibold">
          {typeIcons[intervention.type]} {intervention.studentName}
        </div>
        <div className="text-xs mt-1">{intervention.reason}</div>
        <div className="text-xs mt-1">Risk: {intervention.riskScore}/100</div>
      </div>
    );
  }

  return (
    <div className={`border-l-4 p-4 rounded-lg shadow-sm ${statusColors[intervention.status]}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{typeIcons[intervention.type]}</span>
          <div>
            <div className="font-semibold text-lg">{intervention.studentName}</div>
            <div className="text-xs opacity-75">
              ID: {intervention.studentId.slice(0, 8)}...
            </div>
          </div>
        </div>
        <span className="text-xs font-bold px-2 py-1 bg-opacity-50 bg-gray-700 text-white rounded">
          {intervention.status.toUpperCase()}
        </span>
      </div>

      {/* Risk Score */}
      <div className="mb-3 p-2 bg-opacity-30 bg-gray-700 rounded">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Risk Score</span>
          <span className="text-2xl font-bold">{intervention.riskScore}/100</span>
        </div>
      </div>

      {/* Type and Reason */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <div className="font-semibold text-xs opacity-75">Type</div>
          <div className="capitalize">{intervention.type.replace('-', ' ')}</div>
        </div>
        <div>
          <div className="font-semibold text-xs opacity-75">Triggered</div>
          <div>{new Date(intervention.triggeredAt).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Reason */}
      <div className="mb-3 p-2 bg-opacity-20 bg-gray-800 rounded text-sm">
        <div className="font-semibold mb-1">Reason</div>
        <div>{intervention.reason}</div>
      </div>

      {/* Follow-up info */}
      {intervention.followUpRequired && (
        <div className="mb-3 p-2 bg-orange-100 border border-orange-300 rounded text-sm text-orange-900">
          <div className="font-semibold">Follow-up Required</div>
          {intervention.followUpDate && (
            <div className="text-xs">
              By: {new Date(intervention.followUpDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )}

      {/* Notes if present */}
      {intervention.notes && (
        <div className="mb-3 p-2 bg-gray-100 rounded text-sm border border-gray-300">
          <div className="font-semibold text-gray-700 mb-1">Notes</div>
          <div className="text-gray-600">{intervention.notes}</div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        {intervention.status === 'triggered' && onAcknowledge && (
          <button
            onClick={handleAcknowledge}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
          >
            {isLoading ? 'Acknowledging...' : 'Acknowledge'}
          </button>
        )}

        {(intervention.status === 'acknowledged' || intervention.status === 'in-progress') &&
          onResolve && (
            <>
              {!showResolveForm && (
                <button
                  onClick={() => setShowResolveForm(true)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold"
                >
                  Mark Resolved
                </button>
              )}
            </>
          )}

        {showResolveForm && onResolve && (
          <div className="w-full col-span-2">
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Add resolution notes (optional)"
              className="w-full p-2 border rounded text-sm mb-2"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleResolve}
                disabled={isLoading}
                className="flex-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-semibold disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowResolveForm(false)}
                className="flex-1 px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Escalation indicator */}
      {intervention.status === 'escalated' && (
        <div className="mt-4 p-2 bg-purple-100 border-l-2 border-purple-500 text-purple-900 text-sm">
          <div className="font-semibold">⚡ Escalated</div>
          {intervention.escalationReason && (
            <div className="text-xs mt-1">{intervention.escalationReason}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterventionAlert;
