import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_ROLES = ['admin', 'super_admin', 'editor'];

// Article type templates for diversity
const ARTICLE_TYPES = [
  { type: 'strategy', prefix: 'Strategic Guide:', focus: 'positioning and long-term planning' },
  { type: 'howto', prefix: 'How To:', focus: 'step-by-step practical playbook' },
  { type: 'trends', prefix: 'Trends & Insights:', focus: 'industry analysis and future predictions' }
];

// Topic themes to ensure variety
const TOPIC_THEMES = [
  'podcast monetization strategies',
  'creator audience retention',
  'content repurposing workflows',
  'AI tools for creators',
  'newsletter growth tactics',
  'video content optimization',
  'voice and audio branding',
  'creator economy trends 2025',
  'social media algorithm mastery',
  'personal brand building',
  'creator community engagement',
  'multi-platform distribution',
  'sponsorship negotiation',
  'content calendar planning',
  'analytics and data-driven content'
];

// Generate an image using Lovable AI and upload to storage
async function generateImage(
  prompt: string, 
  lovableApiKey: string, 
  supabase: any,
  filename: string
): Promise<string | null> {
  try {
    console.log('🖼️ Generating image:', prompt.substring(0, 100) + '...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image', 'text']
      })
    });

    if (!response.ok) {
      console.error('❌ Image generation failed:', response.status);
      return null;
    }

    const data = await response.json();
    const base64DataUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!base64DataUrl) {
      console.warn('⚠️ No image in response');
      return null;
    }
    
    const base64Match = base64DataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) return null;
    
    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const storagePath = `blog-images/${filename}.${imageFormat}`;
    const { error: uploadError } = await supabase.storage
      .from('blog-assets')
      .upload(storagePath, bytes, { contentType: `image/${imageFormat}`, upsert: true });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage.from('blog-assets').getPublicUrl(storagePath);
    console.log('✅ Image uploaded');
    return publicUrl;
  } catch (error) {
    console.error('❌ Image error:', error);
    return null;
  }
}

function safeParseJson(content: string): any {
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch (e) {}
  }
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch (e) {
      try {
        return JSON.parse(jsonMatch[0].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'));
      } catch (e2) {}
    }
  }
  return null;
}

// Check title similarity
function isTitleTooSimilar(newTitle: string, existingTitles: string[]): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const newNorm = normalize(newTitle);
  const newWords = new Set(newNorm.split(/\s+/).filter(w => w.length > 3));
  
  for (const existing of existingTitles) {
    const existingNorm = normalize(existing);
    
    // Exact or near-exact match
    if (existingNorm === newNorm) return true;
    if (existingNorm.includes(newNorm) || newNorm.includes(existingNorm)) return true;
    
    // Word overlap check
    const existingWords = new Set(existingNorm.split(/\s+/).filter(w => w.length > 3));
    let overlap = 0;
    for (const word of newWords) {
      if (existingWords.has(word)) overlap++;
    }
    const overlapRatio = overlap / Math.max(newWords.size, 1);
    if (overlapRatio > 0.6) return true;
  }
  return false;
}

// Generate title-specific image prompt
function buildImagePrompt(title: string, articleType: string, theme: string): string {
  const visualConcepts: Record<string, string> = {
    'monetization': 'golden coins, revenue streams, financial growth charts, professional business aesthetic',
    'audience': 'connected people silhouettes, network nodes, community circles, engagement visualization',
    'content': 'creative tools, colorful media elements, video frames, audio waveforms',
    'podcast': 'microphone, sound waves, headphones, audio spectrum visualization',
    'newsletter': 'email envelope elements, subscriber growth, publication imagery',
    'video': 'play buttons, video frames, screen recordings, editing timeline',
    'ai': 'neural network patterns, futuristic circuits, intelligent automation symbols',
    'social': 'platform icons abstracted, viral spread patterns, engagement metrics',
    'brand': 'identity elements, professional logos abstracted, recognition symbols',
    'growth': 'upward arrows, scaling patterns, expansion visualization',
    'strategy': 'chess pieces abstracted, roadmap elements, planning visualization',
    'trends': 'rising charts, forecast arrows, future-forward imagery',
    'community': 'interconnected circles, group dynamics, collaborative networks'
  };
  
  // Find relevant visual concept
  let visualStyle = 'abstract professional visualization';
  for (const [key, value] of Object.entries(visualConcepts)) {
    if (title.toLowerCase().includes(key) || theme.toLowerCase().includes(key)) {
      visualStyle = value;
      break;
    }
  }
  
  const typeStyle = articleType === 'strategy' 
    ? 'strategic and sophisticated composition' 
    : articleType === 'howto' 
    ? 'practical and action-oriented design' 
    : 'modern and forward-looking aesthetic';
  
  return `Create a 16:9 professional blog header image for an article titled "${title}". 
Visual elements: ${visualStyle}. 
Style: ${typeStyle}, modern minimalist design, Seeksy brand colors (deep blue #053877, electric blue #2C6BED accents), 
clean gradients and abstract shapes, NO text, NO human faces, NO photography, editorial illustration quality, 
high-end professional appearance suitable for a creator economy platform.`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const roles = userRoles?.map(r => r.role) || [];
    if (!roles.some(role => ALLOWED_ROLES.includes(role))) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Authorized: user=${user.id}`);

    // Fetch last 60 posts to check for duplicates
    const { data: existingPosts } = await supabase
      .from('blog_posts')
      .select('title, slug')
      .order('created_at', { ascending: false })
      .limit(60);
    
    const existingTitles = existingPosts?.map(p => p.title) || [];
    console.log(`📚 Checking against ${existingTitles.length} existing posts`);

    // Generate batch ID for tracking
    const batchId = crypto.randomUUID();
    const batchTimestamp = Date.now();
    
    // Select 3 random themes for this batch
    const shuffledThemes = [...TOPIC_THEMES].sort(() => Math.random() - 0.5);
    const selectedThemes = shuffledThemes.slice(0, 3);

    const posts = [];
    
    for (let i = 0; i < 3; i++) {
      const articleType = ARTICLE_TYPES[i];
      const theme = selectedThemes[i];
      
      console.log(`\n📝 Generating ${articleType.type} article about "${theme}"...`);

      let validArticle = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!validArticle && attempts < maxAttempts) {
        attempts++;
        
        const topicResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are Seeksy's Master Blog AI writer creating high-quality content for creators and podcasters.

CRITICAL REQUIREMENTS:
1. Create UNIQUE, SPECIFIC content - never generic filler
2. Each article must have a distinctive angle and fresh insights
3. Article type for this piece: ${articleType.type.toUpperCase()} - focus on ${articleType.focus}
4. Target theme: ${theme}

Return ONLY valid JSON, no markdown, no code blocks.`
              },
              {
                role: 'user',
                content: `Write a ${articleType.type} article about "${theme}" for creator economy professionals.

EXISTING TITLES TO AVOID (do NOT use similar titles):
${existingTitles.slice(0, 15).map(t => `- "${t}"`).join('\n')}

REQUIREMENTS:
1. Title: Must be COMPLETELY DIFFERENT from existing titles above. Be creative and specific. Max 70 chars.
2. Excerpt: Compelling hook, max 160 chars
3. Content: 600-900 words, markdown format, 5+ sections with H2 headings
4. SEO description: max 160 chars
5. Keywords: 5-7 specific terms
6. Topic tags: 2 descriptive tags (e.g., "Monetization", "Growth Strategy")

Include in content: actionable tips, specific examples, creator-focused insights.
Use these placeholders for inline images: ![relevant description](INLINE_IMAGE_1), ![relevant description](INLINE_IMAGE_2)

Return exact JSON:
{"title":"unique specific title","excerpt":"compelling hook","content":"full markdown article","seo_description":"meta description","seo_keywords":["k1","k2","k3","k4","k5"],"topic_tags":["Tag1","Tag2"],"image_keywords":["keyword1","keyword2","keyword3"]}`
              }
            ],
          }),
        });

        if (!topicResponse.ok) {
          console.error(`❌ AI failed attempt ${attempts}`);
          continue;
        }

        const topicData = await topicResponse.json();
        const content = topicData.choices?.[0]?.message?.content || '';
        const blogData = safeParseJson(content);
        
        if (!blogData?.title) {
          console.error(`❌ Parse failed attempt ${attempts}`);
          continue;
        }

        // Check for duplicate titles
        if (isTitleTooSimilar(blogData.title, existingTitles)) {
          console.warn(`⚠️ Title too similar: "${blogData.title}" - retrying...`);
          continue;
        }

        validArticle = blogData;
        // Add to existing titles to prevent duplicates within batch
        existingTitles.push(blogData.title);
      }

      if (!validArticle) {
        console.error(`❌ Failed to generate unique article after ${maxAttempts} attempts`);
        continue;
      }

      console.log(`📰 Article: "${validArticle.title}"`);

      const filenameBase = `${batchTimestamp}-${i}`;

      // Generate title-specific featured image
      const imagePrompt = buildImagePrompt(validArticle.title, articleType.type, theme);
      let featuredImageUrl = await generateImage(imagePrompt, lovableApiKey, supabase, `featured-${filenameBase}`);
      
      if (!featuredImageUrl) {
        console.log('⚠️ Retrying image with simplified prompt...');
        const simplePrompt = `Professional abstract blog header for "${validArticle.title}". Modern minimalist, blue gradients (#053877, #2C6BED), geometric shapes, no text, no faces, 16:9 editorial illustration.`;
        featuredImageUrl = await generateImage(simplePrompt, lovableApiKey, supabase, `featured-${filenameBase}-retry`);
      }

      // Generate inline images
      let finalContent = validArticle.content || '';
      const imageKeywords = validArticle.image_keywords || [theme.split(' ')[0], 'creator', 'professional'];
      
      for (let j = 0; j < 2; j++) {
        const inlinePrompt = `Blog inline illustration for article about ${validArticle.title}. Focus: ${imageKeywords[j] || theme}. Clean modern style, professional, no text, suitable for inline content, subtle blue accents.`;
        const inlineUrl = await generateImage(inlinePrompt, lovableApiKey, supabase, `inline-${filenameBase}-${j}`);
        
        if (inlineUrl) {
          finalContent = finalContent.replace(`INLINE_IMAGE_${j + 1}`, inlineUrl);
        } else {
          finalContent = finalContent.replace(new RegExp(`!\\[[^\\]]*\\]\\(INLINE_IMAGE_${j + 1}\\)`, 'g'), '');
        }
      }

      // Generate unique slug
      const slug = validArticle.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + `-${batchTimestamp}-${i}`;

      const allTags = ['AI Generated', ...(validArticle.topic_tags || [])];

      const { data: insertedPost, error: insertError } = await supabase
        .from('blog_posts')
        .insert({
          user_id: user.id,
          title: validArticle.title,
          slug,
          excerpt: validArticle.excerpt,
          content: finalContent,
          featured_image_url: featuredImageUrl,
          seo_title: validArticle.title,
          seo_description: validArticle.seo_description,
          seo_keywords: allTags,
          status: 'published',
          published_at: new Date().toISOString(),
          publish_to_master: true,
          master_published_at: new Date().toISOString(),
          is_ai_generated: true,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Insert failed:`, insertError);
        continue;
      }

      posts.push(insertedPost);
      console.log(`✅ Created: "${validArticle.title}" (image: ${featuredImageUrl ? 'yes' : 'no'})`);
    }

    console.log(`\n🎉 Generated ${posts.length} new unique blog posts (batch: ${batchId})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        batchId,
        postsCreated: posts.length,
        posts: posts.map(p => ({ id: p.id, title: p.title, hasImage: !!p.featured_image_url }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
