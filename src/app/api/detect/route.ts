// ---------------------------------------------------------------------------
// POST /api/detect — AI-powered website classification
// ---------------------------------------------------------------------------
// Fetches a URL's homepage, parses key signals with cheerio, and sends them
// to Gemini 2.0 Flash for business classification. Returns structured data
// the audit intake page uses to pre-fill smart cards.
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractJson } from '@/lib/scoring/json-repair';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const requestSchema = z.object({
  url: z
    .string()
    .min(1)
    .transform((val) => {
      const trimmed = val.trim();
      if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
      return trimmed;
    }),
});

// ---------------------------------------------------------------------------
// Social link detection (inline — same patterns as src/lib/crawl/social.ts)
// ---------------------------------------------------------------------------

const SOCIAL_PATTERNS: { platform: string; regex: RegExp }[] = [
  { platform: 'linkedin', regex: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/[^/?#\s"']+/gi },
  { platform: 'twitter', regex: /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/(?!intent|share|search|hashtag|i|home)[^/?#\s"']+/gi },
  { platform: 'instagram', regex: /https?:\/\/(?:www\.)?instagram\.com\/(?!p|reel|explore|accounts|stories)[^/?#\s"']+/gi },
  { platform: 'youtube', regex: /https?:\/\/(?:www\.)?youtube\.com\/(?:@|c\/|channel\/|user\/)[^/?#\s"']+/gi },
  { platform: 'tiktok', regex: /https?:\/\/(?:www\.)?tiktok\.com\/@[^/?#\s"']+/gi },
  { platform: 'facebook', regex: /https?:\/\/(?:www\.)?facebook\.com\/(?!sharer|share|dialog|plugins|pages|groups|events|profile\.php)[^/?#\s"']+/gi },
  { platform: 'github', regex: /https?:\/\/(?:www\.)?github\.com\/(?!features|marketplace|explore|topics|trending|collections|events|sponsors|settings|notifications|login|signup|about|pricing|security|enterprise)[^/?#\s"']+/gi },
];

function extractSocialLinks(html: string): string[] {
  const found = new Set<string>();
  for (const { regex } of SOCIAL_PATTERNS) {
    // Reset regex state
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      // Clean trailing slashes and backslashes
      found.add(match[0].replace(/[\\/]+$/, ''));
    }
  }
  return [...found].slice(0, 10);
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FETCH_TIMEOUT_MS = 10_000;

const BUSINESS_TYPES = ['saas', 'ecommerce', 'marketplace', 'services', 'info_product', 'enterprise'] as const;
const INDUSTRIES = [
  'technology', 'fintech', 'healthcare', 'ecommerce_retail', 'education',
  'real_estate', 'legal', 'marketing', 'hr_recruiting', 'manufacturing',
  'nonprofit', 'media', 'other',
] as const;

// ---------------------------------------------------------------------------
// Gemini prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a website classification expert. Given extracted signals from a website homepage, determine:
1. business_type — one of: ${BUSINESS_TYPES.join(', ')}
2. industry — one of: ${INDUSTRIES.join(', ')}
3. target_audience — 1-2 sentence description of who this business serves
4. competitors — up to 3 competitor domain names (just domains, no https://)
5. confidence — 0 to 1, how confident you are in the classification

Respond ONLY with valid JSON in this exact format:
{
  "business_type": "saas",
  "industry": "technology",
  "target_audience": "B2B SaaS founders looking to scale revenue",
  "competitors": ["competitor1.com", "competitor2.com"],
  "confidence": 0.85
}`;

// ---------------------------------------------------------------------------
// Response type
// ---------------------------------------------------------------------------

export interface DetectResponse {
  business_type: string;
  industry: string;
  target_audience: string;
  social_links: string[];
  competitors: string[];
  meta_title: string;
  meta_description: string;
  confidence: number;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 },
      );
    }

    const { url } = parsed.data;

    // 1. Fetch homepage
    let html: string;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SylvaPointBot/1.0; +https://sylvapoint.com)',
          Accept: 'text/html',
        },
        redirect: 'follow',
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Could not reach website' },
          { status: 502 },
        );
      }

      html = await response.text();
    } catch {
      return NextResponse.json(
        { error: 'Could not reach website' },
        { status: 502 },
      );
    }

    // 2. Parse with cheerio
    const $ = cheerio.load(html);

    const metaTitle = $('title').first().text().trim().slice(0, 200);
    const metaDescription = ($('meta[name="description"]').attr('content') || '').trim().slice(0, 300);
    const ogTitle = ($('meta[property="og:title"]').attr('content') || '').trim();
    const ogDescription = ($('meta[property="og:description"]').attr('content') || '').trim();

    const headlines: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 2 && text.length < 300) headlines.push(text);
    });

    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 2000);

    const ctas: string[] = [];
    const ctaPattern = /\b(get started|sign up|start free|try|buy|subscribe|book|schedule|contact|request|demo|download|join|register|learn more|start now|free trial)\b/i;
    $('a, button').each((_, el) => {
      const text = $(el).text().trim();
      if (ctaPattern.test(text) && text.length < 100) ctas.push(text);
    });

    // Social links from HTML
    const socialLinks = extractSocialLinks(html);

    // 3. Call Gemini
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    let geminiResult: { business_type: string; industry: string; target_audience: string; competitors: string[]; confidence: number } | null = null;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        });

        const userPrompt = `Classify this website:

URL: ${url}
Title: ${metaTitle}
Meta Description: ${metaDescription}
OG Title: ${ogTitle}
OG Description: ${ogDescription}

Headlines (first 20):
${headlines.slice(0, 20).map((h, i) => `${i + 1}. ${h}`).join('\n')}

CTAs found: ${ctas.slice(0, 15).join(', ')}

Body text (excerpt):
${bodyText}`;

        const result = await model.generateContent(
          SYSTEM_PROMPT + '\n\n' + userPrompt,
        );

        const responseText = result.response.text();
        const parsed = extractJson(responseText) as Record<string, unknown>;

        geminiResult = {
          business_type: BUSINESS_TYPES.includes(parsed.business_type as typeof BUSINESS_TYPES[number])
            ? (parsed.business_type as string)
            : 'services',
          industry: INDUSTRIES.includes(parsed.industry as typeof INDUSTRIES[number])
            ? (parsed.industry as string)
            : 'other',
          target_audience: typeof parsed.target_audience === 'string' ? parsed.target_audience : '',
          competitors: Array.isArray(parsed.competitors)
            ? (parsed.competitors as string[]).filter((c) => typeof c === 'string').slice(0, 3)
            : [],
          confidence: typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
        };
      } catch (err) {
        console.warn('[detect] Gemini call failed:', err instanceof Error ? err.message : err);
        // Fall through — return defaults
      }
    }

    // 4. Build response
    const response: DetectResponse = {
      business_type: geminiResult?.business_type ?? 'services',
      industry: geminiResult?.industry ?? 'other',
      target_audience: geminiResult?.target_audience ?? '',
      social_links: socialLinks,
      competitors: geminiResult?.competitors ?? [],
      meta_title: metaTitle,
      meta_description: metaDescription,
      confidence: geminiResult?.confidence ?? 0,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('[detect] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Detection failed' },
      { status: 500 },
    );
  }
}
