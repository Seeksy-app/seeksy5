import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ONET_BASE_URL = "https://api-v2.onetcenter.org";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ONET_API_KEY = Deno.env.get("ONET_API_KEY");
    if (!ONET_API_KEY) {
      throw new Error("ONET_API_KEY is not configured");
    }

    const { action, params } = await req.json();

    let endpoint = "";
    switch (action) {
      case "about":
        endpoint = "/about/";
        break;
      case "occupations":
        // List all occupations or search
        endpoint = params?.keyword 
          ? `/occupations/?keyword=${encodeURIComponent(params.keyword)}`
          : "/occupations/";
        break;
      case "occupation_details":
        // Get details for a specific occupation
        if (!params?.code) throw new Error("Occupation code required");
        endpoint = `/occupations/${params.code}/`;
        break;
      case "work_values":
        // Get work values for an occupation
        if (!params?.code) throw new Error("Occupation code required");
        endpoint = `/occupations/${params.code}/work_values/`;
        break;
      case "interests":
        // Get interests for an occupation
        if (!params?.code) throw new Error("Occupation code required");
        endpoint = `/occupations/${params.code}/interests/`;
        break;
      case "job_zones":
        // Get job zone info
        endpoint = "/job_zones/";
        break;
      case "job_zone_details":
        if (!params?.zone) throw new Error("Job zone number required");
        endpoint = `/job_zones/${params.zone}/`;
        break;
      case "mnm_careers":
        // My Next Move careers search
        endpoint = params?.keyword 
          ? `/mnm/search/?keyword=${encodeURIComponent(params.keyword)}`
          : "/mnm/careers/";
        break;
      case "career_profile":
        // Get full career profile
        if (!params?.code) throw new Error("Career code required");
        endpoint = `/mnm/careers/${params.code}/`;
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`O*NET API request: ${ONET_BASE_URL}${endpoint}`);

    const response = await fetch(`${ONET_BASE_URL}${endpoint}`, {
      headers: {
        "X-API-Key": ONET_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`O*NET API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `O*NET API error: ${response.status}`,
          details: errorText 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("O*NET proxy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
