/**
 * VSO Representatives Import Edge Function
 * Scrapes VA OGC Accreditation Search and imports into vso_representatives table
 * Source: https://www.va.gov/ogc/apps/accreditation/index.asp
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VSORepresentative {
  full_name: string;
  organization_name: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  accreditation_type: string;
  source_url: string;
  source_name: string;
  last_verified: string;
  raw_data: Record<string, any>;
}

interface ImportResult {
  success: boolean;
  total_scraped: number;
  total_imported: number;
  duplicates_skipped: number;
  errors: number;
  error_details: string[];
  pages_processed: number;
}

// Parse address components from a full address string
function parseAddress(addressStr: string): { street: string | null; city: string | null; state: string | null; zip: string | null } {
  if (!addressStr) return { street: null, city: null, state: null, zip: null };
  
  // Try to parse "Street, City, ST ZIP" format
  const parts = addressStr.split(',').map(p => p.trim());
  
  if (parts.length >= 2) {
    const street = parts[0] || null;
    const lastPart = parts[parts.length - 1];
    
    // Parse "ST ZIP" or "ST ZIPCODE" from last part
    const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    if (stateZipMatch) {
      const city = parts.length > 2 ? parts.slice(1, -1).join(', ') : parts[1].replace(/\s+[A-Z]{2}\s+\d{5}.*$/, '').trim();
      return {
        street,
        city: city || null,
        state: stateZipMatch[1],
        zip: stateZipMatch[2]
      };
    }
    
    // Fallback: try to extract state and zip from the last part
    const altMatch = lastPart.match(/(.+?)\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);
    if (altMatch) {
      return {
        street,
        city: altMatch[1].trim() || null,
        state: altMatch[2],
        zip: altMatch[3]
      };
    }
  }
  
  // Couldn't parse, return raw address as street
  return { street: addressStr, city: null, state: null, zip: null };
}

// Parse representative data from HTML content
function parseRepresentativesFromHTML(html: string): VSORepresentative[] {
  const representatives: VSORepresentative[] = [];
  const now = new Date().toISOString();
  
  // The VA site displays results in a specific format
  // Look for representative entries - they have a pattern of name, org, address
  
  // Pattern to match representative blocks
  // Format: distance + name + org + address lines
  const repPattern = /<div[^>]*class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
  
  // Alternative: look for structured data patterns
  // Name is typically in bold or header
  const namePattern = /<(?:strong|b|h\d)[^>]*>([^<]+)<\/(?:strong|b|h\d)>/gi;
  
  // Try a different approach - split by separator patterns and extract data
  const lines = html.split(/<hr|<\/tr>|<br\s*\/?>/gi);
  
  let currentRep: Partial<VSORepresentative> | null = null;
  
  for (const line of lines) {
    const cleanLine = line.replace(/<[^>]+>/g, '').trim();
    if (!cleanLine) continue;
    
    // Skip distance indicators
    if (/^\d+\.\d+\s*Mi$/i.test(cleanLine)) continue;
    
    // Check if this looks like a name (usually Title Case, no numbers at start)
    const isName = /^[A-Z][a-zA-Z\-']+(?:\s+[A-Z][a-zA-Z\-']+)+$/.test(cleanLine) ||
                   /^[A-Z][a-zA-Z\-']+,\s+[A-Z][a-zA-Z\-']+/.test(cleanLine);
    
    // Check if this looks like an organization
    const isOrg = /(?:Office|Association|Legion|VFW|DAV|AmVets|Veterans|Affairs|Service|Chapter)/i.test(cleanLine);
    
    // Check if this looks like an address
    const isAddress = /\d+.*(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Ct|Court|Suite|Ste|#)/i.test(cleanLine);
    
    // Check if this looks like a city/state/zip line
    const isCityStateZip = /^[A-Za-z\s]+,?\s+[A-Z]{2}\s+\d{5}/i.test(cleanLine);
    
    if (isName && !isOrg && !isAddress) {
      // Save previous rep if exists
      if (currentRep?.full_name) {
        representatives.push({
          full_name: currentRep.full_name,
          organization_name: currentRep.organization_name || null,
          street_address: currentRep.street_address || null,
          city: currentRep.city || null,
          state: currentRep.state || null,
          zip_code: currentRep.zip_code || null,
          country: 'US',
          accreditation_type: 'VSO Representative',
          source_url: 'https://www.va.gov/ogc/apps/accreditation/index.asp',
          source_name: 'VA OGC Accreditation Search',
          last_verified: now,
          raw_data: { ...currentRep }
        });
      }
      
      // Start new rep
      currentRep = { full_name: cleanLine };
    } else if (currentRep) {
      if (isOrg && !currentRep.organization_name) {
        currentRep.organization_name = cleanLine;
      } else if (isAddress && !currentRep.street_address) {
        currentRep.street_address = cleanLine;
      } else if (isCityStateZip) {
        const parsed = parseAddress(cleanLine);
        currentRep.city = parsed.city;
        currentRep.state = parsed.state;
        currentRep.zip_code = parsed.zip;
      }
    }
  }
  
  // Don't forget the last one
  if (currentRep?.full_name) {
    representatives.push({
      full_name: currentRep.full_name,
      organization_name: currentRep.organization_name || null,
      street_address: currentRep.street_address || null,
      city: currentRep.city || null,
      state: currentRep.state || null,
      zip_code: currentRep.zip_code || null,
      country: 'US',
      accreditation_type: 'VSO Representative',
      source_url: 'https://www.va.gov/ogc/apps/accreditation/index.asp',
      source_name: 'VA OGC Accreditation Search',
      last_verified: now,
      raw_data: { ...currentRep }
    });
  }
  
  return representatives;
}

// Scrape a single page from VA OGC
async function scrapePage(pageNum: number, firecrawlApiKey: string): Promise<{ html: string; success: boolean; error?: string }> {
  try {
    // The VA site uses POST for pagination with ViewState
    // We'll try scraping the search results URL with page parameter
    const searchUrl = `https://www.va.gov/ogc/apps/accreditation/index.asp`;
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ['html'],
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { html: '', success: false, error: data.error || 'Scrape failed' };
    }

    return { html: data.data?.html || data.html || '', success: true };
  } catch (error) {
    return { html: '', success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batch_size = 100, start_page = 1, max_pages = 10, dry_run = false } = await req.json().catch(() => ({}));

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

    const result: ImportResult = {
      success: true,
      total_scraped: 0,
      total_imported: 0,
      duplicates_skipped: 0,
      errors: 0,
      error_details: [],
      pages_processed: 0
    };

    console.log(`[VSO Import] Starting import - batch_size: ${batch_size}, start_page: ${start_page}, max_pages: ${max_pages}`);

    // The VA site is challenging to paginate programmatically due to ASP.NET ViewState
    // For now, we'll scrape the initial page and note the limitation
    
    // Attempt to scrape the search results
    const scrapeResult = await scrapePage(1, firecrawlApiKey);
    
    if (!scrapeResult.success) {
      console.error(`[VSO Import] Failed to scrape page: ${scrapeResult.error}`);
      result.error_details.push(`Page scrape failed: ${scrapeResult.error}`);
      result.errors++;
    } else {
      result.pages_processed++;
      
      // Parse representatives from HTML
      const representatives = parseRepresentativesFromHTML(scrapeResult.html);
      result.total_scraped = representatives.length;
      
      console.log(`[VSO Import] Parsed ${representatives.length} representatives from page`);
      
      if (!dry_run && representatives.length > 0) {
        // Insert in batches
        for (let i = 0; i < representatives.length; i += batch_size) {
          const batch = representatives.slice(i, i + batch_size);
          
          const { data, error } = await supabase
            .from('vso_representatives')
            .upsert(batch, {
              onConflict: 'full_name,organization_name,street_address',
              ignoreDuplicates: true
            })
            .select('id');
          
          if (error) {
            console.error(`[VSO Import] Batch insert error:`, error);
            result.error_details.push(`Batch ${i}-${i + batch_size}: ${error.message}`);
            result.errors++;
          } else {
            result.total_imported += data?.length || 0;
          }
          
          // Rate limit between batches
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        result.duplicates_skipped = result.total_scraped - result.total_imported;
      }
    }

    // Log import event
    console.log(`[VSO Import] Complete - Scraped: ${result.total_scraped}, Imported: ${result.total_imported}, Duplicates: ${result.duplicates_skipped}, Errors: ${result.errors}`);

    // Note about VA site limitations
    const notes = [
      'The VA OGC Accreditation Search uses ASP.NET with ViewState for pagination.',
      'Full pagination requires form submission with ViewState tokens.',
      'Consider using a headless browser service for complete data extraction.',
      'Alternative: Request bulk data export from VA OGC directly.'
    ];

    return new Response(
      JSON.stringify({ 
        ...result, 
        notes,
        message: result.total_imported > 0 
          ? `Successfully imported ${result.total_imported} VSO representatives`
          : 'Scraping initiated but no records extracted. See notes for limitations.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[VSO Import] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Import failed'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
