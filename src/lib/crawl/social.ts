// ---------------------------------------------------------------------------
// Social Media Detection — SylvaPoint GTM Audit Tool
// ---------------------------------------------------------------------------
// Detects social media profile links from crawled HTML and merges them with
// any user-provided social links.
// ---------------------------------------------------------------------------

import type { CrawledPage } from './firecrawl';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SocialProfile {
  platform: string;
  url: string;
  handle: string;
}

export interface SocialData {
  profiles: SocialProfile[];
  userProvided: string[];
}

// ---------------------------------------------------------------------------
// Platform definitions
// ---------------------------------------------------------------------------

interface PlatformPattern {
  platform: string;
  /** Regex to match the full URL. */
  urlPattern: RegExp;
  /** Function to extract a handle from the matched URL. */
  extractHandle: (url: string) => string;
}

const PLATFORM_PATTERNS: PlatformPattern[] = [
  {
    platform: 'linkedin',
    urlPattern:
      /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/([^/?#\s"']+)/i,
    extractHandle: (url) => {
      const match = url.match(
        /linkedin\.com\/(?:company|in|school)\/([^/?#\s"']+)/i,
      );
      return match ? match[1].replace(/\/$/, '') : '';
    },
  },
  {
    platform: 'twitter',
    urlPattern:
      /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([^/?#\s"']+)/i,
    extractHandle: (url) => {
      const match = url.match(/(?:twitter\.com|x\.com)\/([^/?#\s"']+)/i);
      const handle = match ? match[1] : '';
      // Filter out common non-profile paths
      if (['intent', 'share', 'search', 'hashtag', 'i', 'home'].includes(handle.toLowerCase())) {
        return '';
      }
      return handle;
    },
  },
  {
    platform: 'instagram',
    urlPattern:
      /https?:\/\/(?:www\.)?instagram\.com\/([^/?#\s"']+)/i,
    extractHandle: (url) => {
      const match = url.match(/instagram\.com\/([^/?#\s"']+)/i);
      const handle = match ? match[1] : '';
      if (['p', 'reel', 'explore', 'accounts', 'stories'].includes(handle.toLowerCase())) {
        return '';
      }
      return handle;
    },
  },
  {
    platform: 'youtube',
    urlPattern:
      /https?:\/\/(?:www\.)?youtube\.com\/(?:@|c\/|channel\/|user\/)([^/?#\s"']+)/i,
    extractHandle: (url) => {
      const match = url.match(
        /youtube\.com\/(?:@|c\/|channel\/|user\/)([^/?#\s"']+)/i,
      );
      return match ? match[1] : '';
    },
  },
  {
    platform: 'tiktok',
    urlPattern:
      /https?:\/\/(?:www\.)?tiktok\.com\/@([^/?#\s"']+)/i,
    extractHandle: (url) => {
      const match = url.match(/tiktok\.com\/@([^/?#\s"']+)/i);
      return match ? match[1] : '';
    },
  },
  {
    platform: 'facebook',
    urlPattern:
      /https?:\/\/(?:www\.)?facebook\.com\/([^/?#\s"']+)/i,
    extractHandle: (url) => {
      const match = url.match(/facebook\.com\/([^/?#\s"']+)/i);
      const handle = match ? match[1] : '';
      if (
        ['sharer', 'share', 'dialog', 'plugins', 'pages', 'groups', 'events', 'profile.php'].includes(
          handle.toLowerCase(),
        )
      ) {
        return '';
      }
      return handle;
    },
  },
  {
    platform: 'github',
    urlPattern:
      /https?:\/\/(?:www\.)?github\.com\/([^/?#\s"']+)/i,
    extractHandle: (url) => {
      const match = url.match(/github\.com\/([^/?#\s"']+)/i);
      const handle = match ? match[1] : '';
      if (
        [
          'features',
          'marketplace',
          'explore',
          'topics',
          'trending',
          'collections',
          'events',
          'sponsors',
          'settings',
          'notifications',
          'login',
          'signup',
          'about',
          'pricing',
          'security',
          'enterprise',
        ].includes(handle.toLowerCase())
      ) {
        return '';
      }
      return handle;
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract all href values from HTML content.
 */
function extractHrefs(html: string): string[] {
  const hrefs: string[] = [];
  const regex = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    hrefs.push(match[1]);
  }
  return hrefs;
}

/**
 * Normalise a URL: lowercase the host, remove trailing slashes, strip
 * common tracking parameters.
 */
function normaliseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    // Remove common tracking params
    url.searchParams.delete('utm_source');
    url.searchParams.delete('utm_medium');
    url.searchParams.delete('utm_campaign');
    url.searchParams.delete('ref');
    // Remove trailing slash from pathname
    url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return raw.trim().replace(/\/+$/, '');
  }
}

/**
 * Parse a comma-separated string of social links into cleaned URL strings.
 */
function parseUserProvidedLinks(input: string): string[] {
  if (!input.trim()) return [];
  return input
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((link) => {
      // If user provided a bare handle like @username, skip it (we need URLs)
      // If they provided a URL without protocol, add https
      if (link.startsWith('http://') || link.startsWith('https://')) {
        return link;
      }
      if (link.includes('.com') || link.includes('.co')) {
        return `https://${link}`;
      }
      return link;
    });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect social media profile links from crawled page HTML.
 *
 * Scans all `href` attributes for known social media platform URLs,
 * deduplicates them, and merges with any user-provided links.
 *
 * @param pages - Array of crawled pages.
 * @param userProvidedLinks - Optional comma-separated string of social URLs.
 * @returns SocialData with deduplicated profiles and parsed user-provided links.
 */
export function detectSocialLinks(
  pages: CrawledPage[],
  userProvidedLinks?: string,
): SocialData {
  const profileMap = new Map<string, SocialProfile>();

  // 1. Scan crawled HTML for social links
  for (const page of pages) {
    const hrefs = extractHrefs(page.html);

    for (const href of hrefs) {
      for (const pattern of PLATFORM_PATTERNS) {
        if (pattern.urlPattern.test(href)) {
          const handle = pattern.extractHandle(href);
          if (!handle) continue;

          const normUrl = normaliseUrl(href);
          // Deduplicate by platform + handle (case-insensitive)
          const key = `${pattern.platform}:${handle.toLowerCase()}`;

          if (!profileMap.has(key)) {
            profileMap.set(key, {
              platform: pattern.platform,
              url: normUrl,
              handle,
            });
          }
          break; // Each href matches at most one platform
        }
      }
    }
  }

  // 2. Parse and merge user-provided links
  const userLinks = userProvidedLinks
    ? parseUserProvidedLinks(userProvidedLinks)
    : [];

  for (const link of userLinks) {
    for (const pattern of PLATFORM_PATTERNS) {
      if (pattern.urlPattern.test(link)) {
        const handle = pattern.extractHandle(link);
        if (!handle) continue;

        const normUrl = normaliseUrl(link);
        const key = `${pattern.platform}:${handle.toLowerCase()}`;

        if (!profileMap.has(key)) {
          profileMap.set(key, {
            platform: pattern.platform,
            url: normUrl,
            handle,
          });
        }
        break;
      }
    }
  }

  return {
    profiles: Array.from(profileMap.values()),
    userProvided: userLinks,
  };
}
