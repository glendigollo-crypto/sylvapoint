// ---------------------------------------------------------------------------
// Grade System — SylvaPoint GTM Audit Tool
// Converts numeric scores (0-100) to letter grades with +/- modifiers
// ---------------------------------------------------------------------------

interface GradeThreshold {
  min: number;
  grade: string;
}

/**
 * Ordered from highest to lowest so the first match wins.
 */
const GRADE_THRESHOLDS: GradeThreshold[] = [
  { min: 95, grade: 'A+' },
  { min: 90, grade: 'A' },
  { min: 85, grade: 'A-' },
  { min: 80, grade: 'B+' },
  { min: 75, grade: 'B' },
  { min: 70, grade: 'B-' },
  { min: 65, grade: 'C+' },
  { min: 60, grade: 'C' },
  { min: 55, grade: 'C-' },
  { min: 50, grade: 'D+' },
  { min: 45, grade: 'D' },
  { min: 40, grade: 'D-' },
  { min: 0, grade: 'F' },
];

/**
 * Convert a numeric score (0-100) to a letter grade.
 * Scores are clamped to the 0-100 range.
 */
export function getGrade(score: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  for (const threshold of GRADE_THRESHOLDS) {
    if (clamped >= threshold.min) {
      return threshold.grade;
    }
  }

  return 'F';
}

/**
 * Map a letter grade to a CSS custom property name for color theming.
 *
 * These correspond to CSS variables expected to be defined in the theme:
 * --grade-excellent, --grade-good, --grade-average, --grade-poor, --grade-critical
 */
export function getGradeColor(grade: string): string {
  const category = getGradeCategory(grade);

  const colorMap: Record<string, string> = {
    excellent: '--grade-excellent',
    good: '--grade-good',
    average: '--grade-average',
    poor: '--grade-poor',
    critical: '--grade-critical',
  };

  return colorMap[category];
}

/**
 * Classify a letter grade into a human-readable performance category.
 */
export function getGradeCategory(
  grade: string
): 'excellent' | 'good' | 'average' | 'poor' | 'critical' {
  const letter = grade.charAt(0).toUpperCase();

  switch (letter) {
    case 'A':
      return 'excellent';
    case 'B':
      return 'good';
    case 'C':
      return 'average';
    case 'D':
      return 'poor';
    case 'F':
      return 'critical';
    default:
      return 'critical';
  }
}
