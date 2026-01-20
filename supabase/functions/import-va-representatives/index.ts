/**
 * VA Accredited Representatives Import Edge Function
 * Scrapes VA.gov Find Rep tool and imports into vso_representatives table
 * Source: https://www.va.gov/get-help-from-accredited-representative/find-rep/
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VARepresentative {
  full_name: string;
  organization_name: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  country: string;
  accreditation_type: string;
  source_url: string;
  source_name: string;
  raw_data: Record<string, any>;
}

// Parse address from VA format "123 Main St\n\nCity, ST 12345"
function parseVAAddress(addressLines: string[]): { street: string | null; city: string | null; state: string | null; zip: string | null } {
  if (!addressLines || addressLines.length === 0) {
    return { street: null, city: null, state: null, zip: null };
  }
  
  const street = addressLines[0] || null;
  const cityStateZip = addressLines[addressLines.length - 1] || '';
  
  // Parse "City, ST 12345" or "City, ST 12345-6789"
  const match = cityStateZip.match(/^(.+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/);
  if (match) {
    return {
      street,
      city: match[1].trim(),
      state: match[2],
      zip: match[3]
    };
  }
  
  return { street, city: null, state: null, zip: null };
}

// Parse representatives from scraped markdown
function parseRepresentativesFromMarkdown(markdown: string, repType: string): VARepresentative[] {
  const representatives: VARepresentative[] = [];
  
  // Split by distance markers (e.g., "5351.98 Mi")
  const sections = markdown.split(/\n\d+\.?\d*\s*Mi\n/);
  
  for (const section of sections) {
    const lines = section.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) continue;
    
    // Look for name pattern (### Name)
    const nameMatch = section.match(/###\s+([^\n]+)/);
    if (!nameMatch) continue;
    
    const name = nameMatch[1].trim();
    if (!name || name.length < 3) continue;
    
    // Extract address (link to maps.google.com)
    const addressMatch = section.match(/\[([^\]]+)\]\(https:\/\/maps\.google\.com/);
    let street = null, city = null, state = null, zip = null;
    
    if (addressMatch) {
      const addressText = addressMatch[1].replace(/\\\\/g, '').replace(/\\n/g, '\n');
      const addressLines = addressText.split('\n').map(l => l.trim()).filter(l => l);
      const parsed = parseVAAddress(addressLines);
      street = parsed.street;
      city = parsed.city;
      state = parsed.state;
      zip = parsed.zip;
    }
    
    // Extract phone
    const phoneMatch = section.match(/\[(\d{3}-\d{3}-\d{4})\]\(tel:/);
    const phone = phoneMatch ? phoneMatch[1] : null;
    
    // Extract email
    const emailMatch = section.match(/\[([^\]]+@[^\]]+)\]\(mailto:/);
    const email = emailMatch ? emailMatch[1].replace(/\\_/g, '_') : null;
    
    representatives.push({
      full_name: name,
      organization_name: null,
      street_address: street,
      city,
      state,
      zip_code: zip,
      phone,
      email,
      country: 'US',
      accreditation_type: repType,
      source_url: 'https://www.va.gov/get-help-from-accredited-representative/find-rep/',
      source_name: 'VA Accredited Representative Search',
      raw_data: { name, street, city, state, zip, phone, email }
    });
  }
  
  return representatives;
}

// Scrape a page using Firecrawl
async function scrapePage(pageNum: number, repType: string, firecrawlApiKey: string): Promise<{ markdown: string; success: boolean; error?: string }> {
  try {
    const typeParam = repType === 'claim_agents' ? 'claim_agents' : 
                      repType === 'attorney' ? 'attorney' : 'veteran_service_officer';
    
    const searchUrl = `https://www.va.gov/get-help-from-accredited-representative/find-rep/?address=United%20States&lat=39.8283&long=-98.5795&page=${pageNum}&perPage=10&sort=distance_asc&type=${typeParam}&distance=Show%20all`;
    
    console.log(`[VA Import] Scraping page ${pageNum}: ${searchUrl}`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['markdown'],
        waitFor: 5000, // Wait for React to render
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { markdown: '', success: false, error: data.error || 'Scrape failed' };
    }

    return { markdown: data.data?.markdown || data.markdown || '', success: true };
  } catch (error) {
    return { markdown: '', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      rep_type = 'claim_agents', // 'claim_agents', 'attorney', 'veteran_service_officer'
      start_page = 1, 
      max_pages = 5, // Limit pages per run to avoid timeout
      delay_ms = 2000, // Delay between requests
      dry_run = false 
    } = await req.json().catch(() => ({}));

    // Get API keys
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY_1') || Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const repTypeLabel = rep_type === 'claim_agents' ? 'Accredited Claims Agent' :
                         rep_type === 'attorney' ? 'Accredited Attorney' : 'Accredited VSO Representative';

    const result = {
      success: true,
      rep_type: repTypeLabel,
      total_scraped: 0,
      total_imported: 0,
      duplicates_skipped: 0,
      errors: 0,
      error_details: [] as string[],
      pages_processed: 0,
      next_page: start_page
    };

    console.log(`[VA Import] Starting import - type: ${rep_type}, start_page: ${start_page}, max_pages: ${max_pages}`);

    for (let page = start_page; page < start_page + max_pages; page++) {
      const scrapeResult = await scrapePage(page, rep_type, firecrawlApiKey);
      
      if (!scrapeResult.success) {
        console.error(`[VA Import] Failed to scrape page ${page}: ${scrapeResult.error}`);
        result.error_details.push(`Page ${page}: ${scrapeResult.error}`);
        result.errors++;
        continue;
      }

      result.pages_processed++;
      
      // Check if we've reached the end (no more results)
      if (!scrapeResult.markdown.includes('###') || scrapeResult.markdown.includes('No results found')) {
        console.log(`[VA Import] No more results at page ${page}`);
        break;
      }

      // Parse representatives from markdown
      const representatives = parseRepresentativesFromMarkdown(scrapeResult.markdown, repTypeLabel);
      result.total_scraped += representatives.length;
      
      console.log(`[VA Import] Page ${page}: Parsed ${representatives.length} representatives`);

      if (!dry_run && representatives.length > 0) {
        // Insert into database
        const { data, error } = await supabase
          .from('vso_representatives')
          .upsert(representatives, {
            onConflict: 'full_name,organization_name,street_address',
            ignoreDuplicates: true
          })
          .select('id');
        
        if (error) {
          console.error(`[VA Import] Insert error:`, error);
          result.error_details.push(`Page ${page} insert: ${error.message}`);
          result.errors++;
        } else {
          result.total_imported += data?.length || 0;
        }
      }

      result.next_page = page + 1;

      // Rate limit
      if (page < start_page + max_pages - 1) {
        await new Promise(resolve => setTimeout(resolve, delay_ms));
      }
    }

    result.duplicates_skipped = result.total_scraped - result.total_imported;

    console.log(`[VA Import] Complete - Scraped: ${result.total_scraped}, Imported: ${result.total_imported}, Pages: ${result.pages_processed}`);

    return new Response(
      JSON.stringify({ 
        ...result, 
        message: result.total_imported > 0 
          ? `Imported ${result.total_imported} ${repTypeLabel}s. Next page: ${result.next_page}`
          : `Scraped ${result.total_scraped} records. Run again with start_page=${result.next_page} to continue.`,
        instructions: 'Call again with start_page=' + result.next_page + ' to continue importing more pages.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[VA Import] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Import failed'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
