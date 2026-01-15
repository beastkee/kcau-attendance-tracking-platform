// Automated intervention trigger service
// This function should be called periodically (e.g., daily) to check all students
// and create interventions for those who meet the criteria

import {
  getStudents,
  getStudentAttendance,
  getStudentInterventions,
  createIntervention,
} from './firebaseServices';
import {
  calculateRiskAssessment,
  shouldTriggerIntervention,
  createInterventionTrigger,
  triggerToIntervention,
  DEFAULT_THRESHOLDS,
} from './interventions';
import type { InterventionThresholds } from './interventions';

export interface InterventionScanResult {
  scanned: number;
  triggered: number;
  skipped: number;
  errors: string[];
}

/**
 * Scan all students and automatically trigger interventions
 * This should be called periodically (e.g., via cron job or scheduled function)
 */
export async function scanAndTriggerInterventions(
  thresholds: InterventionThresholds = DEFAULT_THRESHOLDS
): Promise<InterventionScanResult> {
  const result: InterventionScanResult = {
    scanned: 0,
    triggered: 0,
    skipped: 0,
    errors: [],
  };

  try {
    console.log('[Intervention Service] Starting scan for all students...');

    // Get all students
    const students = await getStudents();
    result.scanned = students.length;

    for (const student of students) {
      try {
        // Get student's attendance records
        const attendance = await getStudentAttendance(student.id);

        // Skip if no attendance data
        if (attendance.length === 0) {
          result.skipped++;
          continue;
        }

        // Calculate risk assessment
        const riskAssessment = calculateRiskAssessment(attendance);

        // Check if intervention should be triggered
        if (shouldTriggerIntervention(riskAssessment, thresholds)) {
          // Check for existing active interventions
          const existingInterventions = await getStudentInterventions(student.id);
          const hasActive = existingInterventions.some(
            (i) =>
              i.status === 'triggered' ||
              i.status === 'acknowledged' ||
              i.status === 'in-progress'
          );

          if (hasActive) {
            result.skipped++;
            console.log(
              `[Intervention Service] Student ${student.id} already has active intervention`
            );
            continue;
          }

          // Create intervention trigger
          const trigger = createInterventionTrigger(
            student.id,
            student.name || student.email,
            riskAssessment
          );

          // Convert trigger to intervention and save
          const intervention = triggerToIntervention(trigger, '');

          // Remove the empty id and let Firebase generate it
          const { id, ...interventionData } = intervention;
          await createIntervention(interventionData);

          result.triggered++;
          console.log(
            `[Intervention Service] Triggered intervention for ${student.name} (score: ${riskAssessment.score})`
          );
        } else {
          result.skipped++;
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error processing student';
        result.errors.push(`${student.id}: ${message}`);
        console.error(`[Intervention Service] Error processing student ${student.id}:`, error);
      }
    }

    console.log('[Intervention Service] Scan complete:', result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error in scan';
    result.errors.push(`Fatal error: ${message}`);
    console.error('[Intervention Service] Fatal error:', error);
    throw error;
  }
}

/**
 * Monitor a single student and trigger intervention if needed
 */
export async function monitorStudent(
  studentId: string,
  thresholds: InterventionThresholds = DEFAULT_THRESHOLDS
): Promise<boolean> {
  try {
    // Get student data
    const students = await getStudents();
    const student = students.find((s) => s.id === studentId);

    if (!student) {
      throw new Error(`Student ${studentId} not found`);
    }

    // Get attendance
    const attendance = await getStudentAttendance(studentId);
    if (attendance.length === 0) {
      return false;
    }

    // Calculate risk
    const riskAssessment = calculateRiskAssessment(attendance);

    // Check if intervention needed
    if (!shouldTriggerIntervention(riskAssessment, thresholds)) {
      return false;
    }

    // Check for existing active intervention
    const existingInterventions = await getStudentInterventions(studentId);
    const hasActive = existingInterventions.some(
      (i) =>
        i.status === 'triggered' ||
        i.status === 'acknowledged' ||
        i.status === 'in-progress'
    );

    if (hasActive) {
      return false;
    }

    // Create intervention
    const trigger = createInterventionTrigger(
      student.id,
      student.name || student.email,
      riskAssessment
    );

    const intervention = triggerToIntervention(trigger, '');
    const { id, ...interventionData } = intervention;
    await createIntervention(interventionData);

    console.log(`[Intervention Service] Intervention triggered for ${student.name}`);
    return true;
  } catch (error) {
    console.error(`[Intervention Service] Error monitoring student:`, error);
    throw error;
  }
}

/**
 * Get intervention statistics and health status
 */
export async function getInterventionHealthStatus(): Promise<{
  totalStudents: number;
  activeInterventions: number;
  highRiskStudents: number;
  resolutionRate: number;
}> {
  try {
    const students = await getStudents();
    let activeInterventions = 0;
    let highRiskStudents = 0;
    let resolvedCount = 0;
    let totalInterventions = 0;

    for (const student of students) {
      const attendance = await getStudentAttendance(student.id);
      if (attendance.length > 0) {
        const riskAssessment = calculateRiskAssessment(attendance);

        if (riskAssessment.score >= 70) {
          highRiskStudents++;
        }

        const interventions = await getStudentInterventions(student.id);
        const active = interventions.filter(
          (i) =>
            i.status === 'triggered' ||
            i.status === 'acknowledged' ||
            i.status === 'in-progress'
        ).length;
        const resolved = interventions.filter((i) => i.status === 'resolved').length;

        activeInterventions += active;
        totalInterventions += interventions.length;
        resolvedCount += resolved;
      }
    }

    const resolutionRate =
      totalInterventions > 0 ? (resolvedCount / totalInterventions) * 100 : 0;

    return {
      totalStudents: students.length,
      activeInterventions,
      highRiskStudents,
      resolutionRate,
    };
  } catch (error) {
    console.error('[Intervention Service] Error getting health status:', error);
    throw error;
  }
}
