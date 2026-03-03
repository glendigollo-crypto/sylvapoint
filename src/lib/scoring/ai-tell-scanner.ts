// ---------------------------------------------------------------------------
// AI-Tell Scanner — SylvaPoint GTM Audit Tool
// Detects common AI-generated content markers using regex heuristics
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FlaggedWord {
  word: string;
  count: number;
  positions: number[];
}

export interface AITellResult {
  /** 0-100 where 100 = no AI tells detected (fully natural) */
  score: number;
  flaggedWords: FlaggedWord[];
  passiveVoicePercent: number;
  sentenceLengthStdDev: number;
  contractionFrequency: number;
  totalFlags: number;
}

// ---------------------------------------------------------------------------
// AI buzzword / phrase list (22+ entries)
// ---------------------------------------------------------------------------

const AI_TELL_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'delve', pattern: /\bdelve[sd]?\b/gi },
  { label: 'comprehensive', pattern: /\bcomprehensive\b/gi },
  { label: 'leverage', pattern: /\bleverag(?:e[sd]?|ing)\b/gi },
  { label: 'crucial', pattern: /\bcrucial(?:ly)?\b/gi },
  { label: 'landscape', pattern: /\blandscape[s]?\b/gi },
  { label: 'tapestry', pattern: /\btapestry\b/gi },
  { label: 'multifaceted', pattern: /\bmultifaceted\b/gi },
  { label: 'navigate', pattern: /\bnavigate[sd]?\b/gi },
  { label: 'robust', pattern: /\brobust(?:ly|ness)?\b/gi },
  { label: 'streamline', pattern: /\bstreamlin(?:e[sd]?|ing)\b/gi },
  { label: 'holistic', pattern: /\bholistic(?:ally)?\b/gi },
  { label: 'synergy', pattern: /\bsynerg(?:y|ies|istic)\b/gi },
  { label: 'paradigm', pattern: /\bparadigm[s]?\b/gi },
  { label: 'empower', pattern: /\bempower(?:s|ed|ing|ment)?\b/gi },
  { label: 'cutting-edge', pattern: /\bcutting[- ]edge\b/gi },
  { label: 'game-changer', pattern: /\bgame[- ]changer[s]?\b/gi },
  { label: 'unlock', pattern: /\bunlock(?:s|ed|ing)?\b/gi },
  { label: 'dive into', pattern: /\bdive[sd]?\s+into\b/gi },
  { label: "in today's", pattern: /\bin today'?s\b/gi },
  {
    label: "it's important to note",
    pattern: /\bit(?:'s| is) important to note\b/gi,
  },
  { label: 'in conclusion', pattern: /\bin conclusion\b/gi },
  {
    label: 'at the end of the day',
    pattern: /\bat the end of the day\b/gi,
  },
  { label: 'furthermore', pattern: /\bfurthermore\b/gi },
  { label: 'harness', pattern: /\bharness(?:es|ed|ing)?\b/gi },
  { label: 'realm', pattern: /\brealm[s]?\b/gi },
];

// ---------------------------------------------------------------------------
// Passive voice detection (simple heuristic)
// Matches: is/was/were/been/being + optional adverb + past participle (-ed, -en, -t)
// ---------------------------------------------------------------------------

const PASSIVE_PATTERN =
  /\b(?:is|was|were|been|being|are|am)\s+(?:\w+ly\s+)?(?:\w+(?:ed|en|t))\b/gi;

// ---------------------------------------------------------------------------
// Contraction detection
// ---------------------------------------------------------------------------

const CONTRACTION_PATTERN =
  /\b(?:\w+'(?:t|s|re|ve|ll|d|m))\b/gi;

// ---------------------------------------------------------------------------
// Sentence splitting
// ---------------------------------------------------------------------------

function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace or end of string
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ---------------------------------------------------------------------------
// Standard deviation helper
// ---------------------------------------------------------------------------

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  const variance =
    squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1);

  return Math.sqrt(variance);
}

// ---------------------------------------------------------------------------
// Find all match positions for a regex in text
// ---------------------------------------------------------------------------

function findAllPositions(text: string, pattern: RegExp): number[] {
  const positions: number[] = [];
  // Create a fresh regex to avoid shared state from lastIndex
  const re = new RegExp(pattern.source, pattern.flags);
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    positions.push(match.index);
    // Prevent infinite loops on zero-length matches
    if (match[0].length === 0) {
      re.lastIndex++;
    }
  }

  return positions;
}

// ---------------------------------------------------------------------------
// Count regex matches in text
// ---------------------------------------------------------------------------

function countMatches(text: string, pattern: RegExp): number {
  const re = new RegExp(pattern.source, pattern.flags);
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scan a block of text for common AI-generated content tells.
 *
 * Returns a score from 0-100 where 100 = no AI tells (fully natural),
 * plus detailed breakdown of what was flagged.
 */
export function scanForAITells(text: string): AITellResult {
  if (!text || text.trim().length === 0) {
    return {
      score: 100,
      flaggedWords: [],
      passiveVoicePercent: 0,
      sentenceLengthStdDev: 0,
      contractionFrequency: 0,
      totalFlags: 0,
    };
  }

  // ----- AI buzzword scanning -----

  const flaggedWords: FlaggedWord[] = [];
  let totalFlags = 0;

  for (const { label, pattern } of AI_TELL_PATTERNS) {
    const positions = findAllPositions(text, pattern);
    if (positions.length > 0) {
      flaggedWords.push({
        word: label,
        count: positions.length,
        positions,
      });
      totalFlags += positions.length;
    }
  }

  // ----- Passive voice analysis -----

  const sentences = splitSentences(text);
  const sentenceCount = Math.max(sentences.length, 1);
  const passiveMatches = countMatches(text, PASSIVE_PATTERN);
  const passiveVoicePercent =
    Math.round((passiveMatches / sentenceCount) * 100 * 10) / 10;

  // ----- Sentence length standard deviation -----

  const sentenceLengths = sentences.map((s) => {
    const words = s.split(/\s+/).filter((w) => w.length > 0);
    return words.length;
  });
  const sentenceLengthStdDev =
    Math.round(standardDeviation(sentenceLengths) * 100) / 100;

  // ----- Contraction frequency -----

  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  const contractionMatches = countMatches(text, CONTRACTION_PATTERN);
  const contractionFrequency =
    wordCount > 0
      ? Math.round((contractionMatches / wordCount) * 100 * 100) / 100
      : 0;

  // ----- Score calculation -----

  let score = 100;

  // Deduct for AI buzzwords: -3 per flag, max -60
  const wordDeduction = Math.min(totalFlags * 3, 60);
  score -= wordDeduction;

  // Deduct for high passive voice: scale from 0-20 based on passive %
  // Over 30% passive = full deduction; under 10% = minimal deduction
  const passiveDeduction = Math.min(
    Math.max(((passiveVoicePercent - 10) / 20) * 20, 0),
    20
  );
  score -= passiveDeduction;

  // Deduct for low sentence variety: low std dev indicates robotic uniformity
  // Typical natural writing has stddev > 5; AI-generated is often < 3
  const varietyDeduction =
    sentenceLengthStdDev < 3
      ? Math.min((3 - sentenceLengthStdDev) * (20 / 3), 20)
      : 0;
  score -= varietyDeduction;

  // Bonus for contractions (natural writing) — reduce deductions slightly
  // If contraction frequency is above 2%, recover up to 5 points
  if (contractionFrequency > 2) {
    const contractionBonus = Math.min((contractionFrequency - 2) * 2.5, 5);
    score += contractionBonus;
  }

  // Clamp to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    flaggedWords,
    passiveVoicePercent,
    sentenceLengthStdDev,
    contractionFrequency,
    totalFlags,
  };
}
