/**
 * Gemini API Image Generation Script
 *
 * Generates all site imagery using Google Gemini's image generation models.
 * Images are saved as static assets to /public/images/generated/.
 *
 * Usage:
 *   npx tsx scripts/generate-images.ts
 *   npx tsx scripts/generate-images.ts --only hero-bg
 *
 * Env:
 *   GEMINI_API_KEY — override the default API key
 */

import fs from "node:fs";
import path from "node:path";

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyC9TbshcJnywo-pAtLuOPpCUUsE7Ky5kS4";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODELS = [
  "gemini-2.0-flash-exp-image-generation",
  "gemini-2.0-flash-exp",
  "gemini-2.0-flash",
];
const OUT_DIR = path.resolve(__dirname, "../public/images/generated");

interface ImageSpec {
  name: string;
  prompt: string;
  width: number;
  height: number;
}

const IMAGE_SPECS: ImageSpec[] = [
  {
    name: "hero-bg",
    prompt:
      "Abstract geometric pattern with interconnected nodes and bridges representing connection between technology and market. Dark gradient background (#1a1a2e to #16213e) with subtle red-coral accent lines (#FF4D4D). Minimal, editorial, premium feel. Clean vector style, no text. 1920x1080 aspect ratio.",
    width: 1920,
    height: 1080,
  },
  {
    name: "headshot-placeholder",
    prompt:
      "Professional silhouette avatar of a confident African woman in business attire, geometric hexagonal frame with warm gradient border from coral-red (#FF4D4D) to dark charcoal (#212529). Minimal, elegant, placeholder style. Dark background. No text. Square format.",
    width: 800,
    height: 800,
  },
  {
    name: "thesis-growth",
    prompt:
      "Minimal abstract icon: a broken rocket ship splitting apart mid-flight, representing premature scaling failure. Clean line-art style, dark charcoal (#212529) strokes on white background. Simple, editorial illustration. No text. Square format.",
    width: 400,
    height: 400,
  },
  {
    name: "thesis-narrative",
    prompt:
      "Minimal abstract icon: an open book transforming into a speech bubble, representing narrative as strategy. Clean line-art style, dark charcoal (#212529) strokes on white background. Simple, editorial illustration. No text. Square format.",
    width: 400,
    height: 400,
  },
  {
    name: "thesis-trust",
    prompt:
      "Minimal abstract icon: a handshake emerging from a shield shape, representing trust as currency. Clean line-art style, dark charcoal (#212529) strokes on white background. Simple, editorial illustration. No text. Square format.",
    width: 400,
    height: 400,
  },
  {
    name: "tool-mockup",
    prompt:
      "Browser window mockup showing a modern dashboard interface with a hexagonal radar chart and circular score gauge. Dark UI theme with coral-red (#FF4D4D) accent highlights. Professional SaaS product screenshot aesthetic. Clean, minimal, data visualization. No readable text. 3:2 aspect ratio.",
    width: 1200,
    height: 800,
  },
  {
    name: "path-audit",
    prompt:
      "Minimal icon: magnifying glass with a checkmark inside, representing free audit/analysis. Clean line-art, coral-red (#FF4D4D) accent on white background. Simple, geometric style. No text. Square format.",
    width: 200,
    height: 200,
  },
  {
    name: "path-playbook",
    prompt:
      "Minimal icon: an open playbook/document with strategy arrows flowing out, representing self-serve actionable guide. Clean line-art, coral-red (#FF4D4D) accent on white background. Simple, geometric style. No text. Square format.",
    width: 200,
    height: 200,
  },
  {
    name: "path-consult",
    prompt:
      "Minimal icon: two people collaborating with connecting nodes between them, representing done-with-you consulting. Clean line-art, coral-red (#FF4D4D) accent on white background. Simple, geometric style. No text. Square format.",
    width: 200,
    height: 200,
  },
  {
    name: "services-hero",
    prompt:
      "Abstract representation of a Go-to-Market Architect at work — architectural blueprint lines overlaid with digital circuit patterns. Professional dark palette (#1a1a2e gradient) with subtle coral-red (#FF4D4D) accent elements. Wide panoramic format, editorial style. No text, no people.",
    width: 1600,
    height: 600,
  },
  {
    name: "service-clarity",
    prompt:
      "Editorial illustration: a compass overlaid on a strategic map with waypoints, representing GTM Clarity and direction-finding. Muted tones with coral-red (#FF4D4D) accent on the compass needle. Clean, professional illustration style. No text. 3:2 aspect ratio.",
    width: 600,
    height: 400,
  },
  {
    name: "service-engine",
    prompt:
      "Editorial illustration: interconnected gears and engine components forming a growth machine, representing Growth Engine building. Muted tones with coral-red (#FF4D4D) accent on key gear. Clean, professional illustration style. No text. 3:2 aspect ratio.",
    width: 600,
    height: 400,
  },
  {
    name: "service-funding",
    prompt:
      "Editorial illustration: a megaphone/spotlight illuminating upward, representing Funding Capitalization and visibility. Muted tones with coral-red (#FF4D4D) accent on the spotlight beam. Clean, professional illustration style. No text. 3:2 aspect ratio.",
    width: 600,
    height: 400,
  },
  {
    name: "about-hero",
    prompt:
      "Warm, professional workspace scene — African tech ecosystem aesthetic. Laptop showing analytics, notebook with sketches, coffee cup, subtle Web3 and fintech visual cues in background. Editorial photography feel, warm lighting, shallow depth of field effect. No readable text. Wide panoramic format.",
    width: 1600,
    height: 600,
  },
  {
    name: "framework-gtm",
    prompt:
      "Professional document cover design: compass overlaid on a strategic map, titled feel. Dark navy background with coral-red (#FF4D4D) geometric accents. Professional report/blueprint cover aesthetic. Clean typography placeholder blocks. 4:3 aspect ratio.",
    width: 800,
    height: 600,
  },
  {
    name: "framework-funding",
    prompt:
      "Professional document cover design: spotlight beam illuminating a stage/platform. Dark navy background with coral-red (#FF4D4D) geometric accents. Professional report/blueprint cover aesthetic. Clean typography placeholder blocks. 4:3 aspect ratio.",
    width: 800,
    height: 600,
  },
  {
    name: "framework-community",
    prompt:
      "Professional document cover design: connected circles forming a network/community pattern. Dark navy background with coral-red (#FF4D4D) geometric accents. Professional report/blueprint cover aesthetic. Clean typography placeholder blocks. 4:3 aspect ratio.",
    width: 800,
    height: 600,
  },
  {
    name: "cta-pattern",
    prompt:
      "Subtle geometric mesh pattern — connecting dots and lines forming a network grid. Very low opacity, works as a section background texture. Dark charcoal (#212529) elements on transparent-style white background. Tileable, minimal. Wide format.",
    width: 1920,
    height: 400,
  },
];

async function generateImage(
  spec: ImageSpec,
  modelIdx = 0
): Promise<Buffer | null> {
  if (modelIdx >= MODELS.length) {
    console.error(`  All models failed for "${spec.name}"`);
    return null;
  }

  const model = MODELS[modelIdx];
  const url = `${BASE_URL}/${model}:generateContent?key=${API_KEY}`;

  console.log(`  Trying model: ${model}`);

  try {
    const body = {
      contents: [
        {
          parts: [
            {
              text: `Generate an image: ${spec.prompt} Image should be ${spec.width}x${spec.height} pixels.`,
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
      console.warn(`  Model ${model} returned ${res.status}: ${errText.slice(0, 200)}`);
      return generateImage(spec, modelIdx + 1);
    }

    const data = await res.json();

    // Extract image data from response
    const candidates = data.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          return Buffer.from(part.inlineData.data, "base64");
        }
      }
    }

    console.warn(`  No image data in response from ${model}`);
    return generateImage(spec, modelIdx + 1);
  } catch (err) {
    console.warn(`  Error with ${model}:`, (err as Error).message);
    return generateImage(spec, modelIdx + 1);
  }
}

async function main() {
  // Parse --only flag
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const onlyName = onlyArg?.split("=")[1];

  const specs = onlyName
    ? IMAGE_SPECS.filter((s) => s.name === onlyName)
    : IMAGE_SPECS;

  if (specs.length === 0) {
    console.error(`No image spec found for "${onlyName}"`);
    console.log("Available:", IMAGE_SPECS.map((s) => s.name).join(", "));
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Generating ${specs.length} images...\n`);

  let success = 0;
  let failed = 0;

  for (const spec of specs) {
    const outPath = path.join(OUT_DIR, `${spec.name}.png`);

    // Skip if already exists (use --force to regenerate)
    if (fs.existsSync(outPath) && !process.argv.includes("--force")) {
      console.log(`[SKIP] ${spec.name}.png (already exists, use --force to overwrite)`);
      success++;
      continue;
    }

    console.log(`[GEN] ${spec.name} (${spec.width}x${spec.height})`);

    const imgBuffer = await generateImage(spec);
    if (imgBuffer) {
      fs.writeFileSync(outPath, imgBuffer);
      console.log(`  Saved: ${outPath} (${(imgBuffer.length / 1024).toFixed(0)} KB)\n`);
      success++;
    } else {
      console.error(`  FAILED: ${spec.name}\n`);
      failed++;
    }

    // Rate limit: 1 second between requests
    if (specs.indexOf(spec) < specs.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\nDone! ${success} succeeded, ${failed} failed.`);
}

main().catch(console.error);
