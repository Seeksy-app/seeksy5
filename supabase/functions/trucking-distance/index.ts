import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pickup, delivery } = await req.json();

    if (!pickup?.city || !pickup?.state || !delivery?.city || !delivery?.state) {
      return new Response(
        JSON.stringify({ error: 'Missing required address fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build address strings
    const pickupAddress = `${pickup.city}, ${pickup.state}${pickup.zip ? ' ' + pickup.zip : ''}, USA`;
    const deliveryAddress = `${delivery.city}, ${delivery.state}${delivery.zip ? ' ' + delivery.zip : ''}, USA`;

    console.log(`[trucking-distance] Calculating distance from "${pickupAddress}" to "${deliveryAddress}"`);

    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN');
    if (!mapboxToken) {
      console.error('[trucking-distance] MAPBOX_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'distance_lookup_failed', message: 'Mapbox API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, geocode both addresses using Mapbox Geocoding API
    const [pickupGeoRes, deliveryGeoRes] = await Promise.all([
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(pickupAddress)}.json?access_token=${mapboxToken}&limit=1&types=place,locality,address`),
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(deliveryAddress)}.json?access_token=${mapboxToken}&limit=1&types=place,locality,address`)
    ]);

    if (!pickupGeoRes.ok || !deliveryGeoRes.ok) {
      console.error('[trucking-distance] Geocoding failed', { 
        pickupStatus: pickupGeoRes.status, 
        deliveryStatus: deliveryGeoRes.status 
      });
      return new Response(
        JSON.stringify({ error: 'distance_lookup_failed', message: 'Geocoding failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pickupGeo = await pickupGeoRes.json();
    const deliveryGeo = await deliveryGeoRes.json();

    if (!pickupGeo.features?.[0]?.center || !deliveryGeo.features?.[0]?.center) {
      console.error('[trucking-distance] No geocoding results', { 
        pickupFeatures: pickupGeo.features?.length, 
        deliveryFeatures: deliveryGeo.features?.length 
      });
      return new Response(
        JSON.stringify({ error: 'distance_lookup_failed', message: 'Could not geocode addresses' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mapbox returns [longitude, latitude]
    const pickupCoords = pickupGeo.features[0].center;
    const deliveryCoords = deliveryGeo.features[0].center;

    console.log('[trucking-distance] Geocoded coordinates:', {
      pickup: pickupCoords,
      delivery: deliveryCoords
    });

    // Now get driving distance using Mapbox Directions API
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords[0]},${pickupCoords[1]};${deliveryCoords[0]},${deliveryCoords[1]}?access_token=${mapboxToken}&geometries=geojson`;
    
    const directionsRes = await fetch(directionsUrl);

    if (!directionsRes.ok) {
      console.error('[trucking-distance] Directions API failed', { status: directionsRes.status });
      return new Response(
        JSON.stringify({ error: 'distance_lookup_failed', message: 'Directions lookup failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const directionsData = await directionsRes.json();
    
    if (!directionsData.routes?.[0]?.distance) {
      console.error('[trucking-distance] No route found', directionsData);
      return new Response(
        JSON.stringify({ error: 'distance_lookup_failed', message: 'No route found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Distance is in meters, convert to miles
    const distanceMeters = directionsData.routes[0].distance;
    const distanceMiles = distanceMeters / 1609.344;
    const durationSeconds = directionsData.routes[0].duration;
    const durationHours = durationSeconds / 3600;

    console.log(`[trucking-distance] Distance calculated: ${distanceMiles.toFixed(1)} miles, ${durationHours.toFixed(1)} hours`);

    return new Response(
      JSON.stringify({ 
        distance_miles: Math.round(distanceMiles),
        duration_hours: parseFloat(durationHours.toFixed(1))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[trucking-distance] Error calculating distance:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'distance_lookup_failed', message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
