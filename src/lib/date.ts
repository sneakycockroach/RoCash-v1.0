/**
 * RoCash Local Date Utilities
 * All dates are local dates in the user's timezone (default "Africa/Kampala")
 */

export const DEFAULT_TIMEZONE = "Africa/Kampala";

export const weekdayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/**
 * Returns "YYYY-MM-DD" for current time in the given timezone via Intl.DateTimeFormat.
 * NEVER uses toISOString().slice(0, 10) for local date.
 */
export function todayLocal(tz: string = DEFAULT_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const partsMap = formatter.formatToParts(new Date());
    let year = '';
    let month = '';
    let day = '';
    for (const p of partsMap) {
      if (p.type === 'year') year = p.value;
      if (p.type === 'month') month = p.value;
      if (p.type === 'day') day = p.value;
    }
    return `${year}-${month}-${day}`;
  } catch (e) {
    // Fallback if timezone is invalid
    const fallbackFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const partsMap = fallbackFormatter.formatToParts(new Date());
    let year = '';
    let month = '';
    let day = '';
    for (const p of partsMap) {
      if (p.type === 'year') year = p.value;
      if (p.type === 'month') month = p.value;
      if (p.type === 'day') day = p.value;
    }
    return `${year}-${month}-${day}`;
  }
}

/**
 * Breaks "YYYY-MM-DD" into numeric { year, month, day }
 */
export function parts(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(num => parseInt(num, 10));
  return {
    year: y || 1970,
    month: m || 1,
    day: d || 1,
  };
}

/**
 * Returns the number of days in the given year and 1-based month (1 = Jan, 12 = Dec)
 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Adds n days to "YYYY-MM-DD" and returns a new "YYYY-MM-DD" string
 */
export function addDays(dateStr: string, n: number): string {
  const { year, month, day } = parts(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + n);
  const resYear = d.getUTCFullYear();
  const resMonth = String(d.getUTCMonth() + 1).padStart(2, '0');
  const resDay = String(d.getUTCDate()).padStart(2, '0');
  return `${resYear}-${resMonth}-${resDay}`;
}

/**
 * Returns "YYYY-MM-01" for a given "YYYY-MM-DD" string
 */
export function startOfMonth(dateStr: string): string {
  const { year, month } = parts(dateStr);
  const m = String(month).padStart(2, '0');
  return `${year}-${m}-01`;
}

/**
 * Returns the last day of the month as "YYYY-MM-DD"
 */
export function endOfMonth(dateStr: string): string {
  const { year, month } = parts(dateStr);
  const lastDay = daysInMonth(year, month);
  const m = String(month).padStart(2, '0');
  const d = String(lastDay).padStart(2, '0');
  return `${year}-${m}-${d}`;
}
