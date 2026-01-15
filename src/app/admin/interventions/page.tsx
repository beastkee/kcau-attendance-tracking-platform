'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Intervention } from '@/lib/interventions';
import InterventionAlert from '@/components/intelligence/InterventionAlert';
import {
  getActiveInterventions,
  getHighPriorityInterventions,
  getInterventionStats,
  updateInterventionStatus,
  escalateIntervention,
} from '@/lib/firebaseServices';

type FilterType = 'all' | 'active' | 'high-priority' | 'triggered' | 'acknowledged' | 'in-progress' | 'resolved';

export default function InterventionsPage() {
  const router = useRouter();
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [filter, setFilter] = useState<FilterType>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadInterventions();
    loadStats();
  }, []);

  const loadInterventions = async () => {
    setLoading(true);
    setError(null);
    try {
      let data: Intervention[] = [];

      if (filter === 'active') {
        data = await getActiveInterventions();
      } else if (filter === 'high-priority') {
        data = await getHighPriorityInterventions();
      } else {
        // Load all and filter by status
        const allIntervs = await getActiveInterventions();
        data = allIntervs.filter((i) => {
          if (filter === 'triggered') return i.status === 'triggered';
          if (filter === 'acknowledged') return i.status === 'acknowledged';
          if (filter === 'in-progress') return i.status === 'in-progress';
          if (filter === 'resolved') return i.status === 'resolved';
          return true;
        });
      }

      setInterventions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interventions');
      console.error('Error loading interventions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await getInterventionStats();
      setStats(stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await updateInterventionStatus(id, 'acknowledged');
      await loadInterventions();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge intervention');
    }
  };

  const handleResolve = async (id: string, notes: string) => {
    try {
      await updateInterventionStatus(id, 'resolved', notes);
      await loadInterventions();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve intervention');
    }
  };

  const handleEscalate = async (id: string) => {
    const reason = prompt('Enter escalation reason:');
    if (!reason) return;

    try {
      await escalateIntervention(id, reason);
      await loadInterventions();
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to escalate intervention');
    }
  };

  const filteredInterventions = interventions.filter((i) => {
    if (filter === 'triggered') return i.status === 'triggered';
    if (filter === 'acknowledged') return i.status === 'acknowledged';
    if (filter === 'in-progress') return i.status === 'in-progress';
    if (filter === 'resolved') return i.status === 'resolved';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Intervention Management</h1>
          <p className="text-gray-600">Track and manage student interventions</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600 font-semibold">Total</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg shadow">
              <div className="text-sm text-red-600 font-semibold">Active</div>
              <div className="text-3xl font-bold text-red-900">{stats.active}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow">
              <div className="text-sm text-blue-600 font-semibold">Escalated</div>
              <div className="text-3xl font-bold text-blue-900">{stats.escalated}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow">
              <div className="text-sm text-green-600 font-semibold">Resolved</div>
              <div className="text-3xl font-bold text-green-900">{stats.resolved}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow">
              <div className="text-sm text-purple-600 font-semibold">Avg Resolution</div>
              <div className="text-3xl font-bold text-purple-900">
                {stats.averageResolutionTime.toFixed(1)}h
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'active', 'high-priority', 'triggered', 'acknowledged', 'resolved'] as const).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setInterventions([]);
                  }}
                  className={`px-4 py-2 rounded font-semibold transition ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {f.replace('-', ' ').toUpperCase()}
                </button>
              )
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Interventions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading interventions...</div>
            </div>
          ) : filteredInterventions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-xl text-gray-600 mb-2">No interventions found</div>
              <div className="text-sm text-gray-500">Try adjusting your filter</div>
            </div>
          ) : (
            filteredInterventions.map((intervention) => (
              <div key={intervention.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4">
                  <InterventionAlert
                    intervention={intervention}
                    onAcknowledge={handleAcknowledge}
                    onResolve={handleResolve}
                  />
                  {intervention.status !== 'resolved' && (
                    <button
                      onClick={() => handleEscalate(intervention.id)}
                      className="mt-4 w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded font-semibold text-sm"
                    >
                      ⚡ Escalate
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        {filteredInterventions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-4 mt-8 text-sm text-gray-600">
            <div className="font-semibold text-gray-900 mb-2">Summary</div>
            <div>
              Showing {filteredInterventions.length} intervention
              {filteredInterventions.length !== 1 ? 's' : ''} • Filter: {filter.toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
