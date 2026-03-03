/**
 * Nano Banana Illustration Generator — Gemini Image Generation
 *
 * Generates unique editorial illustrations for each audit dimension
 * based on its score and summary. Each dimension × mood band produces
 * a distinct visual that feels intentional and premium.
 */

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODELS = [
  'gemini-2.0-flash-exp-image-generation',
  'gemini-2.0-flash-exp',
];

type MoodBand = 'failing' | 'mediocre' | 'strong';

function getMoodBand(score: number): MoodBand {
  if (score < 45) return 'failing';
  if (score < 70) return 'mediocre';
  return 'strong';
}

interface DimensionPromptSet {
  label: string;
  failing: string;
  mediocre: string;
  strong: string;
}

const DIMENSION_PROMPTS: Record<string, DimensionPromptSet> = {
  positioning: {
    label: 'Positioning & Messaging',
    failing:
      'An editorial illustration of a broken compass surrounded by dense fog and fragmented geometric shapes. ' +
      'The compass needle spins aimlessly. Muted reds and grays dominate. Shattered glass fragments float in space. ' +
      'Dark moody background (#1a1a2e). Accents in coral-red (#FF4D4D). Style: editorial magazine illustration, ' +
      'flat vector with subtle grain texture. No text, no words, no letters.',
    mediocre:
      'An editorial illustration of a compass emerging from amber mist, needle wavering between two directions. ' +
      'Geometric shapes partially form a path but gaps remain. Warm amber and copper tones. ' +
      'Dark background (#1a1a2e) with warm amber (#F59E0B) accents. Style: editorial magazine illustration, ' +
      'flat vector with subtle grain texture. No text, no words, no letters.',
    strong:
      'An editorial illustration of a precise compass with a confident needle pointing true north, ' +
      'surrounded by clean crystalline geometric shapes forming a clear path. Cool confident blues and greens. ' +
      'Dark background (#1a1a2e) with emerald (#10B981) and coral (#FF4D4D) accents. ' +
      'Style: editorial magazine illustration, flat vector with subtle grain texture. No text, no words, no letters.',
  },
  copy: {
    label: 'Copy Effectiveness',
    failing:
      'An editorial illustration of scattered, crumpled paper sheets falling through dark space, ' +
      'words dissolving into illegible fragments. A broken quill pen with ink splattering chaotically. ' +
      'Muted reds and dark grays. Dark background (#1a1a2e) with coral-red (#FF4D4D) accents. ' +
      'Style: editorial magazine illustration, flat vector with grain. No text, no words, no letters.',
    mediocre:
      'An editorial illustration of a half-written scroll with a quill pen poised mid-stroke. ' +
      'Some words are crisp, others fade into ambiguity. Warm amber light illuminates partially. ' +
      'Dark background (#1a1a2e) with amber (#F59E0B) accents. Style: editorial magazine illustration, ' +
      'flat vector with grain. No text, no words, no letters.',
    strong:
      'An editorial illustration of a perfectly balanced quill pen creating flowing, confident ink strokes ' +
      'that form elegant abstract patterns. Crystal-clear luminous lines radiate outward. ' +
      'Dark background (#1a1a2e) with emerald (#10B981) and coral (#FF4D4D) accents. ' +
      'Style: editorial magazine illustration, flat vector with grain. No text, no words, no letters.',
  },
  seo: {
    label: 'SEO & Content',
    failing:
      'An editorial illustration of a dim lighthouse with no beam, surrounded by thick fog over dark water. ' +
      'Ships drift aimlessly in the distance, unable to find the shore. Muted reds and deep grays. ' +
      'Dark background (#1a1a2e) with coral-red (#FF4D4D) accents. ' +
      'Style: editorial magazine illustration, flat vector with grain. No text, no words, no letters.',
    mediocre:
      'An editorial illustration of a lighthouse with a flickering, weak beam cutting through amber haze. ' +
      'Some ships are finding direction, others still drift. Warm transitional tones. ' +
      'Dark background (#1a1a2e) with amber (#F59E0B) accents. Style: editorial magazine illustration, ' +
      'flat vector with grain. No text, no words, no letters.',
    strong:
      'An editorial illustration of a powerful lighthouse with a brilliant beam sweeping across clear waters. ' +
      'Ships follow the light in perfect formation. Clean geometric rays radiate confidently. ' +
      'Dark background (#1a1a2e) with emerald (#10B981) and coral (#FF4D4D) accents. ' +
      'Style: editorial magazine illustration, flat vector with grain. No text, no words, no letters.',
  },
  lead_capture: {
    label: 'Lead Capture',
    failing:
      'An editorial illustration of an open net with gaping holes, letting glowing orbs (leads) fall through ' +
      'into a dark void below. The net is frayed and torn. Muted reds and grays. ' +
      'Dark background (#1a1a2e) with coral-red (#FF4D4D) accents. ' +
      'Style: editorial magazine illustration, flat vector with grain. No text, no words, no letters.',
    mediocre:
      'An editorial illustration of a partially repaired net catching some glowing orbs while others slip through. ' +
      'A hand reaches to patch the remaining gaps. Warm amber tones. ' +
      'Dark background (#1a1a2e) with amber (#F59E0B) accents. Style: editorial magazine illustration, ' +
      'flat vector with grain. No text, no words, no letters.',
    strong:
      'An editorial illustration of a perfectly woven geometric net gathering streams of glowing orbs with precision. ' +
      'Every orb is captured and flows into a crystalline collection vessel. Cool confident tones. ' +
      'Dark background (#1a1a2e) with emerald (#10B981) and coral (#FF4D4D) accents. ' +
      'Style: editorial magazine illustration, flat vector with grain. No text, no words, no letters.',
  },
  performance: {
    label: 'Performance',
    failing:
      'An editorial illustration of a stalled engine with gears grinding, sparks flying, and smoke billowing. ' +
      'A speedometer needle stuck near zero. Mechanical parts scattered and disconnected. ' +
      'Dark background (#1a1a2e) with coral-red (#FF4D4D) accents. ' +
      'Style: editorial magazine illustration, flat vector with grain. No text, no words, no letters.',
    mediocre:
      'An editorial illustration of an engine warming up, gears partially meshed, speedometer needle climbing slowly. ' +
      'Some parts running smoothly, others need adjustment. Warm amber glow from the machinery. ' +
      'Dark background (#1a1a2e) with amber (#F59E0B) accents. Style: editorial magazine illustration, ' +
      'flat vector with grain. No text, no words, no letters.',
    strong:
      'An editorial illustration of a finely-tuned engine running at peak performance, all gears perfectly synchronized. ' +
      'Speedometer at maximum. Clean energy radiates outward in precise geometric patterns. ' +
      'Dark background (#1a1a2e) with emerald (#10B981) and coral (#FF4D4D) accents. ' +
      'Style: editorial magazine illustration, flat vector with grain. No text, no words, no letters.',
  },
  visual: {
    label: 'Visual & Creative',
    failing:
      'An editorial illustration of a shattered prism that fails to refract light, producing only dim, muddy colors. ' +
      'Broken geometric shapes lie scattered in darkness. Visual chaos and discord. ' +
      'Dark background (#1a1a2e) with coral-red (#FF4D4D) accents. ' +
      'Style: editorial magazine illustration, flat vector with grain. No text, no words, no letters.',
    mediocre:
      'An editorial illustration of a prism partially refracting light into muted, incomplete spectrum bands. ' +
      'Some colors are vivid, others are washed out. The composition is emerging but unfinished. ' +
      'Dark background (#1a1a2e) with amber (#F59E0B) accents. Style: editorial magazine illustration, ' +
      'flat vector with grain. No text, no words, no letters.',
    strong:
      'An editorial illustration of a brilliant prism splitting light into a full, vivid spectrum. ' +
      'Perfect geometric color bands radiate with clarity and confidence. Harmonious visual composition. ' +
      'Dark background (#1a1a2e) with emerald (#10B981) and coral (#FF4D4D) accents. ' +
      'Style: editorial magazine illustration, flat vector with grain. No text, no words, no letters.',
  },
};

/**
 * Generate an illustration for a specific audit dimension.
 * Returns a PNG Buffer or null if generation fails.
 */
export async function generateDimensionIllustration(
  dimensionKey: string,
  score: number,
  summaryFree: string
): Promise<Buffer | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[illustrations] GEMINI_API_KEY not set, skipping generation');
    return null;
  }

  const prompts = DIMENSION_PROMPTS[dimensionKey];
  if (!prompts) {
    console.warn(`[illustrations] Unknown dimension: ${dimensionKey}`);
    return null;
  }

  const mood = getMoodBand(score);
  const basePrompt = prompts[mood];

  // Append summary for specificity — truncate to avoid prompt bloat
  const contextSnippet = summaryFree.slice(0, 200);
  const fullPrompt =
    `Generate an image (800x500 pixels): ${basePrompt} ` +
    `Context for this specific audit: ${contextSnippet}`;

  // Try each model in fallback chain
  for (const model of MODELS) {
    try {
      const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[illustrations] ${model} returned ${res.status}: ${errText.slice(0, 200)}`);
        continue;
      }

      const data = await res.json();
      const candidates = data.candidates || [];
      for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            return Buffer.from(part.inlineData.data, 'base64');
          }
        }
      }

      console.warn(`[illustrations] ${model} returned no image data for ${dimensionKey}`);
    } catch (err) {
      console.warn(`[illustrations] ${model} error for ${dimensionKey}:`, (err as Error).message);
    }
  }

  return null;
}
