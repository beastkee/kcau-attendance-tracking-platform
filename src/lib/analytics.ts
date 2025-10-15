// Lightweight analytics utilities for attendance patterns and risk scoring
// These functions are deterministic and side-effect free so they can be used on server or client.

import type { AttendanceRecord } from "@/types";

// Helpers
const isPresent = (status: AttendanceRecord["status"]) => status === "present";
const isAbsent = (status: AttendanceRecord["status"]) => status === "absent";
const isLate = (status: AttendanceRecord["status"]) => status === "late";

export type RiskLevel = "low" | "medium" | "high";

export interface RiskBreakdown {
  attendancePercentage: number;
  absences: number;
  lates: number;
  totalSessions: number;
  recentTrendSlope?: number; // sessions present (1) vs not (0) linear fit slope
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number; // 0-100 where higher = higher risk
  breakdown: RiskBreakdown;
}

export interface AnalysisOptions {
  // How many most recent records to consider for "recent trend" (rolling window)
  trendWindow?: number; // default 10
  // Weightings for scoring
  weights?: {
    absence: number; // default 0.6
    lateness: number; // default 0.2
    trend: number; // default 0.2
  };
}

// Normalize date input to Date
function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

// Sort records by date ascending
function sortByDate(records: AttendanceRecord[]): AttendanceRecord[] {
  return [...records].sort((a, b) => toDate(a.date).getTime() - toDate(b.date).getTime());
}

// 1. Attendance percentage across all records
export function calculateAttendancePercentage(records: AttendanceRecord[]): number {
  if (!records || records.length === 0) return 100; // no data => assume neutral/high
  const present = records.filter(r => isPresent(r.status)).length;
  return +(present / records.length * 100).toFixed(2);
}

// 2. Compute recent trend (simple linear regression slope on present=1, else=0)
export function calculateRecentTrendSlope(records: AttendanceRecord[], window: number = 10): number | undefined {
  if (!records || records.length < 2) return undefined;
  const sorted = sortByDate(records);
  const series = sorted.slice(-window);
  if (series.length < 2) return undefined;

  // x = 0..n-1, y = present(1) or not(0)
  const n = series.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const ys = series.map(r => (isPresent(r.status) ? 1 : 0));

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const xMean = mean(xs);
  const yMean = mean(ys);
  const numerator = xs.reduce((acc, x, i) => acc + (x - xMean) * (ys[i] - yMean), 0);
  const denominator = xs.reduce((acc, x) => acc + Math.pow(x - xMean, 2), 0) || 1;
  const slope = numerator / denominator; // negative => declining presence
  return +slope.toFixed(4);
}

// 3. Risk score and level
export function assessRisk(
  records: AttendanceRecord[],
  options: AnalysisOptions = {}
): RiskAssessment {
  const total = records.length;
  const absences = records.filter(r => isAbsent(r.status)).length;
  const lates = records.filter(r => isLate(r.status)).length;
  const attendancePercentage = calculateAttendancePercentage(records);
  const trendSlope = calculateRecentTrendSlope(records, options.trendWindow ?? 10);

  // Heuristics: more absences/lates and negative slope => higher risk
  const weights = {
    absence: options.weights?.absence ?? 0.6,
    lateness: options.weights?.lateness ?? 0.2,
    trend: options.weights?.trend ?? 0.2,
  };

  // Normalize components to 0..1
  const absenceRate = total ? absences / total : 0;
  const latenessRate = total ? lates / total : 0;
  // Trend normalization: slope typically in [-1,1]; map negative to risk, positive reduces risk
  const trendRisk = trendSlope === undefined ? 0.5 : Math.max(0, Math.min(1, -trendSlope + 0.5));

  let score = 100 * (
    weights.absence * absenceRate +
    weights.lateness * latenessRate +
    weights.trend * trendRisk
  );

  // Attendance percentage modifier (reward high attendance, penalize low)
  score = score * (1 + (50 - attendancePercentage) / 200); // +/- 25% at extremes

  // Clamp
  score = Math.max(0, Math.min(100, +score.toFixed(2)));

  // Map to level
  const level: RiskLevel = score >= 66 ? "high" : score >= 33 ? "medium" : "low";

  return {
    level,
    score,
    breakdown: {
      attendancePercentage,
      absences,
      lates,
      totalSessions: total,
      recentTrendSlope: trendSlope,
    },
  };
}

// 4. Convenience: analyze a single student's records end-to-end
export function analyzeStudentAttendance(
  records: AttendanceRecord[],
  options?: AnalysisOptions
): RiskAssessment {
  return assessRisk(records, options);
}

// 5. Class analytics: summary for many students
export function summarizeClassRisk(
  byStudent: Record<string, AttendanceRecord[]>,
  options?: AnalysisOptions
) {
  const entries = Object.entries(byStudent);
  const assessments = entries.map(([studentId, recs]) => ({
    studentId,
    assessment: assessRisk(recs, options),
  }));

  const high = assessments.filter(a => a.assessment.level === "high").length;
  const medium = assessments.filter(a => a.assessment.level === "medium").length;
  const low = assessments.filter(a => a.assessment.level === "low").length;

  return {
    totals: { count: entries.length, high, medium, low },
    assessments,
  } as const;
}
