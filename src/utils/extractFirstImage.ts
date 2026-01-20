/**
 * Extracts the first image URL from markdown or HTML content
 */
export const extractFirstImageFromContent = (content: string | null | undefined): string | null => {
  if (!content) return null;
  
  // Try markdown image syntax: ![alt](url)
  const markdownMatch = content.match(/!\[.*?\]\((.*?)\)/);
  if (markdownMatch?.[1]) {
    return markdownMatch[1];
  }
  
  // Try HTML img tag: <img src="url" />
  const htmlMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlMatch?.[1]) {
    return htmlMatch[1];
  }
  
  return null;
};

/**
 * Category default images for blog posts
 */
export const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'technology': '/images/categories/technology.jpg',
  'business': '/images/categories/business.jpg',
  'marketing': '/images/categories/marketing.jpg',
  'podcasting': '/images/categories/podcasting.jpg',
  'creator-economy': '/images/categories/creator-economy.jpg',
  'ai': '/images/categories/ai.jpg',
  'default': '/placeholder.svg'
};

export const getCategoryImage = (category: string | null | undefined): string => {
  if (!category) return CATEGORY_DEFAULT_IMAGES.default;
  const normalized = category.toLowerCase().replace(/\s+/g, '-');
  return CATEGORY_DEFAULT_IMAGES[normalized] || CATEGORY_DEFAULT_IMAGES.default;
};
