// ─── User & Org ─────────────────────────────────────────────
export type UserRole = 'employee' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  managerId: string | null;
  avatar?: string;
  designation: string;
}

// ─── Cycles ─────────────────────────────────────────────────
export type CycleStatus = 'active' | 'closed' | 'upcoming';
export type ActivePhase = 'goal_setting' | 'q1' | 'q2' | 'q3' | 'q4';

export interface Cycle {
  id: string;
  name: string;
  financialYear: string;
  goalSettingStart: string; // ISO date
  goalSettingEnd: string;
  q1Start: string;
  q1End: string;
  q2Start: string;
  q2End: string;
  q3Start: string;
  q3End: string;
  q4Start: string;
  q4End: string;
  status: CycleStatus;
}

// ─── Goals ──────────────────────────────────────────────────
export type GoalSheetStatus = 'draft' | 'submitted' | 'approved' | 'returned';

export type UoMType =
  | 'min_numeric'
  | 'max_numeric'
  | 'min_percent'
  | 'max_percent'
  | 'timeline'
  | 'zero';

export type GoalStatus = 'not_started' | 'on_track' | 'completed';

export const UOM_LABELS: Record<UoMType, string> = {
  min_numeric: 'Numeric (Higher is Better)',
  max_numeric: 'Numeric (Lower is Better)',
  min_percent: 'Percentage (Higher is Better)',
  max_percent: 'Percentage (Lower is Better)',
  timeline: 'Timeline (Date-based)',
  zero: 'Zero-based (Zero = Success)',
};

export const THRUST_AREAS = [
  'Revenue Growth',
  'Customer Satisfaction',
  'Operational Excellence',
  'Innovation & Technology',
  'People & Culture',
  'Safety & Compliance',
  'Cost Optimization',
  'Quality Improvement',
] as const;

export type ThrustArea = (typeof THRUST_AREAS)[number];

export interface Goal {
  id: string;
  goalSheetId: string;
  thrustArea: ThrustArea;
  title: string;
  description: string;
  uomType: UoMType;
  target: number;
  targetDate?: string; // For timeline UoM
  weightage: number;
  isShared: boolean;
  sharedFromGoalId: string | null;
  primaryOwnerId: string | null;
  status: GoalStatus;
  createdAt: string;
}

export interface GoalSheet {
  id: string;
  employeeId: string;
  cycleId: string;
  status: GoalSheetStatus;
  goals: Goal[];
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  returnedAt: string | null;
  returnComment: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Achievements ───────────────────────────────────────────
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface Achievement {
  id: string;
  goalId: string;
  goalSheetId: string;
  quarter: Quarter;
  actualValue: number | null;
  completionDate?: string; // For timeline UoM
  status: GoalStatus;
  computedScore: number | null;
  updatedAt: string;
  updatedBy: string;
}

// ─── Check-ins ──────────────────────────────────────────────
export interface CheckinComment {
  id: string;
  goalSheetId: string;
  managerId: string;
  quarter: Quarter;
  comment: string;
  createdAt: string;
}

// ─── Audit Logs ─────────────────────────────────────────────
export type AuditAction =
  | 'goal_created'
  | 'goal_updated'
  | 'goal_deleted'
  | 'goal_sheet_submitted'
  | 'goal_sheet_approved'
  | 'goal_sheet_returned'
  | 'goal_sheet_unlocked'
  | 'achievement_updated'
  | 'target_modified_post_lock'
  | 'weightage_modified_post_lock'
  | 'checkin_comment_added';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  entityType: 'goal' | 'goal_sheet' | 'achievement' | 'checkin';
  entityId: string;
  action: AuditAction;
  details: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

// ─── Shared Goal Push ───────────────────────────────────────
export interface SharedGoalPush {
  id: string;
  sourceGoalId: string;
  sourceGoalTitle: string;
  thrustArea: ThrustArea;
  uomType: UoMType;
  target: number;
  targetDate?: string;
  pushedBy: string;
  recipientIds: string[];
  createdAt: string;
}

// ─── Dashboard Stats ────────────────────────────────────────
export interface DashboardStats {
  totalGoals: number;
  completedGoals: number;
  onTrackGoals: number;
  notStartedGoals: number;
  overallProgress: number;
  weightedScore: number;
}

export interface ManagerDashboardStats extends DashboardStats {
  totalTeamMembers: number;
  submittedSheets: number;
  approvedSheets: number;
  pendingApproval: number;
  checkinsPending: number;
}

// ─── Notification ───────────────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'action';
  read: boolean;
  link?: string;
  createdAt: string;
}
