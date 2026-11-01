/**
 * RoCash Money Utility Functions
 * Currency: UGX (whole numbers only, no floats)
 */

/**
 * Formats an amount as Ugandan Shillings (e.g. 12000 -> "UGX 12,000")
 */
export function formatUGX(n: number): string {
  const integer = Math.round(n || 0);
  const formatted = Math.abs(integer).toLocaleString('en-US');
  if (integer < 0) {
    return `-UGX ${formatted}`;
  }
  return `UGX ${formatted}`;
}

/**
 * Formats an amount compactly:
 * - Below 100,000: full number with separators ("12,000", "99,999")
 * - 100,000 up to 999,499: rounded to nearest thousand with "K" ("100K", "186K")
 * - 999,500 and above: millions with one decimal using Math.round(n / 100000) / 10,
 *   dropping a trailing ".0" ("1M", "1.4M", "1.5M" for 1,450,000)
 */
export function formatCompact(n: number): string {
  const isNegative = n < 0;
  const abs = Math.abs(Math.round(n || 0));
  let result = '';

  if (abs < 100_000) {
    result = abs.toLocaleString('en-US');
  } else if (abs < 999_500) {
    result = `${Math.round(abs / 1000)}K`;
  } else {
    const millions = Math.round(abs / 100_000) / 10;
    // In JavaScript, numbers like 1.0 format to "1", and 1.4 to "1.4"
    result = `${millions}M`;
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Keeps digits only, returns an integer (empty -> 0).
 * Money is always an integer; never floats.
 */
export function parseAmount(text: string | number | null | undefined): number {
  if (text === null || text === undefined) return 0;
  const digits = String(text).replace(/\D/g, '');
  if (!digits) return 0;
  const val = parseInt(digits, 10);
  return Number.isNaN(val) ? 0 : val;
}
