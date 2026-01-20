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
    // Get confirmation code from query params
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (!code) {
      throw new Error('No confirmation code provided');
    }

    // Return a simple HTML page confirming data deletion
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Data Deletion Confirmation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            padding: 20px;
            text-align: center;
          }
          .container {
            background: #f8f9fa;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          h1 {
            color: #1877f2;
            margin-bottom: 20px;
          }
          p {
            color: #65676b;
            line-height: 1.6;
          }
          .code {
            background: white;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            margin: 20px 0;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Data Deletion Confirmed</h1>
          <p>Your data associated with Seeksy has been successfully deleted.</p>
          <p class="code">Confirmation Code: ${code}</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
      status: 200
    });

  } catch (error) {
    console.error('Error in meta-data-deletion-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            padding: 20px;
            text-align: center;
          }
          .container {
            background: #fff5f5;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          h1 {
            color: #e53e3e;
            margin-bottom: 20px;
          }
          p {
            color: #65676b;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Error</h1>
          <p>${errorMessage}</p>
        </div>
      </body>
      </html>
    `;
    
    return new Response(errorHtml, {
      headers: { 'Content-Type': 'text/html' },
      status: 400
    });
  }
});
