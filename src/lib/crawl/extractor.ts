// ---------------------------------------------------------------------------
// Rule-Based Content Extractor — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Parses crawled markdown and HTML into structured content signals using
// regex-based pattern matching. No external parsing libraries or LLMs.
// ---------------------------------------------------------------------------

import type {
  CrawlExtraction,
  Headline,
  FormAnalysis,
  FormField,
  ImageData,
  VideoEmbed,
  Quote,
  PricingItem,
  FaqItem,
  ProofItem,
} from '@/types/scoring';

import type { CrawledPage } from './firecrawl';

// ---------------------------------------------------------------------------
// Headline extraction
// ---------------------------------------------------------------------------

/**
 * Extract headlines from markdown (# / ## / ###) and HTML (<h1>–<h3>).
 */
function extractHeadlines(pages: CrawledPage[]): Headline[] {
  const headlines: Headline[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    // Markdown headlines: lines starting with 1-3 # characters
    const mdRegex = /^(#{1,3})\s+(.+)$/gm;
    let match: RegExpExecArray | null;

    while ((match = mdRegex.exec(page.markdown)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const key = `${level}:${text}`;
      if (text && !seen.has(key)) {
        seen.add(key);
        headlines.push({ text, level });
      }
    }

    // HTML headlines: <h1>–<h3> tags
    const htmlRegex = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi;
    while ((match = htmlRegex.exec(page.html)) !== null) {
      const level = parseInt(match[1], 10);
      const text = stripHtmlTags(match[2]).trim();
      const key = `${level}:${text}`;
      if (text && !seen.has(key)) {
        seen.add(key);
        headlines.push({ text, level });
      }
    }
  }

  return headlines;
}

// ---------------------------------------------------------------------------
// CTA extraction
// ---------------------------------------------------------------------------

/** Words/phrases that signal a call-to-action. */
const CTA_PATTERNS = [
  'get started',
  'start',
  'try',
  'buy',
  'book',
  'schedule',
  'download',
  'sign up',
  'signup',
  'subscribe',
  'join',
  'learn more',
  'contact',
  'request',
  'claim',
  'free trial',
  'demo',
  'register',
  'enroll',
  'apply',
];

const CTA_PATTERN_REGEX = new RegExp(CTA_PATTERNS.join('|'), 'i');

function extractCTAs(pages: CrawledPage[]): string[] {
  const ctas: string[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    // Match <button> elements
    const buttonRegex = /<button[^>]*>([\s\S]*?)<\/button>/gi;
    let match: RegExpExecArray | null;

    while ((match = buttonRegex.exec(page.html)) !== null) {
      const text = stripHtmlTags(match[1]).trim();
      if (text && !seen.has(text.toLowerCase())) {
        seen.add(text.toLowerCase());
        ctas.push(text);
      }
    }

    // Match <a> tags with CTA-like text
    const linkRegex = /<a\s[^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = linkRegex.exec(page.html)) !== null) {
      const text = stripHtmlTags(match[1]).trim();
      if (
        text &&
        text.length <= 80 &&
        CTA_PATTERN_REGEX.test(text) &&
        !seen.has(text.toLowerCase())
      ) {
        seen.add(text.toLowerCase());
        ctas.push(text);
      }
    }

    // Match <input type="submit"> buttons
    const submitRegex = /<input[^>]*type=["']submit["'][^>]*>/gi;
    while ((match = submitRegex.exec(page.html)) !== null) {
      const valueMatch = match[0].match(/value=["']([^"']*)["']/i);
      if (valueMatch) {
        const text = valueMatch[1].trim();
        if (text && !seen.has(text.toLowerCase())) {
          seen.add(text.toLowerCase());
          ctas.push(text);
        }
      }
    }

    // Markdown-style CTAs: [CTA text](url)
    const mdLinkRegex = /\[([^\]]+)\]\([^)]+\)/g;
    while ((match = mdLinkRegex.exec(page.markdown)) !== null) {
      const text = match[1].trim();
      if (
        text &&
        text.length <= 80 &&
        CTA_PATTERN_REGEX.test(text) &&
        !seen.has(text.toLowerCase())
      ) {
        seen.add(text.toLowerCase());
        ctas.push(text);
      }
    }
  }

  return ctas;
}

// ---------------------------------------------------------------------------
// Form extraction
// ---------------------------------------------------------------------------

function extractForms(pages: CrawledPage[]): FormAnalysis[] {
  const forms: FormAnalysis[] = [];

  for (const page of pages) {
    const formRegex = /<form([^>]*)>([\s\S]*?)<\/form>/gi;
    let formMatch: RegExpExecArray | null;

    while ((formMatch = formRegex.exec(page.html)) !== null) {
      const formAttrs = formMatch[1];
      const formBody = formMatch[2];

      // Parse action attribute
      const actionMatch = formAttrs.match(/action=["']([^"']*)["']/i);
      const action = actionMatch ? actionMatch[1] : null;

      // Parse method attribute
      const methodMatch = formAttrs.match(/method=["']([^"']*)["']/i);
      const method = (methodMatch ? methodMatch[1] : 'get').toUpperCase();

      // Parse all input/select/textarea fields
      const fields: FormField[] = [];
      const inputRegex =
        /<(?:input|select|textarea)\s([^>]*)(?:\/?>|>[\s\S]*?<\/(?:select|textarea)>)/gi;
      let inputMatch: RegExpExecArray | null;

      while ((inputMatch = inputRegex.exec(formBody)) !== null) {
        const attrs = inputMatch[1];
        const nameAttr = attrs.match(/name=["']([^"']*)["']/i);
        const typeAttr = attrs.match(/type=["']([^"']*)["']/i);
        const labelAttr = attrs.match(/(?:aria-label|placeholder)=["']([^"']*)["']/i);
        const requiredAttr = /\brequired\b/i.test(attrs);
        const placeholderAttr = attrs.match(/placeholder=["']([^"']*)["']/i);

        fields.push({
          name: nameAttr ? nameAttr[1] : '',
          type: typeAttr ? typeAttr[1].toLowerCase() : 'text',
          label: labelAttr ? labelAttr[1] : null,
          required: requiredAttr,
          placeholder: placeholderAttr ? placeholderAttr[1] : null,
        });
      }

      // Detect features of the form
      const hasEmailField = fields.some(
        (f) =>
          f.type === 'email' ||
          f.name.toLowerCase().includes('email') ||
          (f.placeholder ?? '').toLowerCase().includes('email'),
      );
      const hasPhoneField = fields.some(
        (f) =>
          f.type === 'tel' ||
          f.name.toLowerCase().includes('phone') ||
          (f.placeholder ?? '').toLowerCase().includes('phone'),
      );
      const hasCaptcha =
        /recaptcha|hcaptcha|captcha|turnstile/i.test(formBody);

      forms.push({
        action,
        method,
        fields,
        hasCaptcha,
        hasEmailField,
        hasPhoneField,
      });
    }
  }

  return forms;
}

// ---------------------------------------------------------------------------
// Image extraction
// ---------------------------------------------------------------------------

function extractImages(pages: CrawledPage[]): ImageData[] {
  const images: ImageData[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    const imgRegex = /<img\s([^>]+)\/?>/gi;
    let match: RegExpExecArray | null;

    while ((match = imgRegex.exec(page.html)) !== null) {
      const attrs = match[1];

      const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
      if (!srcMatch) continue;

      const src = srcMatch[1];
      if (seen.has(src)) continue;
      seen.add(src);

      const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
      const widthMatch = attrs.match(/width=["']?(\d+)["']?/i);
      const heightMatch = attrs.match(/height=["']?(\d+)["']?/i);

      // Heuristic: the first large image on a page is likely above-fold / hero
      const isFirstImage = images.length === 0;
      const width = widthMatch ? parseInt(widthMatch[1], 10) : null;
      const height = heightMatch ? parseInt(heightMatch[1], 10) : null;
      const isHero =
        isFirstImage && width !== null && height !== null && width >= 600;

      // Detect format from src extension
      const extMatch = src.match(/\.(\w{3,4})(?:\?|$)/);
      const format = extMatch ? extMatch[1].toLowerCase() : null;

      images.push({
        src,
        alt: altMatch ? altMatch[1] : null,
        width,
        height,
        isAboveFold: isFirstImage,
        isHero,
        fileSize: null, // Not available from HTML alone
        format,
      });
    }
  }

  return images;
}

// ---------------------------------------------------------------------------
// Video extraction
// ---------------------------------------------------------------------------

function extractVideos(pages: CrawledPage[]): VideoEmbed[] {
  const videos: VideoEmbed[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    // Match <iframe> and <video> elements containing video URLs
    const embedRegex = /<(?:iframe|video|embed|source)\s([^>]+)(?:\/?>|>[\s\S]*?<\/(?:iframe|video)>)/gi;
    let match: RegExpExecArray | null;

    while ((match = embedRegex.exec(page.html)) !== null) {
      const attrs = match[1];
      const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
      if (!srcMatch) continue;

      const src = srcMatch[1];
      if (seen.has(src)) continue;
      seen.add(src);

      const platform = detectVideoPlatform(src);
      if (!platform) continue;

      const titleMatch = attrs.match(/title=["']([^"']*)["']/i);

      videos.push({
        src,
        platform,
        title: titleMatch ? titleMatch[1] : null,
        isAboveFold: videos.length === 0,
      });
    }

    // Also detect bare video URLs in markdown (e.g. youtu.be links)
    const urlRegex =
      /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/|player\.vimeo\.com\/video\/|vimeo\.com\/|fast\.wistia\.com\/(?:medias|embed)\/|loom\.com\/(?:share|embed)\/)[^\s)"']+/gi;
    while ((match = urlRegex.exec(page.markdown)) !== null) {
      const src = match[0];
      if (seen.has(src)) continue;
      seen.add(src);

      const platform = detectVideoPlatform(src);
      if (!platform) continue;

      videos.push({
        src,
        platform,
        title: null,
        isAboveFold: videos.length === 0,
      });
    }
  }

  return videos;
}

function detectVideoPlatform(
  src: string,
): VideoEmbed['platform'] | null {
  if (/youtube\.com|youtu\.be/i.test(src)) return 'youtube';
  if (/vimeo\.com|player\.vimeo/i.test(src)) return 'vimeo';
  if (/wistia\.com|fast\.wistia/i.test(src)) return 'wistia';
  if (/loom\.com/i.test(src)) return 'loom';
  if (/\.(mp4|webm|ogg)/i.test(src)) return 'other';
  return null;
}

// ---------------------------------------------------------------------------
// Testimonial / quote extraction
// ---------------------------------------------------------------------------

function extractTestimonials(pages: CrawledPage[]): Quote[] {
  const testimonials: Quote[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    // 1. Blockquotes in HTML
    const blockquoteRegex = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
    let match: RegExpExecArray | null;

    while ((match = blockquoteRegex.exec(page.html)) !== null) {
      const raw = match[1];
      const text = stripHtmlTags(raw).trim();
      if (!text || text.length < 20 || seen.has(text)) continue;
      seen.add(text);

      const attribution = parseAttribution(raw);
      testimonials.push({
        text,
        author: attribution.author,
        role: attribution.role,
        company: attribution.company,
        avatarUrl: null,
      });
    }

    // 2. Elements with "testimonial" or "review" class/id patterns
    const testimonialSectionRegex =
      /<(?:div|section|article)[^>]*(?:class|id)=["'][^"']*(?:testimonial|review|quote)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section|article)>/gi;
    while ((match = testimonialSectionRegex.exec(page.html)) !== null) {
      const sectionHtml = match[1];

      // Try to find individual quote blocks within
      const quoteBlocks =
        sectionHtml.match(/<(?:p|span|div)[^>]*>([\s\S]*?)<\/(?:p|span|div)>/gi) ?? [];

      for (const block of quoteBlocks) {
        const text = stripHtmlTags(block).trim();
        // Quotes are typically 20+ characters and contain quote marks or meaningful text
        if (
          text.length >= 20 &&
          text.length <= 2000 &&
          !seen.has(text)
        ) {
          seen.add(text);

          // Check for img tags (avatar)
          const avatarMatch = sectionHtml.match(
            /<img[^>]*src=["']([^"']+)["'][^>]*>/i,
          );

          testimonials.push({
            text: text.replace(/^[""\u201C\u201D]+|[""\u201C\u201D]+$/g, ''),
            author: null,
            role: null,
            company: null,
            avatarUrl: avatarMatch ? avatarMatch[1] : null,
          });
        }
      }
    }

    // 3. Markdown blockquotes: lines starting with >
    const mdBlockquoteRegex = /^>\s*(.+)$/gm;
    while ((match = mdBlockquoteRegex.exec(page.markdown)) !== null) {
      const text = match[1].trim();
      if (text.length >= 20 && !seen.has(text)) {
        seen.add(text);
        testimonials.push({
          text: text.replace(/^[""\u201C\u201D]+|[""\u201C\u201D]+$/g, ''),
          author: null,
          role: null,
          company: null,
          avatarUrl: null,
        });
      }
    }
  }

  return testimonials;
}

/** Try to extract author name, role, and company from attribution text. */
function parseAttribution(html: string): {
  author: string | null;
  role: string | null;
  company: string | null;
} {
  // Look for a <cite>, <footer>, or <figcaption> element
  const attrRegex =
    /<(?:cite|footer|figcaption)[^>]*>([\s\S]*?)<\/(?:cite|footer|figcaption)>/i;
  const attrMatch = html.match(attrRegex);
  if (!attrMatch)
    return { author: null, role: null, company: null };

  const raw = stripHtmlTags(attrMatch[1]).trim();

  // Common patterns: "Name, Role at Company" or "Name — Role, Company"
  const parts = raw.split(/[,\u2014\u2013\-|]/);
  const author = parts[0]?.trim().replace(/^[-\u2014\u2013]\s*/, '') || null;
  const role = parts[1]?.trim() || null;
  const company = parts[2]?.trim() || null;

  return { author, role, company };
}

// ---------------------------------------------------------------------------
// Pricing block extraction
// ---------------------------------------------------------------------------

function extractPricing(pages: CrawledPage[]): PricingItem[] {
  const items: PricingItem[] = [];

  for (const page of pages) {
    // Detect pricing sections in HTML
    const pricingSectionRegex =
      /<(?:div|section|article)[^>]*(?:class|id)=["'][^"']*(?:pricing|plans?|tier)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section|article)>/gi;
    let match: RegExpExecArray | null;

    while ((match = pricingSectionRegex.exec(page.html)) !== null) {
      const section = match[1];

      // Try to extract individual plan cards within the section
      const cardRegex =
        /<(?:div|article|li)[^>]*(?:class|id)=["'][^"']*(?:card|plan|tier|package)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
      let cardMatch: RegExpExecArray | null;

      while ((cardMatch = cardRegex.exec(section)) !== null) {
        const card = cardMatch[1];
        items.push(parsePricingCard(card));
      }

      // If no cards found, try to parse the section as a single pricing block
      if (items.length === 0) {
        items.push(parsePricingCard(section));
      }
    }

    // Also detect pricing patterns in markdown
    const mdPriceRegex = /\$[\d,]+(?:\.\d{2})?(?:\s*\/\s*(?:mo|month|yr|year|user))?/gi;
    while ((match = mdPriceRegex.exec(page.markdown)) !== null) {
      // Only add if we haven't found structured pricing above
      if (items.length === 0) {
        items.push({
          planName: null,
          price: match[0],
          interval: null,
          features: [],
          ctaText: null,
          highlighted: false,
        });
      }
    }
  }

  return deduplicatePricing(items);
}

function parsePricingCard(html: string): PricingItem {
  const text = stripHtmlTags(html);

  // Extract plan name from headings
  const nameMatch = html.match(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i);
  const planName = nameMatch ? stripHtmlTags(nameMatch[1]).trim() : null;

  // Extract price
  const priceMatch = text.match(
    /\$[\d,]+(?:\.\d{2})?|\d+(?:\.\d{2})?\s*(?:USD|EUR|GBP)/i,
  );
  const price = priceMatch ? priceMatch[0] : null;

  // Extract interval
  const intervalMatch = text.match(
    /\/\s*(mo(?:nth)?|yr|year|week|user(?:\/mo(?:nth)?)?)/i,
  );
  const interval = intervalMatch ? intervalMatch[1] : null;

  // Extract features (list items)
  const features: string[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch: RegExpExecArray | null;
  while ((liMatch = liRegex.exec(html)) !== null) {
    const feature = stripHtmlTags(liMatch[1]).trim();
    if (feature) features.push(feature);
  }

  // Extract CTA text
  const ctaMatch = html.match(
    /<(?:a|button)[^>]*>([\s\S]*?)<\/(?:a|button)>/i,
  );
  const ctaText = ctaMatch ? stripHtmlTags(ctaMatch[1]).trim() : null;

  // Detect "highlighted" / "popular" / "recommended" status
  const highlighted =
    /(?:popular|recommended|best|featured|highlighted)/i.test(html);

  return { planName, price, interval, features, ctaText, highlighted };
}

function deduplicatePricing(items: PricingItem[]): PricingItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.planName ?? ''}:${item.price ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// FAQ extraction
// ---------------------------------------------------------------------------

function extractFAQ(pages: CrawledPage[]): FaqItem[] {
  const faqs: FaqItem[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    // 1. Structured FAQ sections (details/summary or dl/dt/dd)
    const detailsRegex =
      /<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
    let match: RegExpExecArray | null;

    while ((match = detailsRegex.exec(page.html)) !== null) {
      const question = stripHtmlTags(match[1]).trim();
      const answer = stripHtmlTags(match[2]).trim();
      if (question && answer && !seen.has(question)) {
        seen.add(question);
        faqs.push({ question, answer });
      }
    }

    // 2. FAQ sections with class/id patterns
    const faqSectionRegex =
      /<(?:div|section)[^>]*(?:class|id)=["'][^"']*(?:faq|frequently)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/gi;
    while ((match = faqSectionRegex.exec(page.html)) !== null) {
      const section = match[1];

      // Look for heading + content pairs
      const pairRegex =
        /<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>\s*(?:<[^>]+>)*([\s\S]*?)(?=<h[2-6]|$)/gi;
      let pairMatch: RegExpExecArray | null;

      while ((pairMatch = pairRegex.exec(section)) !== null) {
        const question = stripHtmlTags(pairMatch[1]).trim();
        const answer = stripHtmlTags(pairMatch[2]).trim();
        if (
          question &&
          answer &&
          question.includes('?') &&
          !seen.has(question)
        ) {
          seen.add(question);
          faqs.push({ question, answer });
        }
      }
    }

    // 3. Markdown FAQ patterns: lines with ? followed by answer
    const mdFaqRegex =
      /^#{1,4}\s+(.+\?)\s*\n+([\s\S]*?)(?=\n#{1,4}\s|\n*$)/gm;
    while ((match = mdFaqRegex.exec(page.markdown)) !== null) {
      const question = match[1].trim();
      const answer = match[2].trim();
      if (question && answer && !seen.has(question)) {
        seen.add(question);
        faqs.push({ question, answer });
      }
    }
  }

  return faqs;
}

// ---------------------------------------------------------------------------
// Proof / social proof extraction
// ---------------------------------------------------------------------------

function extractProof(pages: CrawledPage[]): ProofItem[] {
  const proof: ProofItem[] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    const combined = `${page.markdown}\n${stripHtmlTags(page.html)}`;

    // 1. Statistics: numbers with meaningful units ($, %, +, x)
    const statRegex =
      /(?:(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?)\s*(?:\+|%|x\b)|(?:\$\s*(?:\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?(?:\s*[BMKbmk](?:illion|illion)?)?)/g;
    let match: RegExpExecArray | null;

    while ((match = statRegex.exec(combined)) !== null) {
      const stat = match[0].trim();
      if (stat.length < 2 || seen.has(stat)) continue;

      // Grab surrounding context (up to 100 chars each side)
      const start = Math.max(0, match.index - 100);
      const end = Math.min(combined.length, match.index + match[0].length + 100);
      const context = combined.slice(start, end).replace(/\s+/g, ' ').trim();

      seen.add(stat);
      proof.push({
        type: 'stat',
        text: context,
        imageUrl: null,
      });
    }

    // 2. Case study patterns
    const caseStudyRegex =
      /(?:case\s+stud(?:y|ies)|success\s+stor(?:y|ies)|customer\s+stor(?:y|ies))/gi;
    while ((match = caseStudyRegex.exec(combined)) !== null) {
      const start = Math.max(0, match.index - 50);
      const end = Math.min(combined.length, match.index + match[0].length + 150);
      const context = combined.slice(start, end).replace(/\s+/g, ' ').trim();

      if (!seen.has(context)) {
        seen.add(context);
        proof.push({
          type: 'case_study',
          text: context,
          imageUrl: null,
        });
      }
    }

    // 3. Logo / badge / trust patterns in HTML
    const trustSectionRegex =
      /<(?:div|section|ul)[^>]*(?:class|id)=["'][^"']*(?:logos?|clients?|partners?|trust|badge|certification|featured)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section|ul)>/gi;
    while ((match = trustSectionRegex.exec(page.html)) !== null) {
      const section = match[1];

      // Extract images within the trust section
      const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*\/?>/gi;
      let imgMatch: RegExpExecArray | null;

      while ((imgMatch = imgRegex.exec(section)) !== null) {
        const imageUrl = imgMatch[1];
        const altText = imgMatch[2] ?? '';
        const key = imageUrl;
        if (!seen.has(key)) {
          seen.add(key);
          proof.push({
            type: 'logo',
            text: altText || 'Client/partner logo',
            imageUrl,
          });
        }
      }
    }

    // 4. Certification / badge text patterns
    const certRegex =
      /(?:certified|accredited|award|iso\s*\d+|soc\s*2|gdpr\s*compliant|hipaa)/gi;
    while ((match = certRegex.exec(combined)) !== null) {
      const start = Math.max(0, match.index - 30);
      const end = Math.min(combined.length, match.index + match[0].length + 80);
      const context = combined.slice(start, end).replace(/\s+/g, ' ').trim();

      if (!seen.has(context)) {
        seen.add(context);
        proof.push({
          type: 'certification',
          text: context,
          imageUrl: null,
        });
      }
    }
  }

  return proof;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Strip all HTML tags from a string, decode common entities. */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract structured content signals from crawled pages using rule-based
 * pattern matching. No LLM or external parsing library is used.
 *
 * @param pages - Array of crawled pages (markdown + HTML).
 * @returns A CrawlExtraction object with all detected content signals.
 */
export function extractContent(pages: CrawledPage[]): CrawlExtraction {
  return {
    headlines: extractHeadlines(pages),
    ctas: extractCTAs(pages),
    forms: extractForms(pages),
    images: extractImages(pages),
    videos: extractVideos(pages),
    testimonials: extractTestimonials(pages),
    pricing: extractPricing(pages),
    faq: extractFAQ(pages),
    proof: extractProof(pages),
  };
}
