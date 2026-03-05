import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ─── Tailwind class merge ─────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Fraction formatting (PRD Appendix A) ────────────────────────────────────

const FRACTIONS: [number, string][] = [
  [1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'],
  [1 / 2, '½'], [5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'],
];

export function formatQuantity(amount: number, scaleFactor = 1): string {
  const scaled = amount * scaleFactor;
  const whole = Math.floor(scaled);
  const remainder = scaled - whole;

  const fraction = FRACTIONS.find(([val]) => Math.abs(val - remainder) < 0.05);

  if (remainder < 0.05) return whole === 0 ? '0' : whole.toString();
  if (fraction) return whole > 0 ? `${whole}${fraction[1]}` : fraction[1];
  return scaled.toFixed(1);
}

// ─── Week start utilities (PRD Appendix B) ───────────────────────────────────

export function weekStart(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function weekStartISO(date = new Date()): string {
  return weekStart(date).toISOString().split('T')[0]; // "YYYY-MM-DD"
}

// ─── Advance prep constraint logic (PRD Appendix C) ──────────────────────────

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/**
 * Returns whether a recipe can be placed on a given day of the week.
 * dayIndex: 0=Monday, 6=Sunday
 */
export function canPlaceRecipeOnDay(advancePrepDays: number, dayIndex: number): boolean {
  return dayIndex >= advancePrepDays;
}

/** The earliest day index (0=Mon) a recipe can be placed. */
export function earliestDayForRecipe(advancePrepDays: number): number {
  return advancePrepDays;
}

/** The date prep must begin for a recipe eaten on eatDate. */
export function prepStartDate(eatDate: Date, advancePrepDays: number): Date {
  const d = new Date(eatDate);
  d.setDate(d.getDate() - advancePrepDays);
  return d;
}

/** Human-readable advance prep error message for the plan screen. */
export function advancePrepErrorMessage(advancePrepDays: number, recipeTitle: string): string {
  const earliest = DAY_NAMES[earliestDayForRecipe(advancePrepDays)];
  return `Can't schedule "${recipeTitle}" here — it needs ${advancePrepDays} day${advancePrepDays > 1 ? 's' : ''} of prep. Earliest day: ${earliest}.`;
}

/** Display name for a day index. */
export function dayName(dayIndex: number): string {
  return DAY_NAMES[dayIndex] ?? '';
}

/** Short day name (Mon, Tue, …) */
export function dayNameShort(dayIndex: number): string {
  return DAY_NAMES[dayIndex]?.slice(0, 3) ?? '';
}
