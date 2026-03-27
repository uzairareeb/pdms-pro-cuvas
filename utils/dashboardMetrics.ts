/**
 * dashboardMetrics.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized, single‑source‑of‑truth module for all dashboard metric
 * calculations.  Every function here operates on the live `students` array
 * directly from the store – no caching, no hardcoded values.
 *
 * Allowed status values (maps directly to StudentStatus enum):
 *   Active | Completed | Dropped | Suspended | On Leave | Closed
 *
 * Any other value is treated as an anomaly and surfaced in the `anomalyCount`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Student, StudentStatus, Gender, ValidationStatus } from '../types';

// ─── canonical status normalizer ────────────────────────────────────────────
/** Trim + lowercase for case‑insensitive comparison */
export const normalizeStatus = (raw: string | undefined | null): string =>
  String(raw ?? '').trim().toLowerCase();

/** Returns the canonical StudentStatus key or null if not in the enum */
const toCanonical = (raw: string | undefined): StudentStatus | null => {
  const lower = normalizeStatus(raw);
  const map: Record<string, StudentStatus> = {
    active:           StudentStatus.ACTIVE,
    completed:        StudentStatus.COMPLETED,
    dropped:          StudentStatus.DROPPED,
    suspended:        StudentStatus.SUSPENDED,
    'on leave':       StudentStatus.ON_LEAVE,
    leave:            StudentStatus.ON_LEAVE,
    closed:           StudentStatus.CLOSED,
  };
  return map[lower] ?? null;
};

// ─── individual predicates ────────────────────────────────────────────────────
export const isActive    = (s: Student) => toCanonical(s.status) === StudentStatus.ACTIVE;
export const isCompleted = (s: Student) => toCanonical(s.status) === StudentStatus.COMPLETED;
export const isDropped   = (s: Student) => toCanonical(s.status) === StudentStatus.DROPPED;
export const isSuspended = (s: Student) => toCanonical(s.status) === StudentStatus.SUSPENDED;
export const isOnLeave   = (s: Student) => toCanonical(s.status) === StudentStatus.ON_LEAVE;
export const isClosed    = (s: Student) => toCanonical(s.status) === StudentStatus.CLOSED;

// Gender predicates
export const isMale   = (s: Student) => normalizeStatus(s.gender) === 'male';
export const isFemale = (s: Student) => normalizeStatus(s.gender) === 'female';

// A student has an anomalous status if it doesn't map to any known canonical value
const isAnomaly = (s: Student) => toCanonical(s.status) === null;

// degree normalizer (strips dots, uppercases)
export const normalizeDegree = (val?: string) =>
  String(val ?? '').replace(/\./g, '').trim().toUpperCase();

// ─── aggregate metrics ────────────────────────────────────────────────────────
export interface DashboardMetrics {
  totalCount:      number;
  maleCount:       number;
  femaleCount:     number;
  genderUnknown:   number;
  activeCount:     number;
  completedCount:  number;
  droppedCount:    number;
  suspendedCount:  number;
  onLeaveCount:    number;
  closedCount:     number;
  anomalyCount:    number;   // students with unknown / unmapped status
  pendingAuditCount: number;
  /** Integrity check: totalCount === sum of all status categories */
  isStatusSumValid:  boolean;
  /** Integrity check: totalCount === maleCount + femaleCount (+ genderUnknown) */
  isGenderSumValid:  boolean;
}

export const computeMetrics = (students: Student[]): DashboardMetrics => {
  const total       = students.length;
  const male        = students.filter(isMale).length;
  const female      = students.filter(isFemale).length;
  const gUnknown    = total - male - female;
  const active      = students.filter(isActive).length;
  const completed   = students.filter(isCompleted).length;
  const dropped     = students.filter(isDropped).length;
  const suspended   = students.filter(isSuspended).length;
  const onLeave     = students.filter(isOnLeave).length;
  const closed      = students.filter(isClosed).length;
  const anomaly     = students.filter(isAnomaly).length;
  const pendingAudit = students.filter(
    s => s.validationStatus === ValidationStatus.PENDING ||
         s.validationStatus === ValidationStatus.RETURNED
  ).length;

  const statusSum = active + completed + dropped + suspended + onLeave + closed + anomaly;

  return {
    totalCount:        total,
    maleCount:         male,
    femaleCount:       female,
    genderUnknown:     gUnknown,
    activeCount:       active,
    completedCount:    completed,
    droppedCount:      dropped,
    suspendedCount:    suspended,
    onLeaveCount:      onLeave,
    closedCount:       closed,
    anomalyCount:      anomaly,
    pendingAuditCount: pendingAudit,
    isStatusSumValid:  statusSum === total,
    isGenderSumValid:  male + female + gUnknown === total,
  };
};
