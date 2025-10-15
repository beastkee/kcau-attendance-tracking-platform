"use client";

import React from "react";

export type RiskLevel = "low" | "medium" | "high";

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number; // 0-100
  className?: string;
}

const COLORS: Record<RiskLevel, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export default function RiskBadge({ level, score, className = "" }: RiskBadgeProps) {
  const label = level.charAt(0).toUpperCase() + level.slice(1);
  const display = score !== undefined ? `${label} • ${Math.round(score)}` : label;
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${COLORS[level]} ${className}`}>
      {display}
    </span>
  );
}
