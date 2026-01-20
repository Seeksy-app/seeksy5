import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import docx from "https://esm.sh/docx@8.2.0?bundle";

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } = docx;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Generate a Word document template with placeholders
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Title
            new Paragraph({
              children: [
                new TextRun({
                  text: "COMMON STOCK PURCHASE AGREEMENT",
                  bold: true,
                  size: 28,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            
            // Preamble
            new Paragraph({
              children: [
                new TextRun({
                  text: 'THIS COMMON STOCK PURCHASE AGREEMENT (this "Agreement") is made and entered into as of ',
                }),
                new TextRun({
                  text: "[AGREEMENT_DATE]",
                  bold: true,
                  highlight: "yellow",
                }),
                new TextRun({
                  text: ', by and between ',
                }),
                new TextRun({
                  text: "[SELLER_NAME]",
                  bold: true,
                  highlight: "yellow",
                }),
                new TextRun({
                  text: ' ("Seller"), on the one hand, and ',
                }),
                new TextRun({
                  text: "[BUYER_NAME]",
                  bold: true,
                  highlight: "yellow",
                }),
                new TextRun({
                  text: ' ("Buyer"), on the other hand. All terms not otherwise defined herein shall have the meaning set forth in that certain Stockholders\' Agreement, dated May 20, 2025, by and among Parade Deck Holdings, Inc., a Delaware corporation (the "Company"), and holders of Capital Stock of the Company identified therein (the "Stockholders\' Agreement").',
                }),
              ],
              spacing: { after: 300 },
            }),
            
            // RECITALS Header
            new Paragraph({
              children: [
                new TextRun({
                  text: "RECITALS",
                  bold: true,
                  size: 24,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            
            // Recital A
            new Paragraph({
              children: [
                new TextRun({
                  text: "A. Seller desires to sell all of his right, title, and interest in an aggregate of ",
                }),
                new TextRun({
                  text: "[NUMBER_OF_SHARES]",
                  bold: true,
                  highlight: "yellow",
                }),
                new TextRun({
                  text: ' shares of common stock, par value $0.0001 per share, ("Common Stock") of the Company to Buyer. The shares of Common Stock sold hereunder are referred to as the "Purchased Shares."',
                }),
              ],
              spacing: { after: 200 },
            }),
            
            // Recital B
            new Paragraph({
              children: [
                new TextRun({
                  text: "B. Buyer desires to purchase the Purchased Shares as herein described on the terms and conditions hereinafter set forth.",
                }),
              ],
              spacing: { after: 300 },
            }),
            
            // AGREEMENT Header
            new Paragraph({
              children: [
                new TextRun({
                  text: "AGREEMENT",
                  bold: true,
                  size: 24,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "NOW, THEREFORE, in consideration of the foregoing recitals and the mutual obligations set forth in this Agreement, the parties hereto agree as follows:",
                }),
              ],
              spacing: { after: 300 },
            }),
            
            // Section 1
            new Paragraph({
              children: [
                new TextRun({
                  text: "1. Purchase and Sale of the Purchased Shares. ",
                  bold: true,
                }),
                new TextRun({
                  text: 'Subject to the terms and conditions of this Agreement, at the "Closing" (as hereinafter defined), Seller agrees to sell, convey, transfer, and assign to Buyer, and Buyer agrees to purchase from Seller, the Purchased Shares at a purchase price of $',
                }),
                new TextRun({
                  text: "[PRICE_PER_SHARE]",
                  bold: true,
                  highlight: "yellow",
                }),
                new TextRun({
                  text: " per share (or an aggregate of $",
                }),
                new TextRun({
                  text: "[PURCHASE_AMOUNT]",
                  bold: true,
                  highlight: "yellow",
                }),
                new TextRun({
                  text: ') (the "Purchase Price").',
                }),
              ],
              spacing: { after: 200 },
            }),
            
            // Section 2
            new Paragraph({
              children: [
                new TextRun({
                  text: "2. Closing. ",
                  bold: true,
                }),
                new TextRun({
                  text: 'Subject to the terms and conditions of this Agreement, the consummation of the transaction contemplated by this Agreement (the "Closing") shall take place remotely by exchange of documents and signatures (or their electronic counterparts) within three (3) business days of the satisfaction of the conditions set forth below. The date on which the Closing is to occur is herein referred to as the "Closing Date."',
                }),
              ],
              spacing: { after: 200 },
            }),
            
            // Section 2(a)
            new Paragraph({
              children: [
                new TextRun({
                  text: "(a) Conditions Precedent. ",
                  bold: true,
                }),
                new TextRun({
                  text: "The obligations of Buyer and Seller to consummate the transactions contemplated by this Agreement are subject to the satisfaction of the following conditions on or before the Closing Date:",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(i) Corporate Name Change. ",
                  bold: true,
                }),
                new TextRun({
                  text: 'All necessary corporate action on the part of the directors and stockholders of the Company approving the name change of the Company from "Parade Deck" to "Alchify" shall have been duly and validly taken.',
                }),
              ],
              indent: { left: 720 },
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(ii) Stockholders' Agreement. ",
                  bold: true,
                }),
                new TextRun({
                  text: "The stockholders of the Company shall have entered into an amended and restated Stockholders' Agreement for the Company revising the structure of the Board of Directors.",
                }),
              ],
              indent: { left: 720 },
              spacing: { after: 200 },
            }),
            
            // Section 2(b)
            new Paragraph({
              children: [
                new TextRun({
                  text: "(b) Obligations of Seller. ",
                  bold: true,
                }),
                new TextRun({
                  text: "At the Closing, Seller shall deliver to the Company (i) a certificate or certificates evidencing the sufficient number of shares of Common Stock of the Company to permit the Company to transfer to Buyer a certificate evidencing the number of Purchased Shares to be purchased by Buyer from Seller, and (ii) the duly executed stock power attached to this Agreement as Exhibit A (the \"Stock Power\").",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            // Section 2(c)
            new Paragraph({
              children: [
                new TextRun({
                  text: "(c) Obligations of Buyer. ",
                  bold: true,
                }),
                new TextRun({
                  text: "At the Closing, Buyer shall deliver (i) to Seller the Purchase Price in immediately available funds by wire transfer in accordance with the wire transfer instructions delivered by Seller to Buyer, and (ii) to the Company a duly executed joinder agreement to the Stockholders' Agreement in the form attached hereto as Exhibit C.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 300 },
            }),
            
            // Section 3 - Representations and Warranties of Seller
            new Paragraph({
              children: [
                new TextRun({
                  text: "3. Representations and Warranties of Seller.",
                  bold: true,
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Seller hereby represents and warrants with respect to the Purchased Shares owned by Seller as follows as of the date hereof and as of the Closing Date:",
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(a) Title to the Shares. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Seller is the lawful owner, beneficially and of record, of the applicable number of Purchased Shares and holds legal and equitable title to the Purchased Shares free and clear of any and all liens, claims, charges, pledges, encumbrances, security interests, equities, options, and restrictions, except for the restrictions set forth in the Stockholders' Agreement. The transfer of the Purchased Shares by Seller to Buyer pursuant to this Agreement is not subject to any right of first refusal, preemptive, tag-along, drag-along right, or other comparable obligations or restrictions with respect to the transaction contemplated herein, that have not been complied with, waived, or voided.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(b) Authority and Consent. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Seller has the right, power, legal capacity, and authority to enter into and perform Seller's obligations under this Agreement, and no approvals or consent of any governmental or regulatory authority or other persons is necessary in connection herewith.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(c) No Violation or Breach. ",
                  bold: true,
                }),
                new TextRun({
                  text: "The execution and delivery of this Agreement and the consummation of the transactions contemplated herein shall not violate or result in the breach by Seller of, or constitute a default under, or conflict with, or cause any acceleration of any obligation with respect to any provision or restriction of any material loan, mortgage, lien, agreement, contract, instrument, order, judgment, award, decree, or any other restriction of any kind or character to which any material assets or properties of Seller is subject or by which Seller is bound.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(d) Reliance on Advisors. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Seller, in determining to sell the Shares, (i) understands that Seller may recognize taxable gain or loss as a result of the sale of the Shares, (ii) has been encouraged to and has had the opportunity to rely upon the advice of Seller's legal and tax counsel, accountants, and other advisors with respect to the sale of the Shares, and (iii) has relied solely upon the advice of Seller's legal and tax counsel, accountants, or other financial advisors with respect to the financial, tax, and other considerations relating to the sale of the Shares.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(e) Absence of Representations and Warranties. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Seller confirms that neither the Company nor anyone purportedly acting on behalf of the Company has made any representations, warranties, agreements, or statements, express or implied, with respect to the Purchased Shares or the business, affairs, financial condition, plans, or prospects of the Company nor has Seller relied on any representations, warranties, agreements, or statements in the belief that they were made on behalf of any of the foregoing.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 300 },
            }),
            
            // Section 4 - Representations and Warranties of Buyer
            new Paragraph({
              children: [
                new TextRun({
                  text: "4. Representations and Warranties of Buyer.",
                  bold: true,
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Buyer hereby represents and warrants as follows as of the date hereof and as of the Closing Date:",
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(a) Authority and Consent. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Buyer has the right, power, legal capacity, and authority to enter into and perform Buyer's obligations under this Agreement, and no approvals or consent of any governmental or regulatory authority or other persons is necessary in connection herewith.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(b) No Violation or Breach. ",
                  bold: true,
                }),
                new TextRun({
                  text: "The execution and delivery of this Agreement and the consummation of the transactions contemplated hereby shall not violate or result in the breach by Buyer of, or constitute a default under, or conflict with, or cause any acceleration of any obligation with respect to any provision or restriction of any material loan, mortgage, lien, agreement, contract, instrument, order, judgment, award, decree, or any other restriction of any kind or character to which any material assets or properties of Buyer is subject or by which Buyer is bound.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(c) Purchase Entirely for Own Account. ",
                  bold: true,
                }),
                new TextRun({
                  text: 'Buyer is acquiring the Purchased Shares for Buyer\'s own account only and not with a view to, or for resale in connection with, any "distribution" of the Purchased Shares within the meaning of the Securities Act of 1933, as amended (the "Securities Act"), and Buyer has no contract, undertaking, or arrangement to sell or transfer the Purchased Shares to another person.',
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(d) Reliance on Advisors. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Buyer, in determining to purchase the Purchased Shares, (i) has been encouraged to and has had the opportunity to rely upon the advice of Buyer's legal and tax counsel, accountants, and other advisors with respect to the purchase of the Purchased Shares, and (ii) has relied solely upon the advice of Buyer's legal and tax counsel, accountants, or other financial advisors with respect to the financial, tax, and other considerations relating to the purchase of the Purchased Shares.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(e) Absence of Representations and Warranties. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Buyer confirms that neither the Company nor anyone purportedly acting on behalf of the Company has made any representations, warranties, agreements, or statements, express or implied, respecting the Purchased Shares or the business, affairs, financial condition, plans, or prospects of the Company nor has Buyer relied on any representations, warranties, agreements, or statements in the belief that they were made on behalf of any of the foregoing.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(f) No Company Representations. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Buyer is not making any representations or warranties to Seller in relation to or on behalf of the Company.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(g) Shares to be Restricted. ",
                  bold: true,
                }),
                new TextRun({
                  text: 'Buyer understands that the Purchased Shares are "restricted securities" within the meaning of Rule 144 under the Securities Act.',
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(h) No Registration. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Buyer acknowledges that the Purchased Shares have not been registered under the Securities Act or the securities laws of any state, and the Purchased Shares cannot be resold unless the sale is registered or an exemption from registration is available. Buyer acknowledges that the Company has no obligation to register or qualify the Purchased Shares for resale, and the Company does not intend to register any such Purchased Shares either under the Securities Act or any state securities laws. Buyer further acknowledges that if an exemption from registration or qualification is available, it may be conditioned on various requirements including, but not limited to, the time and manner of sale, the holding period for the Purchased Shares, and requirements relating to the Company which are outside of Buyer's control, and which the Company is under no obligation and may not be able to satisfy.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(i) Legends. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Buyer acknowledges that the certificate evidencing the Purchased Shares shall bear a restrictive legend stating that the Purchased Shares may not be sold, transferred, hypothecated, or otherwise distributed in the absence of an effective registration under the Securities Act or any state securities laws or the receipt of an opinion of counsel satisfactory to the Company that such registration is not required.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(j) No General Solicitation or Advertising. ",
                  bold: true,
                }),
                new TextRun({
                  text: "The offer to sell the Purchased Shares was communicated directly to Buyer by Seller or Seller's agent. At no time was Buyer presented with or solicited by or through any article, notice, or other communication published in any newspaper or other leaflet, public promotional meeting, television, radio or other broadcast or transmittal advertisement or any other form of general solicitation or advertising.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(k) Accredited Investor. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Buyer is an Accredited Investor as defined in Rule 501(a) of Regulation D promulgated under the Securities Act. Buyer has completed and signed Exhibit B attached to this Agreement to provide Seller with information upon which Seller shall have a reasonable basis to believe that Buyer is an Accredited Investor. Buyer (i) can bear the economic risk of the purchase of the Purchased Shares, including the complete loss of Buyer's investment, and (ii) has sufficient knowledge and experience in business and financial matters as to be capable of evaluating the merits and risks of Buyer's purchase of the Purchased Shares.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 300 },
            }),
            
            // Section 5 - Miscellaneous
            new Paragraph({
              children: [
                new TextRun({
                  text: "5. Miscellaneous.",
                  bold: true,
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(a) Incorporation of Recitals. ",
                  bold: true,
                }),
                new TextRun({
                  text: "The Recitals set forth above are incorporated by this reference and are expressly made part of this Agreement.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(b) Further Assurances. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Each of the parties hereto shall execute and deliver any and all such other instruments, documents, and agreements and take all such actions as either party may reasonably request from time to time in order to effectuate the purposes of this Agreement.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(c) Controlling Law. ",
                  bold: true,
                }),
                new TextRun({
                  text: "This Agreement shall be governed exclusively by and construed in accordance with the laws of the state of Delaware without application of the conflict of laws principles thereof.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(d) Binding Nature of Agreement; No Assignment. ",
                  bold: true,
                }),
                new TextRun({
                  text: "This Agreement shall be binding upon and inure to the benefit of the parties hereto and their respective successors and assigns, except that no party may assign or transfer its rights or obligations under this Agreement without the prior consent of the other party hereto.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(e) Entire Agreement. ",
                  bold: true,
                }),
                new TextRun({
                  text: "This Agreement contains the entire understanding between the parties hereto with respect to the purchase and sale of the Purchased Shares, and supersedes all prior and contemporaneous agreements and understandings, inducements, or conditions, express or implied, oral or written, between the parties hereto, with respect to the purchase and sale of the Purchased Shares. This Agreement may not be modified or amended other than by an agreement executed in writing by Buyer and Seller.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "(f) Brokers and Finders. ",
                  bold: true,
                }),
                new TextRun({
                  text: "Each party represents and warrants to each other party that it has not employed or retained any broker or finder in connection with the transactions contemplated by this Agreement nor has it had any dealings with any other person that may entitle such other person to a fee or commission from any other party hereto. Each party shall indemnify and hold the others harmless for, from, and against any claim, demand or damages whatsoever by virtue of any arrangement or commitment made by it with or to any person that may entitle such person to any fee or commission from the other party to this Agreement.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "[REMAINDER OF PAGE INTENTIONALLY LEFT BLANK]",
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            
            // Page Break for Signature Page
            new Paragraph({
              children: [
                new TextRun({
                  text: "",
                }),
              ],
              pageBreakBefore: true,
            }),
            
            // Signature Page
            new Paragraph({
              children: [
                new TextRun({
                  text: "IN WITNESS WHEREOF, Seller and Buyer have executed and delivered this Agreement as of the day and year first above written.",
                }),
              ],
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "SELLER:",
                  bold: true,
                }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "_________________________________",
                }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "[SELLER_NAME]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Address: ",
                }),
                new TextRun({
                  text: "[SELLER_ADDRESS]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Email: ",
                }),
                new TextRun({
                  text: "[SELLER_EMAIL]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "BUYER:",
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "_________________________________",
                }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "[BUYER_NAME]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Address: ",
                }),
                new TextRun({
                  text: "[BUYER_ADDRESS]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Email: ",
                }),
                new TextRun({
                  text: "[BUYER_EMAIL]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "[SIGNATURE PAGE TO COMMON STOCK PURCHASE AGREEMENT]",
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            
            // Page Break for Exhibit A
            new Paragraph({
              children: [
                new TextRun({
                  text: "",
                }),
              ],
              pageBreakBefore: true,
            }),
            
            // Exhibit A - Stock Power
            new Paragraph({
              children: [
                new TextRun({
                  text: "EXHIBIT A",
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "STOCK POWER",
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "FOR VALUE RECEIVED, the undersigned does hereby sell, convey, assign, and transfer unto the transferees listed below, an aggregate of ",
                }),
                new TextRun({
                  text: "[NUMBER_OF_SHARES_WORDS]",
                  bold: true,
                  highlight: "yellow",
                }),
                new TextRun({
                  text: " (",
                }),
                new TextRun({
                  text: "[NUMBER_OF_SHARES]",
                  bold: true,
                  highlight: "yellow",
                }),
                new TextRun({
                  text: ") shares of Common Stock, par value $0.0001 per share, of Parade Deck Holdings, Inc., a Delaware corporation (the \"Corporation\"), represented by Stock Certificate No. CS-1, and does hereby irrevocably constitute and appoint Weiss Brown, PLLC, to transfer said stock on the books of the Corporation with full power of substitution in the premises:",
                }),
              ],
              spacing: { after: 400 },
            }),
            
            // Stock Power Table
            new Table({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Transferee", bold: true })] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "Number of Shares", bold: true })] })],
                      width: { size: 50, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "[BUYER_NAME]", bold: true, highlight: "yellow" })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: "[NUMBER_OF_SHARES]", bold: true, highlight: "yellow" })] })],
                    }),
                  ],
                }),
              ],
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Dated: ",
                }),
                new TextRun({
                  text: "[AGREEMENT_DATE]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "_________________________________",
                }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "[SELLER_NAME]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 400 },
            }),
            
            // Page Break for Exhibit B
            new Paragraph({
              children: [
                new TextRun({
                  text: "",
                }),
              ],
              pageBreakBefore: true,
            }),
            
            // Exhibit B - Accredited Investor Certificate
            new Paragraph({
              children: [
                new TextRun({
                  text: "EXHIBIT B",
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "CERTIFICATE OF STATUS AS SOPHISTICATED OR ACCREDITED INVESTOR",
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Buyer is acquiring the Shares as a Sophisticated Investor in a private shareholder-to-shareholder transaction exempt under Section 4(a)(1) of the Securities Act of 1933. By signing below, the undersigned acknowledges and represents that:",
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "• They have been provided the opportunity to obtain any information necessary to evaluate the investment;",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "• They understand that the Shares are not registered under the Securities Act and are being acquired for investment purposes only;",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "• They are able to bear the economic risk of loss of the entire investment; and",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "• They consent to the Company relying on this representation for purposes of compliance with federal and state securities laws.",
                }),
              ],
              indent: { left: 360 },
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "[SIGNATURE PAGE TO ACCREDITED INVESTOR CERTIFICATE]",
                  italics: true,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "IN WITNESS WHEREOF, the undersigned has executed and delivered this certificate as certifying the undersigned's status as a \"sophisticated investor.\"",
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Dated: ",
                }),
                new TextRun({
                  text: "[AGREEMENT_DATE]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "_________________________________",
                }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "[BUYER_NAME]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Address: ",
                }),
                new TextRun({
                  text: "[BUYER_ADDRESS]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Email: ",
                }),
                new TextRun({
                  text: "[BUYER_EMAIL]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 400 },
            }),
            
            // Page Break for Exhibit C
            new Paragraph({
              children: [
                new TextRun({
                  text: "",
                }),
              ],
              pageBreakBefore: true,
            }),
            
            // Exhibit C - Joinder Agreement
            new Paragraph({
              children: [
                new TextRun({
                  text: "EXHIBIT C",
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "JOINDER AGREEMENT",
                  bold: true,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: 'The undersigned acknowledges intent to purchase shares of capital stock of PARADE DECK HOLDINGS, INC., a Delaware corporation (the "Company"). Reference is made to that certain Stockholders\' Agreement, dated as of May 20, 2025 (the "Stockholders\' Agreement"), by and among the Company and the Stockholders as defined therein, as amended from time to time. The undersigned further acknowledges that such purchase is subject to the joinder by the undersigned to the Stockholders\' Agreement, which provides significant benefits to the undersigned, the Company, and the Stockholders. Accordingly, pursuant to Section 6.15 of the Stockholders\' Agreement, the undersigned hereby irrevocably and unconditionally agrees that, he, she, or it, as the case may be, has as of the date hereof become a party to the Stockholders\' Agreement in the capacity as a "Stockholder," with all the attendant rights and obligations thereof, and with the same force and effect as though he or she, as the case may be, had originally been a signatory thereto.',
                }),
              ],
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Dated: ",
                }),
                new TextRun({
                  text: "[AGREEMENT_DATE]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "_________________________________",
                }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "[BUYER_NAME]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Address: ",
                }),
                new TextRun({
                  text: "[BUYER_ADDRESS]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Email: ",
                }),
                new TextRun({
                  text: "[BUYER_EMAIL]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 400 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Agreed and Acknowledged:",
                  bold: true,
                }),
              ],
              spacing: { before: 400, after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "PARADE DECK HOLDINGS, INC.",
                  bold: true,
                }),
              ],
              spacing: { after: 200 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "By: _________________________________",
                }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Name: ",
                }),
                new TextRun({
                  text: "[CHAIRMAN_NAME]",
                  bold: true,
                  highlight: "yellow",
                }),
              ],
              spacing: { after: 100 },
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: "Title: Chairman of the Board",
                }),
              ],
              spacing: { after: 400 },
            }),
          ],
        },
      ],
    });

    // Generate the document
    const buffer = await Packer.toBuffer(doc);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    return new Response(
      JSON.stringify({
        success: true,
        document: base64,
        filename: "stock-purchase-agreement-template.docx",
        placeholders: [
          "[AGREEMENT_DATE]",
          "[SELLER_NAME]",
          "[SELLER_ADDRESS]",
          "[SELLER_EMAIL]",
          "[BUYER_NAME]",
          "[BUYER_ADDRESS]",
          "[BUYER_EMAIL]",
          "[NUMBER_OF_SHARES]",
          "[NUMBER_OF_SHARES_WORDS]",
          "[PRICE_PER_SHARE]",
          "[PURCHASE_AMOUNT]",
          "[CHAIRMAN_NAME]",
        ],
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("[generate-stock-agreement-template] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
