// ---------------------------------------------------------------------------
// Formatting Utilities — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------

import { GRADE_THRESHOLDS } from './constants';
import type { Grade } from '@/types/scoring';

// ---------------------------------------------------------------------------
// formatScore — rounds a numeric score to one decimal place
// ---------------------------------------------------------------------------

/**
 * Rounds a numeric score to one decimal place and returns it as a string.
 *
 * @example formatScore(72.456) // "72.5"
 * @example formatScore(100)    // "100.0"
 */
export function formatScore(score: number): string {
  return score.toFixed(1);
}

// ---------------------------------------------------------------------------
// formatGrade — maps a 0-100 score to a letter grade
// ---------------------------------------------------------------------------

/**
 * Converts a numeric score (0–100) into a letter grade using the
 * project-wide GRADE_THRESHOLDS table.
 *
 * The thresholds are evaluated top-to-bottom; the first match wins.
 *
 * @example formatGrade(93) // "A"
 * @example formatGrade(42) // "F"
 */
export function formatGrade(score: number): Grade {
  const clamped = Math.max(0, Math.min(100, score));

  for (const threshold of GRADE_THRESHOLDS) {
    if (clamped >= threshold.min) {
      return threshold.grade;
    }
  }

  // Fallback — should never be reached because the last bucket starts at 0.
  return 'F';
}

// ---------------------------------------------------------------------------
// formatPercent — formats a decimal or whole number as a percentage string
// ---------------------------------------------------------------------------

/**
 * Formats a number as a percentage string.
 *
 * If `value` is between 0 and 1 (exclusive of 1.0 when it looks like a
 * ratio), it is treated as a ratio and multiplied by 100 first.
 * Values >= 1 are treated as already being percentages.
 *
 * @example formatPercent(0.753)  // "75.3%"
 * @example formatPercent(75.3)   // "75.3%"
 * @example formatPercent(1)      // "1.0%"  (ambiguous — treated as 1%)
 */
export function formatPercent(value: number): string {
  // Heuristic: values strictly between 0 and 1 are ratios.
  const pct = value > 0 && value < 1 ? value * 100 : value;
  return `${pct.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// formatCurrency — formats an integer (cents) or float as currency
// ---------------------------------------------------------------------------

/**
 * Formats a monetary amount using `Intl.NumberFormat`.
 *
 * @param amount   — The amount in the currency's major unit (e.g. dollars).
 * @param currency — ISO 4217 currency code, defaults to `"USD"`.
 *
 * @example formatCurrency(1234.5)          // "$1,234.50"
 * @example formatCurrency(1234.5, 'EUR')   // "€1,234.50"
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// truncate — trims a string to `maxLength` characters, appending "..."
// ---------------------------------------------------------------------------

/**
 * Truncates a string to the specified maximum length.  If the string is
 * already within the limit it is returned unchanged.  Otherwise it is
 * trimmed and an ellipsis ("...") is appended (the total length including
 * the ellipsis will be `maxLength`).
 *
 * @example truncate('Hello, world!', 8) // "Hello..."
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  if (maxLength <= 3) {
    return '...'.slice(0, maxLength);
  }
  return str.slice(0, maxLength - 3) + '...';
}

// ---------------------------------------------------------------------------
// slugify — converts an arbitrary string into a URL-safe slug
// ---------------------------------------------------------------------------

/**
 * Converts a string into a URL-friendly slug.
 *
 * - Lowercases the input
 * - Replaces non-alphanumeric characters with hyphens
 * - Collapses consecutive hyphens
 * - Trims leading / trailing hyphens
 *
 * @example slugify('Hello, World! 123') // "hello-world-123"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
