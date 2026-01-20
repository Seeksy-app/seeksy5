import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { rssUrl, limit = 10 } = await req.json();

    if (!rssUrl) {
      return new Response(JSON.stringify({ error: 'RSS URL is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching RSS feed:', rssUrl);

    // Fetch the RSS feed with proper headers
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Seeksy/1.0; +https://seeksy.io)',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }

    const xmlText = await response.text();
    
    // Check if we got HTML instead of RSS/XML
    if (xmlText.trim().toLowerCase().startsWith('<!doctype html') || xmlText.trim().toLowerCase().startsWith('<html')) {
      throw new Error('The URL returned HTML instead of an RSS feed. Please verify the RSS feed URL. For TechCrunch, try: https://techcrunch.com/feed/');
    }
    
    console.log('Feed length:', xmlText.length);
    console.log('Feed preview:', xmlText.substring(0, 500));
    
    // Parse RSS/Atom feed manually using split
    const items: Array<{
      title: string;
      link: string;
      guid: string;
      pubDate: string;
      description: string;
      contentEncoded: string;
      mediaUrl: string;
    }> = [];
    
    // Helper to decode HTML entities
    const decodeHtmlEntities = (text: string): string => {
      return text
        .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
        .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
    };

    // Helper to extract field value
    const getField = (content: string, fieldName: string): string => {
      // Try CDATA first
      const cdataPattern = new RegExp(`<${fieldName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${fieldName}>`, 'i');
      const cdataMatch = content.match(cdataPattern);
      if (cdataMatch) return decodeHtmlEntities(cdataMatch[1].trim());
      
      // Try regular tag
      const tagPattern = new RegExp(`<${fieldName}[^>]*>([\\s\\S]*?)<\\/${fieldName}>`, 'i');
      const tagMatch = content.match(tagPattern);
      if (tagMatch) return decodeHtmlEntities(tagMatch[1].trim());
      
      // Try self-closing or content attribute
      const attrPattern = new RegExp(`<${fieldName}[^>]*\\/?>`,'i');
      const attrMatch = content.match(attrPattern);
      if (attrMatch) {
        const urlMatch = attrMatch[0].match(/(?:href|url)=["']([^"']+)["']/i);
        if (urlMatch) return urlMatch[1];
      }
      
      return '';
    };
    
    // Split by item or entry tags
    let itemContents: string[] = [];
    
    if (xmlText.includes('<item>') || xmlText.includes('<item ')) {
      // RSS 2.0 format
      const parts = xmlText.split(/<item[^>]*>/i);
      for (let i = 1; i < parts.length; i++) {
        const endIndex = parts[i].indexOf('</item>');
        if (endIndex > 0) {
          itemContents.push(parts[i].substring(0, endIndex));
        }
      }
    } else if (xmlText.includes('<entry>') || xmlText.includes('<entry ')) {
      // Atom format
      const parts = xmlText.split(/<entry[^>]*>/i);
      for (let i = 1; i < parts.length; i++) {
        const endIndex = parts[i].indexOf('</entry>');
        if (endIndex > 0) {
          itemContents.push(parts[i].substring(0, endIndex));
        }
      }
    }
    
    console.log('Found', itemContents.length, 'items');
    
    for (const itemContent of itemContents) {
      const title = getField(itemContent, 'title');
      const link = getField(itemContent, 'link') || getField(itemContent, 'id');
      const guid = getField(itemContent, 'guid') || getField(itemContent, 'id') || link;
      const pubDate = getField(itemContent, 'pubDate') || getField(itemContent, 'published') || getField(itemContent, 'updated');
      const description = getField(itemContent, 'description') || getField(itemContent, 'summary');
      const contentEncoded = getField(itemContent, 'content:encoded') || getField(itemContent, 'content');
      
      // Extract media URL
      let mediaUrl = '';
      const mediaMatch = itemContent.match(/<media:content[^>]+url=["']([^"']+)["']/i) ||
                        itemContent.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
      if (mediaMatch) mediaUrl = mediaMatch[1];
      
      items.push({
        title,
        link,
        guid,
        pubDate,
        description,
        contentEncoded,
        mediaUrl
      });
    }
    
    if (items.length === 0) {
      console.error('No items parsed from feed');
      throw new Error('No items found in RSS feed');
    }

    console.log(`Found ${items.length} items in feed`);

    const itemsToImport = items.slice(0, limit);
    let imported = 0;
    let skipped = 0;

    // Determine platform from URL
    let platform = 'rss';
    if (rssUrl.includes('youtube.com') || rssUrl.includes('youtu.be')) {
      platform = 'youtube';
    }

    for (const item of itemsToImport) {
      const { title, link, guid, pubDate, description, contentEncoded, mediaUrl } = item;
      const externalId = guid || link;

      if (!externalId) {
        console.log('Skipping item without ID:', title);
        continue;
      }
      
      // Check if already imported
      const { data: existing } = await supabaseClient
        .from('blog_posts')
        .select('id')
        .eq('external_id', externalId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        console.log('Post already exists:', title);
        skipped++;
        continue;
      }

      // Generate slug from title
      const slug = (title || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Use media URL or find image in content
      let featuredImage = mediaUrl || null;
      if (!featuredImage) {
        const content = contentEncoded || description;
        const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
        if (imgMatch) {
          featuredImage = imgMatch[1];
        }
      }

      // Get content, prefer contentEncoded
      const rawContent = contentEncoded || description || '';
      
      // Clean HTML for excerpt
      const excerpt = rawContent
        .replace(/<[^>]*>/g, '')
        .substring(0, 200);

      const postData = {
        user_id: user.id,
        title: title || 'Untitled',
        slug: `${slug}-${Date.now()}`,
        content: rawContent,
        excerpt,
        featured_image_url: featuredImage,
        status: 'draft',
        source_rss_url: rssUrl,
        source_platform: platform,
        external_id: externalId,
        published_at: pubDate ? new Date(pubDate).toISOString() : null,
      };

      const { error } = await supabaseClient
        .from('blog_posts')
        .insert([postData]);

      if (error) {
        console.error('Error importing post:', error);
      } else {
        console.log('Imported:', title);
        imported++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        skipped,
        total: itemsToImport.length,
        message: `Imported ${imported} posts, skipped ${skipped} duplicates`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error importing RSS feed:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to import RSS feed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
