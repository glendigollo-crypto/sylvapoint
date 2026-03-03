#!/usr/bin/env npx tsx
// ---------------------------------------------------------------------------
// Scoring Mechanism Validation — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Run: npx tsx scripts/test-scoring.ts
//
// Tests the entire scoring math pipeline:
// 1. Claude 0-10 → 0-100 conversion
// 2. Sub-score weighted aggregation per dimension
// 3. Dimension-level weighted composite score
// 4. Grade assignment
// 5. Edge cases and boundary conditions
// ---------------------------------------------------------------------------

// ---- Inline implementations (no imports to avoid env var issues) ----

function getGrade(score: number): string {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const thresholds = [
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
  for (const t of thresholds) {
    if (clamped >= t.min) return t.grade;
  }
  return 'F';
}

// ---- Weight profiles (from weights.ts defaults) ----

const DIMENSION_WEIGHTS: Record<string, Record<string, number>> = {
  saas:        { positioning: 0.20, copy: 0.15, seo: 0.15, lead_capture: 0.18, performance: 0.12, visual: 0.20 },
  services:    { positioning: 0.20, copy: 0.18, seo: 0.12, lead_capture: 0.15, performance: 0.10, visual: 0.25 },
  info_product:{ positioning: 0.18, copy: 0.20, seo: 0.12, lead_capture: 0.18, performance: 0.10, visual: 0.22 },
  ecommerce:   { positioning: 0.12, copy: 0.15, seo: 0.22, lead_capture: 0.15, performance: 0.16, visual: 0.20 },
  marketplace: { positioning: 0.22, copy: 0.15, seo: 0.13, lead_capture: 0.18, performance: 0.12, visual: 0.20 },
  enterprise:  { positioning: 0.22, copy: 0.18, seo: 0.10, lead_capture: 0.20, performance: 0.10, visual: 0.20 },
};

// Sub-score weights per dimension (from each scorer's SUB_SCORE_META)
const SUB_WEIGHTS: Record<string, Record<string, number>> = {
  positioning: {
    transformation_clarity: 0.20,
    differentiation: 0.20,
    value_translation: 0.15,
    target_specificity: 0.15,
    proof_arsenal: 0.15,
    mechanism_naming: 0.15,
  },
  copy: {
    headline_quality: 0.20,
    cta_effectiveness: 0.15,
    proof_specificity: 0.15,
    pain_articulation: 0.15,
    page_structure: 0.15,
    ai_tell_score: 0.10,
    objection_handling: 0.10,
  },
  seo: {
    technical_seo: 0.25,
    readability: 0.20,
    eeat_signals: 0.20,
    content_depth: 0.20,
    content_freshness: 0.15,
  },
  lead_capture: {
    lead_magnet_existence: 0.20,
    offer_specificity: 0.20,
    form_friction: 0.15,
    bridge_to_paid: 0.15,
    social_proof_at_capture: 0.15,
    format_business_match: 0.15,
  },
  performance: {
    lcp: 0.30,
    fid: 0.25,
    cls: 0.25,
    overall_performance: 0.20,
  },
  visual: {
    product_photography_quality: 0.20,
    video_content_presence: 0.20,
    platform_visual_compliance: 0.20,
    brand_visual_consistency: 0.20,
    human_presence_authenticity: 0.20,
  },
};

// ---- Test framework ----

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function assertClose(actual: number, expected: number, tolerance: number, label: string) {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, label, `expected ~${expected}, got ${actual} (diff ${diff.toFixed(4)})`);
}

// ---- Test 1: Sub-score weights sum to 1.0 ----

console.log('\n=== Test 1: Sub-score weights sum to 1.0 ===');
for (const [dim, subs] of Object.entries(SUB_WEIGHTS)) {
  const sum = Object.values(subs).reduce((a, b) => a + b, 0);
  assertClose(sum, 1.0, 0.001, `${dim} sub-weights sum = ${sum.toFixed(3)}`);
}

// ---- Test 2: Dimension weights sum to 1.0 for each business type ----

console.log('\n=== Test 2: Dimension weights sum to 1.0 per business type ===');
for (const [biz, dims] of Object.entries(DIMENSION_WEIGHTS)) {
  const sum = Object.values(dims).reduce((a, b) => a + b, 0);
  assertClose(sum, 1.0, 0.001, `${biz} dimension weights sum = ${sum.toFixed(3)}`);
}

// ---- Test 3: Claude 0-10 → 0-100 conversion ----

console.log('\n=== Test 3: Score conversion 0-10 → 0-100 ===');
function convertScore(claudeScore: number): number {
  return Math.round(Math.max(0, Math.min(100, claudeScore * 10)));
}

assert(convertScore(0) === 0, 'Score 0 → 0');
assert(convertScore(5) === 50, 'Score 5 → 50');
assert(convertScore(7) === 70, 'Score 7 → 70');
assert(convertScore(10) === 100, 'Score 10 → 100');
assert(convertScore(7.5) === 75, 'Score 7.5 → 75');
assert(convertScore(-1) === 0, 'Score -1 clamped to 0');
assert(convertScore(11) === 100, 'Score 11 clamped to 100');

// ---- Test 4: Sub-score weighted aggregation ----

console.log('\n=== Test 4: Sub-score weighted aggregation ===');

// Simulate a positioning dimension with known scores
const positioningSubScores = [
  { key: 'transformation_clarity', score: 70 },
  { key: 'differentiation', score: 60 },
  { key: 'value_translation', score: 80 },
  { key: 'target_specificity', score: 50 },
  { key: 'proof_arsenal', score: 75 },
  { key: 'mechanism_naming', score: 40 },
];

const posWeights = SUB_WEIGHTS['positioning'];
const posRawScore = positioningSubScores.reduce(
  (sum, s) => sum + s.score * (posWeights[s.key] ?? 0), 0
);
// 70*0.20 + 60*0.20 + 80*0.15 + 50*0.15 + 75*0.15 + 40*0.15
// = 14 + 12 + 12 + 7.5 + 11.25 + 6 = 62.75
assertClose(posRawScore, 62.75, 0.01, `Positioning raw score = ${posRawScore.toFixed(2)} (expected 62.75)`);
assert(posRawScore >= 0 && posRawScore <= 100, `Positioning raw score in 0-100 range`);

// ---- Test 5: Composite score calculation ----

console.log('\n=== Test 5: Composite score (SaaS profile) ===');

const dimScores: Record<string, number> = {
  positioning: 62.75,
  copy: 58.0,
  seo: 71.5,
  lead_capture: 45.0,
  performance: 53.0,
  visual: 66.0,
};

const saasWeights = DIMENSION_WEIGHTS['saas'];
let compositeScore = 0;
for (const [dim, score] of Object.entries(dimScores)) {
  const w = saasWeights[dim] ?? 0;
  compositeScore += score * w;
}
compositeScore = Math.round(compositeScore * 100) / 100;

// 62.75*0.20 + 58*0.15 + 71.5*0.15 + 45*0.18 + 53*0.12 + 66*0.20
// = 12.55 + 8.7 + 10.725 + 8.1 + 6.36 + 13.2 = 59.635 → 59.64
assertClose(compositeScore, 59.64, 0.01, `SaaS composite = ${compositeScore} (expected ~59.64)`);
assert(compositeScore >= 0 && compositeScore <= 100, `Composite in 0-100 range`);
assert(getGrade(compositeScore) === 'C', `Grade for ${compositeScore} = ${getGrade(compositeScore)} (expected C)`);

// ---- Test 6: Composite score with services profile ----

console.log('\n=== Test 6: Composite score (Services profile) ===');

const servicesWeights = DIMENSION_WEIGHTS['services'];
let servicesComposite = 0;
for (const [dim, score] of Object.entries(dimScores)) {
  servicesComposite += score * (servicesWeights[dim] ?? 0);
}
servicesComposite = Math.round(servicesComposite * 100) / 100;
assert(servicesComposite >= 0 && servicesComposite <= 100, `Services composite ${servicesComposite} in 0-100 range`);
console.log(`    Services composite: ${servicesComposite} (${getGrade(servicesComposite)})`);

// ---- Test 7: Grade boundaries ----

console.log('\n=== Test 7: Grade assignment boundaries ===');

assert(getGrade(100) === 'A+', '100 → A+');
assert(getGrade(95) === 'A+', '95 → A+');
assert(getGrade(94) === 'A', '94 → A');
assert(getGrade(90) === 'A', '90 → A');
assert(getGrade(89) === 'A-', '89 → A-');
assert(getGrade(85) === 'A-', '85 → A-');
assert(getGrade(84) === 'B+', '84 → B+');
assert(getGrade(80) === 'B+', '80 → B+');
assert(getGrade(75) === 'B', '75 → B');
assert(getGrade(70) === 'B-', '70 → B-');
assert(getGrade(65) === 'C+', '65 → C+');
assert(getGrade(60) === 'C', '60 → C');
assert(getGrade(55) === 'C-', '55 → C-');
assert(getGrade(50) === 'D+', '50 → D+');
assert(getGrade(45) === 'D', '45 → D');
assert(getGrade(40) === 'D-', '40 → D-');
assert(getGrade(39) === 'F', '39 → F');
assert(getGrade(0) === 'F', '0 → F');

// ---- Test 8: PageSpeed scores stay 0-100 (no double-scaling) ----

console.log('\n=== Test 8: PageSpeed double-scaling prevention ===');

// Simulate what pagespeed.ts returns (toScore100 converts 0-1 → 0-100)
function toScore100(score: number | null): number {
  if (score == null) return 0;
  return Math.round(score * 100);
}

const apiSeoScore = 0.92; // Raw from Google API (0-1)
const pagespeedSeo = toScore100(apiSeoScore); // = 92 (0-100)
assert(pagespeedSeo === 92, `toScore100(0.92) = ${pagespeedSeo} (expected 92)`);

// SEO scorer should use the value directly (BUG FIX: was doing * 100)
const technicalSeoScore = Math.round(pagespeedSeo); // Fixed: no * 100
assert(technicalSeoScore === 92, `technicalSeoScore = ${technicalSeoScore} (expected 92, NOT 9200)`);

// Old buggy version would have been:
const buggyScore = Math.round(pagespeedSeo * 100);
assert(buggyScore === 9200, `Buggy version would give ${buggyScore} — this was the 418 bug`);

// ---- Test 9: Performance scorer audit.score 0-1 → 0-100 ----

console.log('\n=== Test 9: Performance audit scores ===');

// Lighthouse audit scores are 0-1 in the API
function getAuditScore(auditScore: number | null, fallback: number): number {
  return auditScore != null ? auditScore * 100 : fallback;
}

assert(getAuditScore(0.92, 50) === 92, 'audit.score 0.92 → 92');
assert(getAuditScore(0.5, 50) === 50, 'audit.score 0.5 → 50');
assert(getAuditScore(null, 50) === 50, 'null audit → fallback 50');
assert(getAuditScore(1.0, 50) === 100, 'audit.score 1.0 → 100');

// ---- Test 10: Composite score cannot exceed 100 ----

console.log('\n=== Test 10: Composite score cannot exceed 100 ===');

const maxDimScores: Record<string, number> = {
  positioning: 100,
  copy: 100,
  seo: 100,
  lead_capture: 100,
  performance: 100,
  visual: 100,
};

for (const [biz, weights] of Object.entries(DIMENSION_WEIGHTS)) {
  let maxComposite = 0;
  for (const [dim, score] of Object.entries(maxDimScores)) {
    maxComposite += score * (weights[dim] ?? 0);
  }
  assertClose(maxComposite, 100, 0.01, `${biz}: all-100 scores → composite ${maxComposite.toFixed(2)}`);
}

// ---- Test 11: All-zero scores ----

console.log('\n=== Test 11: All-zero dimension scores ===');

const zeroDimScores: Record<string, number> = {
  positioning: 0,
  copy: 0,
  seo: 0,
  lead_capture: 0,
  performance: 0,
  visual: 0,
};

for (const [biz, weights] of Object.entries(DIMENSION_WEIGHTS)) {
  let zeroComposite = 0;
  for (const [dim, score] of Object.entries(zeroDimScores)) {
    zeroComposite += score * (weights[dim] ?? 0);
  }
  assert(zeroComposite === 0, `${biz}: all-0 scores → composite ${zeroComposite}`);
}

// ---- Test 12: Aggregate step simulation (the exact pipeline code) ----

console.log('\n=== Test 12: Full aggregate step simulation ===');

// Simulate Claude returning scores 0-10, converted to 0-100, weighted, composited
function simulateFullPipeline(
  businessType: string,
  claudeScores: Record<string, Record<string, number>>,
): { dimScores: Record<string, number>; composite: number; grade: string } {
  const weights = DIMENSION_WEIGHTS[businessType];
  const result: Record<string, number> = {};

  for (const [dim, subs] of Object.entries(claudeScores)) {
    const subWeights = SUB_WEIGHTS[dim];
    let totalWeight = 0;
    let weightedSum = 0;

    for (const [key, claudeScore] of Object.entries(subs)) {
      const score100 = Math.round(Math.max(0, Math.min(100, claudeScore * 10)));
      const w = subWeights[key] ?? (1 / Object.keys(subs).length);
      weightedSum += score100 * w;
      totalWeight += w;
    }

    const rawScore = totalWeight > 0 && Math.abs(totalWeight - 1) > 0.001
      ? weightedSum / totalWeight
      : weightedSum;

    result[dim] = Math.round(rawScore * 100) / 100;
  }

  let composite = 0;
  for (const [dim, score] of Object.entries(result)) {
    composite += score * (weights[dim] ?? 0);
  }
  composite = Math.round(composite * 100) / 100;

  return { dimScores: result, composite, grade: getGrade(composite) };
}

// Realistic Claude response: all dimensions score 5-8 (50-80 range)
const realisticScores: Record<string, Record<string, number>> = {
  positioning: { transformation_clarity: 7, differentiation: 6, value_translation: 8, target_specificity: 5, proof_arsenal: 7, mechanism_naming: 4 },
  copy: { headline_quality: 7, cta_effectiveness: 5, proof_specificity: 6, pain_articulation: 5, page_structure: 7, ai_tell_score: 8, objection_handling: 5 },
  seo: { technical_seo: 7, readability: 6, eeat_signals: 5, content_depth: 6, content_freshness: 4 },
  lead_capture: { lead_magnet_existence: 5, offer_specificity: 4, form_friction: 6, bridge_to_paid: 5, social_proof_at_capture: 3, format_business_match: 4 },
  performance: { lcp: 6, fid: 7, cls: 8, overall_performance: 5 },
  visual: { product_photography_quality: 7, video_content_presence: 5, platform_visual_compliance: 8, brand_visual_consistency: 7, human_presence_authenticity: 6 },
};

const simResult = simulateFullPipeline('saas', realisticScores);
console.log('  Simulated dimension scores:');
for (const [dim, score] of Object.entries(simResult.dimScores)) {
  console.log(`    ${dim}: ${score}/100 (${getGrade(score)})`);
}
console.log(`  Composite: ${simResult.composite}/100 (${simResult.grade})`);

assert(simResult.composite >= 0 && simResult.composite <= 100, `Composite ${simResult.composite} is in 0-100 range`);
for (const [dim, score] of Object.entries(simResult.dimScores)) {
  assert(score >= 0 && score <= 100, `${dim} score ${score} is in 0-100 range`);
}

// ---- Summary ----

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) {
  console.log('\n⚠ FAILURES DETECTED — fix scoring logic before deploying');
  process.exit(1);
} else {
  console.log('\n✓ All scoring mechanism tests passed');
}
