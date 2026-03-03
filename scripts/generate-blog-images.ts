/**
 * Blog Header Image Generation — Nanobanana x Gemini API
 *
 * Generates header images for 8 blog posts curated along the lead flow:
 * TOFU (Awareness) → MOFU (Education) → BOFU (Conversion)
 *
 * Usage: GEMINI_API_KEY=... npx tsx scripts/generate-blog-images.ts
 */

import fs from "node:fs";
import path from "node:path";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Set GEMINI_API_KEY env var");
  process.exit(1);
}

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-2.0-flash-exp-image-generation";
const OUT_DIR = path.resolve(__dirname, "../public/images/generated/blog");

interface BlogImageSpec {
  name: string;
  funnelStage: string;
  prompt: string;
}

/* ------------------------------------------------------------------ */
/* Nanobanana Prompt Engineering — Blog Header Images                   */
/*                                                                     */
/* Each prompt follows the nanobanana methodology:                     */
/* 1. Precise visual description (what it looks like)                  */
/* 2. Style anchors (what design language to reference)                */
/* 3. Technical constraints (color codes, format, no-gos)             */
/* 4. Emotional direction (what it should FEEL like)                   */
/* 5. Negative prompts (what to explicitly avoid)                      */
/*                                                                     */
/* Brand DNA: #FF4D4D (coral-red accent), #212529 (dark),             */
/* #FFFFFF (white), editorial premium, architectural precision         */
/* ------------------------------------------------------------------ */

const BLOG_IMAGES: BlogImageSpec[] = [
  // ═══ TOFU: AWARENESS ═══
  {
    name: "why-startups-fail-gtm",
    funnelStage: "TOFU",
    prompt:
      "Create an editorial illustration for a business article about startup failure. " +
      "VISUAL: A fractured rocket ship mid-flight, splitting apart into geometric shards and fragments. " +
      "The rocket is rendered in flat vector style with bold coral-red (#FF4D4D) as the primary color. " +
      "Fragments scatter outward against a deep charcoal (#212529) background. " +
      "Small data points and dotted trajectory lines trail behind the rocket like a failed flight path. " +
      "STYLE: Inspired by editorial illustrations in Harvard Business Review and The Economist. " +
      "Flat geometric shapes, no gradients, no 3D. Think Malika Favre meets data visualization. " +
      "COMPOSITION: Landscape 16:9 ratio. Rocket enters from bottom-left, fragments scatter toward top-right. " +
      "Clean negative space on the right third for potential text overlay. " +
      "COLOR: Coral-red (#FF4D4D) rocket on charcoal (#212529) background. White (#FFFFFF) accent lines and dots. " +
      "FEEL: Dramatic but analytical. Not sad — diagnostic. Like a postmortem, not a funeral. " +
      "DO NOT include text, words, numbers, human figures, realistic textures, gradients, or photographic elements.",
  },
  {
    name: "narrative-gap",
    funnelStage: "TOFU",
    prompt:
      "Create an editorial illustration about the gap between innovation and market communication. " +
      "VISUAL: Two geometric landmasses separated by a deep chasm. The left landmass is built from circuit board " +
      "patterns, code brackets, and technical symbols in white. The right landmass is made of speech bubbles, " +
      "megaphones, and audience silhouettes in coral-red (#FF4D4D). Between them, a single thin bridge " +
      "made of dotted lines stretches across but is visibly incomplete — missing its middle section. " +
      "STYLE: Flat vector editorial illustration. Inspired by the New York Times opinion section illustrations. " +
      "Geometric, minimal, high contrast. No gradients, no textures, no photorealism. " +
      "COMPOSITION: Landscape 16:9. Symmetrical split composition with the gap prominently in the center. " +
      "Dark charcoal (#212529) background representing the void between tech and market. " +
      "COLOR: White and light gray for the tech side, coral-red (#FF4D4D) for the market side, " +
      "charcoal (#212529) background. Clean two-tone palette. " +
      "FEEL: Thought-provoking. The visual tension of the gap should make viewers feel the disconnect. " +
      "Strategic, not emotional. Like an infographic in a McKinsey report. " +
      "DO NOT include text, human faces, realistic imagery, 3D effects, gradients, or decorative flourishes.",
  },

  // ═══ MOFU: EDUCATION ═══
  {
    name: "6-dimensions-gtm",
    funnelStage: "MOFU",
    prompt:
      "Create an editorial illustration of a hexagonal framework diagram. " +
      "VISUAL: A large regular hexagon (pointy-top) in the center, divided into 6 equal triangular segments " +
      "radiating from the center point to each vertex. Each segment is a slightly different shade of coral-red, " +
      "from light (#FF8080) to bold (#FF4D4D) to deep (#CC3D3D), creating a subtle gradient wheel effect. " +
      "Thin white lines separate each segment. Small iconic symbols float near each vertex: " +
      "a compass (positioning), a pen nib (copy), a magnifying glass (SEO), a magnet (lead capture), " +
      "a speedometer (performance), an eye (visual). Connected by thin dotted white lines to the hexagon. " +
      "STYLE: Clean data visualization aesthetic. Inspired by Information is Beautiful by David McCandless. " +
      "Flat vector, geometric precision, Swiss design influence. No 3D, no shadows. " +
      "COMPOSITION: Landscape 16:9. Hexagon centered, icons orbiting at the vertices, generous dark space. " +
      "Background: deep charcoal (#212529). The hexagon glows subtly with a faint coral aura. " +
      "FEEL: Systematic, authoritative, premium. Like a framework diagram in a Bain & Company strategy deck. " +
      "DO NOT include text labels, numbers, human figures, photorealistic elements, gradients, or textures.",
  },
  {
    name: "what-is-gtm-readiness",
    funnelStage: "MOFU",
    prompt:
      "Create an editorial illustration about business readiness assessment. " +
      "VISUAL: A large circular gauge or meter rendered in flat vector style, viewed straight-on. " +
      "The gauge arc goes from empty (left, gray) to full (right, coral-red #FF4D4D). " +
      "The needle points to approximately 70%, suggesting 'good but improvable'. " +
      "Behind the gauge, a subtle grid of small hexagonal cells creates a honeycomb pattern, " +
      "with some cells filled in coral-red and others empty in dark gray, like a progress matrix. " +
      "STYLE: Dashboard UI meets editorial illustration. Inspired by Dieter Rams' functionalism " +
      "crossed with Bloomberg Terminal aesthetics. Clean, precise, data-driven. " +
      "COMPOSITION: Landscape 16:9. Gauge centered and dominant. Honeycomb grid extends behind as texture. " +
      "Background: charcoal (#212529) with very subtle dark grid lines. " +
      "COLOR: Coral-red (#FF4D4D) for filled elements, dark gray (#3a3a3a) for empty, " +
      "white (#FFFFFF) for the needle and key accent marks. " +
      "FEEL: Analytical precision. Like looking at a high-stakes instrument panel. " +
      "Communicates measurement, assessment, and potential. " +
      "DO NOT include text, numbers, human figures, 3D effects, gradients, or decorative elements.",
  },
  {
    name: "positioning-vs-marketing",
    funnelStage: "MOFU",
    prompt:
      "Create an editorial illustration contrasting positioning strategy with generic marketing. " +
      "VISUAL: Two abstract arrows pointing upward. The left arrow is scattered, fragmented into " +
      "dozens of thin splinters going in slightly different directions — representing unfocused marketing. " +
      "Rendered in gray (#777777). The right arrow is a single bold, precise, thick arrow pointing " +
      "straight up — representing focused positioning. Rendered in coral-red (#FF4D4D). " +
      "The contrast should be stark: chaos vs clarity, noise vs signal. " +
      "STYLE: Minimal editorial illustration. Inspired by Otl Aicher's Munich Olympics iconography — " +
      "pure geometric reduction. Absolute minimum visual elements to communicate the concept. " +
      "COMPOSITION: Landscape 16:9. The two arrows are side by side with equal space. " +
      "A subtle vertical dividing line (very thin, white) separates them. " +
      "Background: charcoal (#212529). " +
      "COLOR: Gray (#777777) for scattered arrow, coral-red (#FF4D4D) for focused arrow, " +
      "white accent line. Three colors maximum. " +
      "FEEL: The 'aha moment' of clarity. Should make the viewer immediately get the difference. " +
      "Strategic simplicity. Like a single slide that wins a board meeting. " +
      "DO NOT include text, labels, human figures, 3D effects, gradients, backgrounds textures.",
  },

  // ═══ BOFU: CONVERSION ═══
  {
    name: "gtm-audit-scoring",
    funnelStage: "BOFU",
    prompt:
      "Create an editorial illustration of an AI-powered analysis process. " +
      "VISUAL: A stylized browser window frame (simple rectangle with three dots at top-left) containing " +
      "an abstract dashboard view. Inside the browser: a large hexagonal radar chart in the center with " +
      "6 data points connected by lines, creating an irregular polygon shape. " +
      "Around it, small card-like rectangles with abstract bar charts and line graphs suggest scoring metrics. " +
      "Thin scanning lines sweep across the dashboard like a real-time analysis in progress. " +
      "STYLE: Product UI illustration. Inspired by Linear and Vercel's marketing imagery — " +
      "dark mode UI, glowing accent elements, precise grid alignment. " +
      "COMPOSITION: Landscape 16:9. Browser window centered, slightly tilted at 2-3 degrees " +
      "for dynamic feel. Subtle glow behind the browser on charcoal background. " +
      "COLOR: Charcoal (#212529) background and browser chrome. Coral-red (#FF4D4D) for the radar chart " +
      "polygon and accent elements. White (#FFFFFF) for grid lines and text placeholders. " +
      "Faint coral glow/bloom behind the radar chart. " +
      "FEEL: High-tech, precise, trustworthy. Like a premium SaaS product screenshot " +
      "from a YC Demo Day pitch. Makes you want to try the tool. " +
      "DO NOT include readable text, real UI elements, human figures, 3D effects, or photorealism.",
  },
  {
    name: "website-grader-vs-gtm",
    funnelStage: "BOFU",
    prompt:
      "Create an editorial illustration comparing a shallow analysis to a deep one. " +
      "VISUAL: Two rectangular panels side by side. LEFT panel: A simple flat webpage outline with " +
      "a single checkmark — representing a basic website grader. Rendered in muted gray, feels incomplete. " +
      "RIGHT panel: The same webpage outline but with multiple analytical layers stacked behind it " +
      "in slight offset (like cards in a deck), each layer representing a different dimension of analysis. " +
      "The layers glow with coral-red (#FF4D4D) edges. A hexagonal badge overlays the stack. " +
      "STYLE: Comparison infographic style. Inspired by Apple's product comparison pages — " +
      "clean, decisive, making the winner obvious through visual weight. Flat vector only. " +
      "COMPOSITION: Landscape 16:9. Two panels evenly split. Subtle 'vs' implied by composition " +
      "without any text. Right panel should have more visual weight and warmth. " +
      "COLOR: Left panel in grays (#777777, #aaaaaa). Right panel in coral-red (#FF4D4D) with " +
      "white accents on charcoal (#212529) background. " +
      "FEEL: The comparison should feel obvious — one is clearly more thorough. " +
      "Not adversarial, just clear. Like choosing between a stethoscope and a full MRI. " +
      "DO NOT include text, brand logos, human figures, gradients, 3D effects, or decorative elements.",
  },
  {
    name: "improve-gtm-score",
    funnelStage: "BOFU",
    prompt:
      "Create an editorial illustration about growth and improvement through optimization. " +
      "VISUAL: An ascending staircase made of hexagonal blocks, climbing from bottom-left to top-right. " +
      "Each step is slightly larger and more vibrant than the last, progressing from dark gray at the bottom " +
      "to bold coral-red (#FF4D4D) at the top. Small upward-pointing chevrons (like progress indicators) " +
      "float beside each step. At the top step, a simple geometric star or spark symbol suggests achievement. " +
      "The steps cast subtle geometric shadows downward. " +
      "STYLE: Motivational data visualization. Inspired by Duolingo's progress illustrations " +
      "crossed with architectural precision of Isometric studio. Clean vector, geometric. " +
      "COMPOSITION: Landscape 16:9. Staircase rises diagonally from lower-left to upper-right. " +
      "Clean charcoal (#212529) background. Generous breathing room at top-right. " +
      "COLOR: Gradient progression from dark gray (#3a3a3a) through medium (#777777) " +
      "to coral-red (#FF4D4D). White chevrons and spark. " +
      "FEEL: Achievable progress. Not a giant leap — steady, systematic improvement. " +
      "Each step feels earned. Inspires action without overwhelming. " +
      "DO NOT include text, numbers, human figures, 3D rendering, photorealistic textures, or gradients within shapes.",
  },
];

async function generateImage(spec: BlogImageSpec): Promise<Buffer | null> {
  const url = `${BASE_URL}/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    const body = {
      contents: [
        {
          parts: [
            {
              text: `Generate an image: ${spec.prompt} Image should be 1200x630 pixels (landscape blog header), high resolution, clean vector-style rendering.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`  API returned ${res.status}: ${errText.slice(0, 300)}`);
      return null;
    }

    const data = await res.json();
    const candidates = data.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          return Buffer.from(part.inlineData.data, "base64");
        }
      }
    }

    console.warn("  No image data in response");
    return null;
  } catch (err) {
    console.error("  Error:", (err as Error).message);
    return null;
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log("Blog Header Image Generation — Nanobanana x Gemini\n");
  console.log(`Generating ${BLOG_IMAGES.length} blog headers...\n`);

  for (const spec of BLOG_IMAGES) {
    const outPath = path.join(OUT_DIR, `${spec.name}.png`);

    // Skip if already generated
    if (fs.existsSync(outPath)) {
      console.log(`[SKIP] ${spec.name} (already exists)`);
      continue;
    }

    console.log(`[GEN] ${spec.funnelStage} | ${spec.name}`);

    const imgBuffer = await generateImage(spec);
    if (imgBuffer) {
      fs.writeFileSync(outPath, imgBuffer);
      console.log(
        `  ✓ Saved: ${spec.name}.png (${(imgBuffer.length / 1024).toFixed(0)} KB)\n`
      );
    } else {
      console.error(`  ✗ FAILED: ${spec.name}\n`);
    }

    // Rate limit: 2s between requests
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(
    "\nDone! Check /public/images/generated/blog/ for header images."
  );
}

main().catch(console.error);
