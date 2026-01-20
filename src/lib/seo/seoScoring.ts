/**
 * SEO Scoring Utility
 * Computes a 0-100 SEO score with breakdown
 */

export interface SeoScoreRule {
  key: string;
  label: string;
  points: number;
  passed: boolean;
  hint?: string;
}

export interface SeoScoreResult {
  score: number;
  breakdown: SeoScoreRule[];
  status: 'good' | 'ok' | 'needs_work';
  statusColor: 'green' | 'yellow' | 'red';
}

export interface SeoPageData {
  meta_title?: string | null;
  meta_description?: string | null;
  h1_override?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  og_image_alt?: string | null;
  twitter_card_type?: string | null;
  json_ld?: string | null;
}

/**
 * Validates if a string is valid JSON
 */
function isValidJson(str: string | null | undefined): boolean {
  if (!str || str.trim() === '') return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Compute SEO score for a page
 */
export function computeSeoScore(data: SeoPageData): SeoScoreResult {
  const breakdown: SeoScoreRule[] = [];
  
  // Rule 1: Meta Title (15 points)
  const metaTitleLength = data.meta_title?.length || 0;
  const metaTitlePassed = metaTitleLength >= 30 && metaTitleLength <= 60;
  breakdown.push({
    key: 'meta_title',
    label: 'Meta Title',
    points: 15,
    passed: metaTitlePassed,
    hint: metaTitleLength === 0 
      ? 'Add a meta title (30-60 characters)' 
      : metaTitleLength < 30 
        ? `Title too short (${metaTitleLength}/30 min)` 
        : metaTitleLength > 60 
          ? `Title may be truncated (${metaTitleLength}/60 recommended)` 
          : undefined
  });

  // Rule 2: Meta Description (15 points)
  const metaDescLength = data.meta_description?.length || 0;
  const metaDescPassed = metaDescLength >= 120 && metaDescLength <= 160;
  breakdown.push({
    key: 'meta_description',
    label: 'Meta Description',
    points: 15,
    passed: metaDescPassed,
    hint: metaDescLength === 0 
      ? 'Add a meta description (120-160 characters)' 
      : metaDescLength < 120 
        ? `Description too short (${metaDescLength}/120 min)` 
        : metaDescLength > 160 
          ? `Description may be truncated (${metaDescLength}/160 recommended)` 
          : undefined
  });

  // Rule 3: H1 Override (10 points)
  const h1Passed = !!data.h1_override && data.h1_override.trim().length > 0;
  breakdown.push({
    key: 'h1',
    label: 'H1 Heading',
    points: 10,
    passed: h1Passed,
    hint: !h1Passed ? 'Add an H1 heading override' : undefined
  });

  // Rule 4: OG Title (10 points)
  const ogTitlePassed = !!data.og_title && data.og_title.trim().length > 0;
  breakdown.push({
    key: 'og_title',
    label: 'OpenGraph Title',
    points: 10,
    passed: ogTitlePassed,
    hint: !ogTitlePassed ? 'Add an OpenGraph title' : undefined
  });

  // Rule 5: OG Description (10 points)
  const ogDescPassed = !!data.og_description && data.og_description.trim().length > 0;
  breakdown.push({
    key: 'og_description',
    label: 'OpenGraph Description',
    points: 10,
    passed: ogDescPassed,
    hint: !ogDescPassed ? 'Add an OpenGraph description' : undefined
  });

  // Rule 6: OG Image + Alt (15 points)
  const ogImagePassed = !!data.og_image_url && data.og_image_url.trim().length > 0 
    && !!data.og_image_alt && data.og_image_alt.trim().length > 0;
  breakdown.push({
    key: 'og_image_alt',
    label: 'OpenGraph Image & Alt',
    points: 15,
    passed: ogImagePassed,
    hint: !data.og_image_url 
      ? 'Add an OpenGraph image' 
      : !data.og_image_alt 
        ? 'Add alt text for the OpenGraph image' 
        : undefined
  });

  // Rule 7: Twitter Card (10 points)
  const twitterPassed = !!data.twitter_card_type && data.twitter_card_type.trim().length > 0;
  breakdown.push({
    key: 'twitter_card',
    label: 'Twitter Card Type',
    points: 10,
    passed: twitterPassed,
    hint: !twitterPassed ? 'Select a Twitter card type' : undefined
  });

  // Rule 8: Structured Data (15 points)
  const jsonLdPassed = isValidJson(data.json_ld);
  breakdown.push({
    key: 'structured_data',
    label: 'Structured Data (JSON-LD)',
    points: 15,
    passed: jsonLdPassed,
    hint: !data.json_ld 
      ? 'Add structured data (JSON-LD)' 
      : !jsonLdPassed 
        ? 'JSON-LD is invalid - check syntax' 
        : undefined
  });

  // Calculate total score
  const score = breakdown.reduce((total, rule) => {
    return total + (rule.passed ? rule.points : 0);
  }, 0);

  // Determine status
  let status: 'good' | 'ok' | 'needs_work';
  let statusColor: 'green' | 'yellow' | 'red';
  
  if (score >= 80) {
    status = 'good';
    statusColor = 'green';
  } else if (score >= 60) {
    status = 'ok';
    statusColor = 'yellow';
  } else {
    status = 'needs_work';
    statusColor = 'red';
  }

  return {
    score,
    breakdown,
    status,
    statusColor
  };
}

/**
 * Get CSS class for score color
 */
export function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
}

/**
 * Get progress bar color class
 */
export function getScoreProgressColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * JSON-LD Templates for common schema types
 */
export const JSON_LD_TEMPLATES: Record<string, object> = {
  LocalBusiness: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "",
    "description": "",
    "image": "",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "",
      "addressLocality": "",
      "addressRegion": "",
      "postalCode": "",
      "addressCountry": "US"
    },
    "telephone": "",
    "url": ""
  },
  Organization: {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "",
    "description": "",
    "url": "",
    "logo": "",
    "sameAs": []
  },
  Article: {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "",
    "description": "",
    "image": "",
    "author": {
      "@type": "Person",
      "name": ""
    },
    "datePublished": "",
    "dateModified": ""
  },
  FAQPage: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": ""
        }
      }
    ]
  },
  BreadcrumbList: {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": ""
      }
    ]
  }
};
