import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @ts-ignore - Deno import
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak, Footer, PageNumber, NumberFormat } from "https://esm.sh/docx@8.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("Generating default Stock Purchase Agreement template...");

    // Create the document with all placeholders
    const doc = new Document({
      sections: [{
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page " }),
                  new TextRun({ children: [PageNumber.CURRENT] }),
                  new TextRun({ text: " of " }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "COMMON STOCK PURCHASE AGREEMENT", bold: true, size: 28 }),
            ],
          }),
          new Paragraph({ children: [] }),
          
          // Date and Parties
          new Paragraph({
            children: [
              new TextRun({ text: "This Common Stock Purchase Agreement (this \"Agreement\") is entered into as of " }),
              new TextRun({ text: "[AGREEMENT_DATE]", bold: true }),
              new TextRun({ text: ", by and between:" }),
            ],
          }),
          new Paragraph({ children: [] }),
          
          // Seller
          new Paragraph({
            children: [
              new TextRun({ text: "SELLER: ", bold: true }),
              new TextRun({ text: "[SELLER_NAME]", bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Address: [SELLER_ADDRESS]" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Email: [SELLER_EMAIL]" }),
            ],
          }),
          new Paragraph({ children: [] }),
          
          // Buyer
          new Paragraph({
            children: [
              new TextRun({ text: "BUYER: ", bold: true }),
              new TextRun({ text: "[PURCHASER_NAME]", bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Address: [PURCHASER_ADDRESS]" }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Email: [BUYER_EMAIL]" }),
            ],
          }),
          new Paragraph({ children: [] }),
          
          // Recitals
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "RECITALS", bold: true })],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({
            children: [
              new TextRun({ text: "WHEREAS, Seller desires to sell to Buyer, and Buyer desires to purchase from Seller, " }),
              new TextRun({ text: "[NUMBER_OF_SHARES]", bold: true }),
              new TextRun({ text: " (" }),
              new TextRun({ text: "[NUMBER_OF_SHARES_WORDS]", bold: true }),
              new TextRun({ text: ") shares of common stock of " }),
              new TextRun({ text: "[COMPANY_NAME]", bold: true }),
              new TextRun({ text: " (the \"Company\") at a price of $" }),
              new TextRun({ text: "[PRICE_PER_SHARE]", bold: true }),
              new TextRun({ text: " per share for a total purchase price of $" }),
              new TextRun({ text: "[PURCHASE_AMOUNT]", bold: true }),
              new TextRun({ text: " (the \"Purchase Price\")." }),
            ],
          }),
          new Paragraph({ children: [] }),
          
          // Agreement Section
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "AGREEMENT", bold: true })],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({
            children: [
              new TextRun({ text: "NOW, THEREFORE, in consideration of the mutual covenants and agreements hereinafter set forth and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:" }),
            ],
          }),
          new Paragraph({ children: [] }),
          
          // Section 1
          new Paragraph({
            children: [
              new TextRun({ text: "1. Purchase and Sale of Shares.", bold: true }),
              new TextRun({ text: " Subject to the terms and conditions of this Agreement, Seller hereby agrees to sell to Buyer, and Buyer hereby agrees to purchase from Seller, " }),
              new TextRun({ text: "[NUMBER_OF_SHARES]", bold: true }),
              new TextRun({ text: " shares of the Company's common stock (the \"Shares\") for the Purchase Price." }),
            ],
          }),
          new Paragraph({ children: [] }),
          
          // Section 2
          new Paragraph({
            children: [
              new TextRun({ text: "2. Payment.", bold: true }),
              new TextRun({ text: " Buyer shall pay the Purchase Price of $" }),
              new TextRun({ text: "[PURCHASE_AMOUNT]", bold: true }),
              new TextRun({ text: " to Seller in immediately available funds upon execution of this Agreement." }),
            ],
          }),
          new Paragraph({ children: [] }),
          
          // Section 3 - Investor Certification with checkboxes
          new Paragraph({
            children: [
              new TextRun({ text: "3. Investor Certification.", bold: true }),
              new TextRun({ text: " Buyer represents and warrants that (check one):" }),
            ],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: "[CERT_NET_WORTH]", bold: true }),
              new TextRun({ text: " The Investor is acquiring the Shares for their own account and has an individual net worth, or joint net worth with their spouse, that exceeds $1,000,000." }),
            ],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: "[CERT_INCOME]", bold: true }),
              new TextRun({ text: " The Investor has had individual income in excess of $200,000 in each of the two most recent years, or joint income with their spouse in excess of $300,000 in each of those years." }),
            ],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: "[CERT_DIRECTOR]", bold: true }),
              new TextRun({ text: " The Investor is a director or executive officer of the Company." }),
            ],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({
            indent: { left: 720 },
            children: [
              new TextRun({ text: "[CERT_SOPHISTICATED]", bold: true }),
              new TextRun({ text: " Buyer is acquiring the Shares as a Sophisticated Investor in a private shareholder-to-shareholder transaction exempt under Section 4(a)(1) of the Securities Act of 1933." }),
            ],
          }),
          new Paragraph({ children: [] }),
          
          // Page break before signatures
          new Paragraph({
            children: [new PageBreak()],
          }),
          
          // Signature Section
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "SIGNATURE PAGE", bold: true })],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({
            children: [
              new TextRun({ text: "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above." }),
            ],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [] }),
          
          // Seller Signature
          new Paragraph({
            children: [new TextRun({ text: "SELLER:", bold: true })],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [] }),
          new Paragraph({
            children: [new TextRun({ text: "________________________________________" })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Name: " }),
              new TextRun({ text: "[SELLER_NAME]", bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Address: " }),
              new TextRun({ text: "[SELLER_ADDRESS]", bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Date: " }),
              new TextRun({ text: "[AGREEMENT_DATE]", bold: true }),
            ],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [] }),
          
          // Buyer Signature
          new Paragraph({
            children: [new TextRun({ text: "BUYER:", bold: true })],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [] }),
          new Paragraph({
            children: [new TextRun({ text: "________________________________________" })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Name: " }),
              new TextRun({ text: "[PURCHASER_NAME]", bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Address: " }),
              new TextRun({ text: "[PURCHASER_ADDRESS]", bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Date: " }),
              new TextRun({ text: "[AGREEMENT_DATE]", bold: true }),
            ],
          }),
          new Paragraph({ children: [] }),
          
          // Page break for Joinder
          new Paragraph({
            children: [new PageBreak()],
          }),
          
          // Joinder Agreement
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "JOINDER AGREEMENT", bold: true })],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({
            children: [
              new TextRun({ text: "The undersigned, as " }),
              new TextRun({ text: "[CHAIRMAN_TITLE]", bold: true }),
              new TextRun({ text: " of " }),
              new TextRun({ text: "[COMPANY_NAME]", bold: true }),
              new TextRun({ text: ", hereby acknowledges and consents to the transfer of the Shares from Seller to Buyer as described in the foregoing Common Stock Purchase Agreement." }),
            ],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [] }),
          new Paragraph({
            children: [new TextRun({ text: "[COMPANY_NAME]", bold: true })],
          }),
          new Paragraph({ children: [] }),
          new Paragraph({ children: [] }),
          new Paragraph({
            children: [new TextRun({ text: "________________________________________" })],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Name: " }),
              new TextRun({ text: "[CHAIRMAN_NAME]", bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Title: " }),
              new TextRun({ text: "[CHAIRMAN_TITLE]", bold: true }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Date: " }),
              new TextRun({ text: "[AGREEMENT_DATE]", bold: true }),
            ],
          }),
        ],
      }],
    });

    // Generate the document as base64
    const buffer = await Packer.toBuffer(doc);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    // Also upload to storage for future use
    const { error: uploadError } = await supabase.storage
      .from("legal-templates")
      .upload("investment-documents/stock-purchase-agreement.docx", buffer, {
        upsert: true,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
    } else {
      console.log("Template uploaded to storage successfully");
    }

    return new Response(
      JSON.stringify({ 
        document: base64,
        filename: "Stock_Purchase_Agreement_Template.docx",
        uploaded: !uploadError
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating template:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
