/**
 * SN Logo Generation — Nanobanana Prompt Engineering + Gemini API
 *
 * Generates multiple SN monogram variants using studio-quality prompts
 * crafted with the nanobanana methodology: hyper-specific, art-directed,
 * referencing real design principles.
 *
 * Usage: npx tsx scripts/generate-logo.ts
 */

import fs from "node:fs";
import path from "node:path";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY env var is required");
  process.exit(1);
}
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-2.0-flash-exp-image-generation";
const OUT_DIR = path.resolve(__dirname, "../public/images/generated");

/* ------------------------------------------------------------------ */
/* Nanobanana Prompt Engineering                                       */
/*                                                                     */
/* Each prompt is crafted with:                                        */
/* 1. Precise visual description (what it looks like)                  */
/* 2. Style anchors (what design language to reference)                */
/* 3. Technical constraints (color codes, no-gos, format)             */
/* 4. Emotional direction (what it should FEEL like)                   */
/* 5. Negative prompts (what to explicitly avoid)                      */
/*                                                                     */
/* Brand DNA:                                                          */
/* - Sylvia Ndunge — Go-to-Market Architect                           */
/* - Premium editorial x architectural precision                       */
/* - Bridges tech innovation to market traction                        */
/* - Palette: #FF4D4D (bold red), #212529 (dark), #FFFFFF (white)     */
/* - Hexagonal motif (from GTM-6 radar chart)                         */
/* ------------------------------------------------------------------ */

interface LogoSpec {
  name: string;
  prompt: string;
}

const LOGO_VARIANTS: LogoSpec[] = [
  {
    name: "sn-logo-geometric",
    prompt:
      'Design a professional monogram logo mark for the letters "S" and "N". ' +
      "DESIGN DIRECTION: The S and N are constructed from clean geometric shapes. " +
      "The S is built from two opposing arcs and the N from angular strokes. " +
      "They share a central vertical stroke, creating an interlocking form where " +
      "one letter flows seamlessly into the other. The shared structure symbolizes " +
      "bridging (connecting technology to market). " +
      "STYLE: Flat vector logo design. Inspired by the geometric precision of Paul Rand, " +
      "the boldness of Massimo Vignelli, and the modern minimalism of Pentagram identity work. " +
      "Think architectural blueprint meets editorial masthead. " +
      "COLOR: Single color bold coral-red (#FF4D4D) on a pure white background. " +
      "No gradients, no shadows, no outlines, no 3D effects. Solid filled shapes only. " +
      "CONSTRAINTS: Square canvas with the monogram centered and adequate padding around it " +
      "(at least 15% margin). Must be legible at small sizes and look premium at large scale. " +
      "No additional text, no taglines, no decorative elements, no circles or frames. " +
      "Just the pure letterforms. " +
      "FEEL: Confident, strategic, premium. Like the logo of a high-end architecture firm " +
      "or a Monocle magazine masthead. Not playful, not techy, not corporate-generic. " +
      "DO NOT include any text other than S and N, any background patterns, any gradients, " +
      "any 3D effects, any generic clip-art style elements.",
  },
  {
    name: "sn-logo-hex",
    prompt:
      'Design a professional monogram logo mark: the letters "S" and "N" ' +
      "contained within a subtle hexagonal frame. " +
      "DESIGN DIRECTION: A regular hexagon (pointy-top orientation) forms the outer boundary. " +
      "Inside, the letters S and N are rendered in a bold, geometric sans-serif style. " +
      "The S on the left flowing into the N on the right, sharing visual weight. " +
      "The hexagon references a six-dimensional strategic framework. The letters should feel " +
      "structural and intentional, like they were built by an architect. " +
      "STYLE: Flat vector logo. Clean modernist aesthetic inspired by Aaron Draplin bold simplicity " +
      "crossed with Swiss design sophistication. The hexagon border should be the same weight " +
      "as the letter strokes for visual harmony. " +
      "COLOR: Bold coral-red (#FF4D4D) for the entire mark (letters + hex frame) on pure white " +
      "background. Single flat color, no gradients, no shadows. " +
      "CONSTRAINTS: Square canvas, hexagon centered, at least 10% padding. The hexagon should " +
      "be subtle, not overwhelming the letters. Must read clearly at small sizes (favicon, app icon). " +
      "No additional text, decoration, or embellishment. " +
      "FEEL: Strategic, precise, premium. Like a mark you would see embossed on a leather-bound " +
      "strategy document. Conveys authority and clarity. " +
      "DO NOT include multiple colors, gradients, 3D effects, background textures, additional shapes, " +
      "taglines, or any decorative flourishes.",
  },
  {
    name: "sn-logo-monoline",
    prompt:
      'Design a professional monogram logo mark: the letters "S" and "N" ' +
      "drawn in a single continuous line. " +
      "DESIGN DIRECTION: One unbroken stroke traces both letters. Starting at the top of the S, " +
      "flowing through its curves, then transitioning seamlessly into the angular strokes of the N " +
      "without lifting the pen. The continuous line represents the unbroken connection between " +
      "innovation and market. The line weight should be medium-bold, confident not delicate. " +
      "STYLE: Monoline logo design. Inspired by the elegant simplicity of luxury brand monograms " +
      "but with a more geometric, modernist edge. Think the clean confidence of Bloomberg or " +
      "McKinsey branding. Not calligraphic but geometric and precise. " +
      "COLOR: Bold coral-red (#FF4D4D) single-weight stroke on pure white background. " +
      "No fills, no gradients, just the one continuous line forming both letters. " +
      "CONSTRAINTS: Square canvas, centered, generous padding. The stroke should be uniform width " +
      "throughout. Must be recognizable as SN at a glance. Must work at 32px favicon size and at " +
      "billboard scale. No additional elements whatsoever. " +
      "FEEL: Fluid yet structured. Elegant yet bold. Like a signature distilled to its purest " +
      "geometric form. Communicates connection and strategy. " +
      "DO NOT include multiple line weights, fills, shadows, additional shapes, decorative elements, " +
      "background patterns, or any text beyond S and N.",
  },
];

async function generateLogo(spec: LogoSpec): Promise<Buffer | null> {
  const url = `${BASE_URL}/${MODEL}:generateContent?key=${API_KEY}`;

  try {
    const body = {
      contents: [
        {
          parts: [
            {
              text: `Generate an image: ${spec.prompt} Image should be 1024x1024 pixels, high resolution, clean vector-style rendering.`,
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

  console.log("SN Logo Generation — Nanobanana x Gemini\n");
  console.log(`Generating ${LOGO_VARIANTS.length} variants...\n`);

  for (const spec of LOGO_VARIANTS) {
    const outPath = path.join(OUT_DIR, `${spec.name}.png`);
    console.log(`[GEN] ${spec.name}`);

    const imgBuffer = await generateLogo(spec);
    if (imgBuffer) {
      fs.writeFileSync(outPath, imgBuffer);
      console.log(
        `  Saved: ${spec.name}.png (${(imgBuffer.length / 1024).toFixed(0)} KB)\n`
      );
    } else {
      console.error(`  FAILED: ${spec.name}\n`);
    }

    // Rate limit between requests
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(
    "\nDone! Check /public/images/generated/ for sn-logo-*.png variants."
  );
}

main().catch(console.error);
