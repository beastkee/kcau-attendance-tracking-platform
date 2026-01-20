/**
 * Alert Trigger Utility
 * Sends intervention alerts via API
 */

export async function triggerInterventionAlert(
  interventionId: string,
  interventionData: {
    studentId: string;
    type: string;
    riskScore: number;
    reason: string;
    createdAt?: any;
  }
) {
  try {
    const response = await fetch('/api/send-intervention-alert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interventionId,
        intervention: interventionData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to send alert:', error);
      return { success: false, error };
    }

    const result = await response.json();
    console.log('✅ Alert triggered successfully:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('❌ Error triggering alert:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Usage Example:
 *
 * import { triggerInterventionAlert } from '@/lib/alertTrigger';
 *
 * // When creating an intervention:
 * const newIntervention = {
 *   studentId: 'student-123',
 *   type: 'academic-support',
 *   riskScore: 85,
 *   reason: 'Student missing assignments',
 *   createdAt: new Date(),
 * };
 *
 * await triggerInterventionAlert(interventionId, newIntervention);
 */
