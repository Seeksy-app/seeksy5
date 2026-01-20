import DOMPurify from "dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Uses DOMPurify with safe defaults.
 * 
 * @param html - The raw HTML string to sanitize (can be null/undefined)
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    // Allow common safe attributes
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'target', 'rel', 'width', 'height', 'colspan', 'rowspan',
      'align', 'valign', 'border', 'cellpadding', 'cellspacing'
    ],
    // Allow safe protocols
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Sanitize HTML for email content specifically.
 * More permissive to handle email HTML formatting.
 */
export function sanitizeEmailHtml(html: string | null | undefined): string {
  if (!html) return "";
  
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    // More permissive for email content
    ADD_ATTR: ['target', 'border', 'cellpadding', 'cellspacing', 'bgcolor'],
    ADD_TAGS: ['center'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
