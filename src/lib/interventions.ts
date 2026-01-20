// Intervention system for automated early warning and tracking
// Monitors student risk levels and triggers appropriate interventions

import type { RiskAssessment } from './analytics';

export type InterventionType = 'warning' | 'email-alert' | 'teacher-notification' | 'counselor-referral' | 'parent-contact';
export type InterventionStatus = 'triggered' | 'acknowledged' | 'in-progress' | 'resolved' | 'escalated';

export interface InterventionTrigger {
  studentId: string;
  studentName: string;
  type: InterventionType;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  reason: string; // e.g., "High absence rate (80%)", "Declining trend"
  triggeredAt: Date | string;
  teacher?: string;
  class?: string;
}

export interface Intervention {
  id: string;
  studentId: string;
  studentName: string;
  type: InterventionType;
  status: InterventionStatus;
  riskScore: number;
  reason: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  notes?: string;
  escalationReason?: string;
  teacherId?: string;
  counselorId?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

export interface InterventionThresholds {
  highRiskThreshold: number; // default 70 - triggers counselor referral
  mediumRiskThreshold: number; // default 50 - triggers teacher notification
  lowRiskThreshold: number; // default 30 - triggers warning
  declineRateThreshold: number; // default -0.5 (slope) - triggers intervention
  absenceTrigger: number; // default 40% - direct absence trigger
  consecutiveAbsencesTrigger: number; // default 3 - consecutive absences
}

/**
 * Default intervention thresholds
 */
export const DEFAULT_THRESHOLDS: InterventionThresholds = {
  highRiskThreshold: 70,
  mediumRiskThreshold: 50,
  lowRiskThreshold: 30,
  declineRateThreshold: -0.5,
  absenceTrigger: 40,
  consecutiveAbsencesTrigger: 3,
};

/**
 * Determine if a student needs intervention based on risk assessment
 */
export function shouldTriggerIntervention(
  riskAssessment: RiskAssessment,
  thresholds: InterventionThresholds = DEFAULT_THRESHOLDS
): boolean {
  const score = riskAssessment.score;
  const breakdown = riskAssessment.breakdown;

  // High absence rate
  if (breakdown.attendancePercentage < (100 - thresholds.absenceTrigger)) {
    return true;
  }

  // Declining trend
  if (breakdown.recentTrendSlope && breakdown.recentTrendSlope < thresholds.declineRateThreshold) {
    return true;
  }

  // Risk thresholds
  if (score >= thresholds.lowRiskThreshold) {
    return true;
  }

  return false;
}

/**
 * Determine the type and severity of intervention needed
 */
export function determineInterventionType(
  riskAssessment: RiskAssessment,
  thresholds: InterventionThresholds = DEFAULT_THRESHOLDS
): InterventionType {
  const score = riskAssessment.score;

  if (score >= thresholds.highRiskThreshold) {
    return 'counselor-referral'; // Escalate to counselor
  }

  if (score >= thresholds.mediumRiskThreshold) {
    return 'email-alert'; // Alert teacher and admin
  }

  return 'warning'; // Simple warning
}

/**
 * Generate intervention reason based on risk breakdown
 */
export function generateInterventionReason(riskAssessment: RiskAssessment): string {
  const breakdown = riskAssessment.breakdown;
  const reasons: string[] = [];

  if (breakdown.attendancePercentage < 80) {
    reasons.push(`Low attendance: ${breakdown.attendancePercentage.toFixed(1)}%`);
  }

  if (breakdown.absences > 3) {
    reasons.push(`Multiple absences: ${breakdown.absences}`);
  }

  if (breakdown.lates > 2) {
    reasons.push(`Frequent lateness: ${breakdown.lates} times`);
  }

  if (breakdown.recentTrendSlope && breakdown.recentTrendSlope < -0.3) {
    reasons.push('Declining attendance trend');
  }

  return reasons.length > 0 ? reasons.join('; ') : 'Risk score elevated';
}

/**
 * Create an intervention trigger object
 */
export function createInterventionTrigger(
  studentId: string,
  studentName: string,
  riskAssessment: RiskAssessment,
  thresholds?: InterventionThresholds,
  additionalContext?: { teacher?: string; class?: string }
): InterventionTrigger {
  const type = determineInterventionType(riskAssessment, thresholds);
  const reason = generateInterventionReason(riskAssessment);

  return {
    studentId,
    studentName,
    type,
    riskScore: riskAssessment.score,
    riskLevel: riskAssessment.level,
    reason,
    triggeredAt: new Date(),
    teacher: additionalContext?.teacher,
    class: additionalContext?.class,
  };
}

/**
 * Convert trigger to intervention record
 */
export function triggerToIntervention(trigger: InterventionTrigger, id: string): Intervention {
  return {
    id,
    studentId: trigger.studentId,
    studentName: trigger.studentName,
    type: trigger.type,
    status: 'triggered',
    riskScore: trigger.riskScore,
    reason: trigger.reason,
    triggeredAt: new Date(trigger.triggeredAt),
    followUpRequired: trigger.riskLevel === 'high' || trigger.type === 'counselor-referral',
    followUpDate: trigger.riskLevel === 'high' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined, // 1 week follow-up
  };
}
