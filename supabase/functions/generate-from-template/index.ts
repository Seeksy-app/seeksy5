import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore - Deno import
import Docxtemplater from "https://esm.sh/docxtemplater@3.47.0";
// @ts-ignore - Deno import
import PizZip from "https://esm.sh/pizzip@3.1.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  templateName?: string;
  purchaserName: string;
  purchaserAddress: string;
  purchaserEmail?: string;
  sellerName?: string;
  sellerAddress?: string;
  sellerEmail?: string;
  chairmanName?: string;
  chairmanTitle?: string;
  companyName?: string;
  numberOfShares: number;
  pricePerShare: number;
  purchaseAmount?: number; // Pre-calculated total (for add-on pricing)
  agreementDate?: string;
  investorCertification?: string;
  // Tiered pricing breakdown for dynamic purchase summary
  tier1Shares?: number;
  tier1Price?: number;
  tier2Shares?: number;
  tier2Price?: number;
  addonShares?: number;
  addonPrice?: number;
  // Checkbox markers for investor certification
  certNetWorth?: string;
  certIncome?: string;
  certDirector?: string;
  certSophisticated?: string;
}

// Convert number to words (for shares)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? '-' + ones[num % 10] : '');
  if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
  if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
  return num.toLocaleString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: RequestBody = await req.json();
    const { 
      templateName = "stock-purchase-agreement.docx",
      purchaserName, 
      purchaserAddress,
      purchaserEmail = "",
      sellerName = "Seeksy, Inc.",
      sellerAddress = "",
      sellerEmail = "",
      chairmanName = "",
      chairmanTitle = "Chairman of the Board",
      companyName = "Seeksy, Inc.",
      numberOfShares, 
      pricePerShare, 
      agreementDate,
      investorCertification = "",
    } = body;

    // Determine which certification checkbox should be checked
    const isSophisticated = investorCertification.includes("Sophisticated Investor") || investorCertification.includes("Section 4(a)(1)");
    const isNetWorth = investorCertification.includes("net worth");
    const isIncome = investorCertification.includes("income");
    const isDirector = investorCertification.includes("Director") || investorCertification.includes("executive officer");
    
    // Unicode checkbox characters: ☑ (checked) or ☐ (unchecked)
    const certSophisticated = isSophisticated ? "☑" : "☐";
    const certNetWorth = isNetWorth && !isSophisticated ? "☑" : "☐";
    const certIncome = isIncome && !isSophisticated ? "☑" : "☐";
    const certDirector = isDirector && !isSophisticated ? "☑" : "☐";

    // Construct template path - check if it's in the investment-documents folder
    const templatePath = templateName.includes('/') 
      ? templateName 
      : `investment-documents/${templateName}`;

    console.log("Generating document from template for:", purchaserName);
    console.log("Template path:", templatePath);

    // Use pre-calculated purchaseAmount if provided (for add-on pricing), otherwise calculate
    const purchaseAmountFromBody = body.purchaseAmount;
    const totalAmount = purchaseAmountFromBody ? purchaseAmountFromBody : (numberOfShares * pricePerShare);
    const sharesInWords = numberToWords(numberOfShares);

    // Extract tier pricing details
    const tier1Shares = body.tier1Shares || 0;
    const tier1Price = body.tier1Price || pricePerShare;
    const tier2Shares = body.tier2Shares || 0;
    const tier2Price = body.tier2Price || pricePerShare;
    const addonShares = body.addonShares || 0;
    const addonPrice = body.addonPrice || pricePerShare;

    // Generate dynamic purchase breakdown text
    // Example: "at a purchase price(s) of $0.20 (40,000 shares) and $0.25 (5,000 shares) (or an aggregate of $11,000.00)"
    const buildPurchaseBreakdown = () => {
      const parts: string[] = [];
      
      if (tier1Shares > 0) {
        parts.push(`$${tier1Price.toFixed(2)} (${tier1Shares.toLocaleString()} shares)`);
      }
      if (tier2Shares > 0) {
        parts.push(`$${tier2Price.toFixed(2)} (${tier2Shares.toLocaleString()} shares)`);
      }
      if (addonShares > 0) {
        parts.push(`$${addonPrice.toFixed(2)} (${addonShares.toLocaleString()} add-on shares)`);
      }
      
      // If no tiered pricing, use single price
      if (parts.length === 0) {
        return `at a purchase price of $${pricePerShare.toFixed(2)} per share (or an aggregate of $${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
      }
      
      // Format: "at a purchase price(s) of X and Y (or an aggregate of $Z)"
      const priceText = parts.length > 1 
        ? `at a purchase price(s) of ${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
        : `at a purchase price of ${parts[0]}`;
      
      return `${priceText} (or an aggregate of $${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    };

    const purchaseBreakdown = buildPurchaseBreakdown();
    console.log("Purchase breakdown text:", purchaseBreakdown);

    // Download template from storage
    const { data: templateBlob, error: downloadError } = await supabase.storage
      .from("legal-templates")
      .download(templatePath);

    if (downloadError || !templateBlob) {
      console.error("Template download error:", downloadError);
      return new Response(
        JSON.stringify({ 
          error: "Template not found. Please upload your Word template first.",
          details: downloadError?.message 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Template downloaded, size:", templateBlob.size);

    // Convert blob to array buffer
    const templateBuffer = await templateBlob.arrayBuffer();
    const templateArray = new Uint8Array(templateBuffer);

    // Load the template with PizZip
    const zip = new PizZip(templateArray);
    
    // Pre-process: protect SignWell text tags from docxtemplater parsing
    // SignWell tags like [[s|seller]] get split by Word across XML elements:
    // [[s|se</w:t></w:r><w:r><w:t>ller]] or even more fragmented
    // We need to find these patterns and replace them with safe placeholders
    
    // SignWell signature tag mapping: purchaser=1, seller=2, chairman=3
    const tagIndexMap: Record<string, number> = {
      'purchaser': 1,
      'seller': 2,
      'chairman': 3
    };
    
    const protectSignWellTags = (content: string): string => {
      // First, protect {{signature:N}} format that's already in the template
      // These get mangled by docxtemplater even with square bracket delimiters
      // Handle fragmented XML: {{sig</w:t></w:r><w:r><w:t>nature:1}}
      for (let i = 1; i <= 3; i++) {
        // Simple direct replacement first
        content = content.split(`{{signature:${i}}}`).join(`__SIGNWELL_SIG_${i}__`);
        
        // Also handle XML-fragmented versions where Word splits the tag
        // Pattern: {{ followed by any XML fragments, then signature:N, then }}
        const fragmentedPattern = new RegExp(
          `\\{\\{(?:<[^>]*>)*s(?:<[^>]*>)*i(?:<[^>]*>)*g(?:<[^>]*>)*n(?:<[^>]*>)*a(?:<[^>]*>)*t(?:<[^>]*>)*u(?:<[^>]*>)*r(?:<[^>]*>)*e(?:<[^>]*>)*:(?:<[^>]*>)*${i}(?:<[^>]*>)*\\}\\}`,
          'gi'
        );
        content = content.replace(fragmentedPattern, `__SIGNWELL_SIG_${i}__`);
      }
      
      // Also protect [[s|tagname]] format for backwards compatibility
      for (const [tagName, index] of Object.entries(tagIndexMap)) {
        const tag = `[[s|${tagName}]]`;
        content = content.split(tag).join(`__SIGNWELL_SIG_${index}__`);
        content = content.split(tag.toUpperCase()).join(`__SIGNWELL_SIG_${index}__`);
      }
      return content;
    };
    
    const restoreSignWellTags = (content: string): string => {
      // Restore to SignWell's {{signature:N}} format
      return content.replace(/__SIGNWELL_SIG_(\d+)__/g, '{{signature:$1}}');
    };
    
    // Pre-process the document.xml to protect SignWell tags
    const docXml = zip.files["word/document.xml"];
    if (docXml) {
      let content = docXml.asText();
      console.log("Pre-processing document.xml for SignWell tags...");
      const originalLength = content.length;
      content = protectSignWellTags(content);
      console.log(`Pre-processing complete. Length changed: ${originalLength !== content.length}`);
      zip.file("word/document.xml", content);
    }
    
    // Create docxtemplater instance with square bracket delimiters
    // and nullGetter to prevent undefined values from appearing
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: "[",
        end: "]"
      },
      // Handle any undefined placeholders gracefully - keep original text or show empty
      nullGetter: function(part: any) {
        // If the tag isn't found in data, keep the original placeholder text
        // This prevents "undefined" from appearing in the document
        if (!part.module) {
          // Return the original tag so user can see which placeholder wasn't replaced
          return `[${part.value}]`;
        }
        return "";
      }
    });

    // Format the date
    const formattedDate = agreementDate || new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    // Set template data - matches placeholders like [PURCHASER_NAME]
    const templateData = {
      // Buyer/Purchaser placeholders (used on multiple signature pages)
      PURCHASER_NAME: purchaserName,
      PURCHASER_ADDRESS: purchaserAddress,
      PURCHASER_EMAIL: purchaserEmail,
      BUYER_NAME: purchaserName,
      BUYER_ADDRESS: purchaserAddress,
      BUYER_EMAIL: purchaserEmail,
      
      // Seller placeholders
      SELLER_NAME: sellerName,
      SELLER_ADDRESS: sellerAddress,
      SELLER_EMAIL: sellerEmail,
      
      // Chairman and Company placeholders (for Joinder Agreement)
      CHAIRMAN_NAME: chairmanName,
      CHAIRMAN_TITLE: chairmanTitle,
      COMPANY_NAME: companyName,
      
      // Share/Amount placeholders
      NUMBER_OF_SHARES: numberOfShares.toLocaleString(),
      NUMBER_OF_SHARES_WORDS: sharesInWords,
      PRICE_PER_SHARE: pricePerShare.toFixed(2),
      PURCHASE_AMOUNT: totalAmount.toFixed(2),
      TOTAL_AMOUNT: totalAmount.toFixed(2),
      PURCHASE_BREAKDOWN: purchaseBreakdown,
      AGREEMENT_DATE: formattedDate,
      DATE: formattedDate,
      
      // Investor certification placeholder and checkboxes
      INVESTOR_CERTIFICATION: investorCertification || "N/A",
      CERT_NET_WORTH: certNetWorth,
      CERT_INCOME: certIncome,
      CERT_DIRECTOR: certDirector,
      CERT_SOPHISTICATED: certSophisticated,
      
      // Transferee name for Stock Power (Exhibit A)
      TRANSFEREE_NAME: purchaserName,
      
      // Page marker placeholders - replace with proper text or empty
      PAGE_BLANK: "[The remainder of this page is intentionally left blank.]",
      PAGE_NUMBER: "", // Page numbers are handled by Word, not template
      BLANK_PAGE: "[This page intentionally left blank.]",
      REST_OF_PAGE_BLANK: "[The remainder of this page is intentionally left blank.]",
      
      // Alternative formats users might use (camelCase)
      purchaserName,
      purchaserAddress,
      purchaserEmail,
      sellerName,
      sellerAddress,
      sellerEmail,
      chairmanName,
      chairmanTitle,
      companyName,
      numberOfShares: numberOfShares.toLocaleString(),
      numberOfSharesWords: sharesInWords,
      pricePerShare: pricePerShare.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      purchaseAmount: totalAmount.toFixed(2),
      agreementDate: formattedDate,
      date: formattedDate,
      investorCertification: investorCertification || "N/A",
      certNetWorth,
      certIncome,
      certDirector,
      certSophisticated,
      transfereeName: purchaserName,
      pageBlank: "[The remainder of this page is intentionally left blank.]",
      blankPage: "[This page intentionally left blank.]",
    };

    console.log("Rendering document with data:", JSON.stringify(templateData, null, 2));

    // Render the document
    doc.render(templateData);

    // Post-process: restore SignWell text tags in the rendered document
    const renderedZip = doc.getZip();
    const renderedDocXml = renderedZip.files["word/document.xml"];
    if (renderedDocXml) {
      let content = renderedDocXml.asText();
      content = restoreSignWellTags(content);
      renderedZip.file("word/document.xml", content);
    }

    // Generate output as base64
    const output = renderedZip.generate({
      type: "base64",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    console.log("Document generated successfully from template");

    return new Response(
      JSON.stringify({ 
        document: output,
        filename: `Stock_Purchase_Agreement_${purchaserName.replace(/\s+/g, "_")}.docx`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating document from template:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
