// backend/src/api/organization/organizationTypes.ts
export type OrganizationPhase = "PILOT" | "TRIAL" | "ACTIVE" | "CREDIT" | "NORMAL" | "EXPIRED" | "CREDITS_EXHAUSTED";

export interface PhaseProgressParams {
  start: string;
  end: string;
  phase: OrganizationPhase;
}

export interface PhaseProgressResult {
  range: number;
  remaining: number;
}

export function getPhaseProgress(start: string, end: string): PhaseProgressResult {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const now = new Date();

  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();
  const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    range: Math.min(Math.max(Math.floor((elapsed / totalDuration) * 100), 0), 100),
    remaining: remainingDays
  };
}

// Optional: Add related organization types if needed
export interface OrganizationTrialStatus {
  phase: OrganizationPhase;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface OrganizationProgress {
  promptsUsed: number;
  workflowsCompleted: number;
  timeSaved: number; // in minutes
}