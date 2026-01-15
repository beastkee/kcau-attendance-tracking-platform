'use client';

import React, { useState, useEffect } from 'react';
import type { Intervention } from '@/lib/interventions';
import InterventionAlert from '@/components/intelligence/InterventionAlert';
import { getStudentInterventions, updateInterventionStatus } from '@/lib/firebaseServices';

interface TeacherInterventionsProps {
  studentId?: string;
  classId?: string;
}

export default function TeacherInterventions({ studentId, classId }: TeacherInterventionsProps) {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      loadStudentInterventions();
    }
  }, [studentId]);

  const loadStudentInterventions = async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getStudentInterventions(studentId);
      setInterventions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interventions');
      console.error('Error loading interventions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await updateInterventionStatus(id, 'acknowledged');
      await loadStudentInterventions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge');
    }
  };

  const handleResolve = async (id: string, notes: string) => {
    try {
      await updateInterventionStatus(id, 'resolved', notes);
      await loadStudentInterventions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve');
    }
  };

  if (!studentId) {
    return (
      <div className="bg-gray-100 p-4 rounded text-gray-600">
        Select a student to view interventions
      </div>
    );
  }

  if (loading) {
    return <div className="bg-gray-100 p-4 rounded text-gray-600">Loading interventions...</div>;
  }

  if (error) {
    return <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded">{error}</div>;
  }

  if (interventions.length === 0) {
    return (
      <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded">
        No interventions for this student
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        {interventions.length} intervention{interventions.length !== 1 ? 's' : ''}
      </div>
      {interventions.map((intervention) => (
        <InterventionAlert
          key={intervention.id}
          intervention={intervention}
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
        />
      ))}
    </div>
  );
}
