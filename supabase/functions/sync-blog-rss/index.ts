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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting hourly blog RSS sync...');

    // Get all profiles with blog RSS URLs
    const { data: profiles, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('id, blog_rss_url')
      .not('blog_rss_url', 'is', null);

    if (fetchError) {
      console.error('Error fetching profiles:', fetchError);
      throw fetchError;
    }

    if (!profiles || profiles.length === 0) {
      console.log('No profiles with RSS feeds found');
      return new Response(
        JSON.stringify({ message: 'No profiles with RSS feeds found', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${profiles.length} profiles with RSS feeds`);

    // Map of RSS URL to user IDs
    const rssUrlMap = new Map<string, string[]>();
    for (const profile of profiles) {
      if (!rssUrlMap.has(profile.blog_rss_url)) {
        rssUrlMap.set(profile.blog_rss_url, []);
      }
      rssUrlMap.get(profile.blog_rss_url)!.push(profile.id);
    }

    let totalSynced = 0;

    // Process each unique RSS feed
    for (const [rssUrl, userIds] of rssUrlMap.entries()) {
      try {
        console.log(`Syncing RSS feed: ${rssUrl}`);
        
        // Fetch the RSS feed
        const response = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Seeksy/1.0; +https://seeksy.io)',
            'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
          },
        });

        if (!response.ok) {
          console.error(`Failed to fetch ${rssUrl}: ${response.statusText}`);
          continue;
        }

        const xmlText = await response.text();

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
          const cdataPattern = new RegExp(`<${fieldName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${fieldName}>`, 'i');
          const cdataMatch = content.match(cdataPattern);
          if (cdataMatch) return decodeHtmlEntities(cdataMatch[1].trim());
          
          const tagPattern = new RegExp(`<${fieldName}[^>]*>([\\s\\S]*?)<\\/${fieldName}>`, 'i');
          const tagMatch = content.match(tagPattern);
          if (tagMatch) return decodeHtmlEntities(tagMatch[1].trim());
          
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
          const parts = xmlText.split(/<item[^>]*>/i);
          for (let i = 1; i < parts.length; i++) {
            const endIndex = parts[i].indexOf('</item>');
            if (endIndex > 0) {
              itemContents.push(parts[i].substring(0, endIndex));
            }
          }
        } else if (xmlText.includes('<entry>') || xmlText.includes('<entry ')) {
          const parts = xmlText.split(/<entry[^>]*>/i);
          for (let i = 1; i < parts.length; i++) {
            const endIndex = parts[i].indexOf('</entry>');
            if (endIndex > 0) {
              itemContents.push(parts[i].substring(0, endIndex));
            }
          }
        }

        console.log(`Found ${itemContents.length} items in ${rssUrl}`);

        // Get existing external IDs for these users to avoid duplicates
        const { data: existingPosts } = await supabaseClient
          .from('blog_posts')
          .select('external_id')
          .in('user_id', userIds)
          .not('external_id', 'is', null);

        const existingExternalIds = new Set(existingPosts?.map(p => p.external_id) || []);

        // Process each item in the feed
        for (const itemContent of itemContents) {
          const link = getField(itemContent, 'link') || getField(itemContent, 'id');
          const guid = getField(itemContent, 'guid') || getField(itemContent, 'id') || link;
          const externalId = guid || link;

          if (!externalId || existingExternalIds.has(externalId)) {
            continue; // Skip if no ID or already exists
          }

          const title = getField(itemContent, 'title');
          const pubDate = getField(itemContent, 'pubDate') || getField(itemContent, 'published') || getField(itemContent, 'updated');
          const description = getField(itemContent, 'description') || getField(itemContent, 'summary');
          const contentEncoded = getField(itemContent, 'content:encoded') || getField(itemContent, 'content');

          // Extract media URL for featured image
          let mediaUrl = '';
          const mediaMatch = itemContent.match(/<media:content[^>]+url=["']([^"']+)["']/i) ||
                            itemContent.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
          if (mediaMatch) mediaUrl = mediaMatch[1];

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

          // Generate slug from title
          const slug = (title || 'untitled')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          // Insert for each user who has this RSS feed
          for (const userId of userIds) {
            // Check if user has auto-publish enabled
            const { data: profile } = await supabaseClient
              .from('profiles')
              .select('auto_publish_rss')
              .eq('id', userId)
              .single();

            const shouldAutoPublish = profile?.auto_publish_rss || false;

            const postData = {
              user_id: userId,
              title: title || 'Untitled',
              slug: `${slug}-${Date.now()}`,
              content: rawContent,
              excerpt,
              featured_image_url: featuredImage,
              status: shouldAutoPublish ? 'published' : 'draft',
              source_rss_url: rssUrl,
              source_platform: rssUrl.includes('youtube.com') || rssUrl.includes('youtu.be') ? 'youtube' : 'rss',
              external_id: externalId,
              published_at: shouldAutoPublish && pubDate ? new Date(pubDate).toISOString() : (shouldAutoPublish ? new Date().toISOString() : null),
            };

            const { error: insertError } = await supabaseClient
              .from('blog_posts')
              .insert([postData]);

            if (insertError) {
              console.error(`Error importing post for user ${userId}:`, insertError);
            } else {
              console.log(`Imported: ${title} for user ${userId}`);
              totalSynced++;
            }
          }

          // Mark this external ID as processed
          existingExternalIds.add(externalId);
        }

      } catch (error) {
        console.error(`Error syncing RSS feed ${rssUrl}:`, error);
        // Continue with next feed
      }
    }

    console.log(`Sync complete. Total new posts synced: ${totalSynced}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Synced ${totalSynced} new blog posts from ${rssUrlMap.size} RSS feeds`,
        synced: totalSynced
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in blog RSS sync:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to sync blog RSS feeds' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
