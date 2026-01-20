import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from 'docx';
import jsPDF from 'jspdf';

interface ExportData {
  purchaserName: string;
  purchaserEmail: string;
  purchaserAddress: string;
  sellerName: string;
  sellerEmail: string;
  sellerAddress: string;
  pricePerShare: number;
  numberOfShares: number;
  purchaseAmount: number;
  bodyText: string;
  instanceId: string;
  // Certification fields
  isSophisticatedInvestor?: boolean;
  accreditedNetWorth?: boolean;
  accreditedIncome?: boolean;
  accreditedDirector?: boolean;
  accreditedOther?: boolean;
  accreditedOtherText?: string;
  // Signature fields
  sellerSignatureUrl?: string;
  purchaserSignatureUrl?: string;
  chairmanSignatureUrl?: string;
  chairmanName?: string;
  chairmanTitle?: string;
  sellerSignedAt?: string;
  purchaserSignedAt?: string;
  chairmanSignedAt?: string;
}

/**
 * Replace placeholders in body text with actual values
 */
function renderBodyText(bodyText: string, data: ExportData): string {
  // Get current date formatted
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  // Use actual signed dates if available, otherwise use current date
  const sellerDate = data.sellerSignedAt 
    ? new Date(data.sellerSignedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : currentDate;
  const purchaserDate = data.purchaserSignedAt 
    ? new Date(data.purchaserSignedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : currentDate;
  const chairmanDate = data.chairmanSignedAt 
    ? new Date(data.chairmanSignedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : currentDate;
  
  let text = bodyText
    .replace(/\[PURCHASER_NAME\]/g, data.purchaserName)
    .replace(/\[PURCHASER_EMAIL\]/g, data.purchaserEmail)
    .replace(/\[PURCHASER_ADDRESS\]/g, data.purchaserAddress)
    .replace(/\[SELLER_NAME\]/g, data.sellerName || 'Andrew Appleton')
    .replace(/\[SELLER_EMAIL\]/g, data.sellerEmail || 'appletonab@gmail.com')
    .replace(/\[SELLER_ADDRESS\]/g, data.sellerAddress || '413 Independence Ave SE, Washington DC 20003')
    .replace(/\[PRICE_PER_SHARE\]/g, `$${data.pricePerShare.toFixed(2)}`)
    .replace(/\[NUMBER_OF_SHARES\]/g, data.numberOfShares.toLocaleString())
    .replace(/\[PURCHASE_AMOUNT\]/g, `$${data.purchaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    // Date placeholders - use actual signed dates
    .replace(/\[SELLER_DATE\]/g, sellerDate)
    .replace(/\[PURCHASER_DATE\]/g, purchaserDate)
    .replace(/\[CHAIRMAN_DATE\]/g, chairmanDate)
    // Checkbox placeholders - use ASCII-safe symbols for PDF compatibility
    .replace(/\[CHECKBOX_NET_WORTH\]/g, data.accreditedNetWorth ? '[X]' : '[ ]')
    .replace(/\[CHECKBOX_INCOME\]/g, data.accreditedIncome ? '[X]' : '[ ]')
    .replace(/\[CHECKBOX_DIRECTOR\]/g, data.accreditedDirector ? '[X]' : '[ ]')
    .replace(/\[CHECKBOX_OTHER\]/g, data.accreditedOther ? '[X]' : '[ ]')
    .replace(/\[ACCREDITED_OTHER_TEXT\]/g, data.accreditedOtherText || '___');
  
  // Replace chairman placeholders
  if (data.chairmanName) {
    text = text.replace(/\[CHAIRMAN_NAME\]/g, data.chairmanName);
  }
  if (data.chairmanTitle) {
    text = text.replace(/\[CHAIRMAN_TITLE\]/g, data.chairmanTitle);
  }
  
  return text;
}

/**
 * Convert image URL to base64 for PDF embedding
 */
async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    return null;
  }
}

/**
 * Generate filename for exports
 */
function generateFilename(purchaserName: string, instanceId: string, extension: string): string {
  const safeName = purchaserName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  const shortId = instanceId.slice(0, 8);
  return `StockPurchaseAgreement_${safeName}_${shortId}.${extension}`;
}

/**
 * Check if a line should be centered
 */
function shouldCenter(line: string): boolean {
  const trimmed = line.trim().toUpperCase();
  const centeredPatterns = [
    /^COMMON STOCK PURCHASE AGREEMENT$/,
    /^RECITALS$/,
    /^AGREEMENT$/,
    /^EXHIBITS?$/,
    /^EXHIBIT [A-Z]$/,
    /^STOCK POWER$/,
    /^JOINDER AGREEMENT$/,
    /^ACCREDITED INVESTOR/,
    /^CERTIFICATE OF STATUS/,
    /^\[SIGNATURE PAGE/,
    /^\[REMAINDER OF PAGE/,
    /^\[THIS PAGE INTENTIONALLY/,
    /^\(ATTACHED\)$/i,
  ];
  return centeredPatterns.some(p => p.test(trimmed));
}

/**
 * Check if line is an exhibit header that needs a cover page
 */
function isExhibitCoverHeader(line: string): { isExhibit: boolean; exhibitLetter: string; title: string } {
  const trimmed = line.trim().toUpperCase();
  
  // Match "EXHIBIT A", "EXHIBIT B", "EXHIBIT C"
  const exhibitMatch = trimmed.match(/^EXHIBIT ([A-Z])$/);
  if (exhibitMatch) {
    return { isExhibit: true, exhibitLetter: exhibitMatch[1], title: '' };
  }
  
  return { isExhibit: false, exhibitLetter: '', title: '' };
}

/**
 * Get exhibit title based on letter
 */
function getExhibitTitle(letter: string): string {
  const titles: Record<string, string> = {
    'A': 'STOCK POWER',
    'B': 'CERTIFICATE OF STATUS AS A SOPHISTICATED OR ACCREDITED INVESTOR',
    'C': 'JOINDER AGREEMENT',
  };
  return titles[letter] || '';
}

/**
 * Check if a line is a section header (should be bold)
 */
function isHeader(line: string): boolean {
  const trimmed = line.trim();
  return /^(\d+\.|SECTION|ARTICLE|RECITALS|AGREEMENT|EXHIBIT|STOCK POWER|JOINDER|ACCREDITED|COMMON STOCK|SELLER:|BUYER:|AGREED|IN WITNESS|NOW, THEREFORE)/i.test(trimmed);
}

/**
 * Export agreement as DOCX with proper page breaks
 */
export async function exportToDocx(data: ExportData): Promise<void> {
  const renderedText = renderBodyText(data.bodyText, data);
  
  const paragraphs: Paragraph[] = [];
  
  const lines = renderedText.split('\n');
  let skipNextIfDuplicate = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip duplicate titles (body_text may start with title that we already added)
    if (skipNextIfDuplicate && trimmedLine === skipNextIfDuplicate) {
      skipNextIfDuplicate = '';
      continue;
    }
    
    // Handle page break markers - just add one page break, not two
    if (trimmedLine.includes('[THIS PAGE INTENTIONALLY LEFT BLANK]')) {
      paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
      paragraphs.push(
        new Paragraph({
          text: "[THIS PAGE INTENTIONALLY LEFT BLANK]",
          alignment: AlignmentType.CENTER,
          spacing: { before: 4000 },
        })
      );
      continue;
    }
    
    if (trimmedLine.includes('[SIGNATURE PAGE') || trimmedLine.includes('[REMAINDER OF PAGE INTENTIONALLY LEFT BLANK]')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: trimmedLine, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 400 },
        })
      );
      continue;
    }
    
    if (!trimmedLine) {
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      continue;
    }
    
    const isCentered = shouldCenter(trimmedLine);
    const isBold = isHeader(trimmedLine);
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: trimmedLine,
            bold: isBold,
            size: isBold ? 24 : 22,
          }),
        ],
        alignment: isCentered ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 200 },
      })
    );
  }
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });
  
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = generateFilename(data.purchaserName, data.instanceId, 'docx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Add page numbers to all pages
 */
function addPageNumbers(pdf: jsPDF) {
  const totalPages = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const pageText = `Page ${i} of ${totalPages}`;
    const textWidth = pdf.getTextWidth(pageText);
    pdf.text(pageText, (pageWidth - textWidth) / 2, pageHeight - 10);
  }
}

/**
 * Add final signature summary page
 */
function addSignatureSummaryPage(pdf: jsPDF, data: ExportData) {
  pdf.addPage();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 25;
  let yPosition = 40;
  
  // Title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const title = 'Signature Summary';
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, yPosition);
  yPosition += 15;
  
  // Document info
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Common Stock Purchase Agreement', margin, yPosition);
  yPosition += 8;
  pdf.text(`Purchaser: ${data.purchaserName}`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Shares: ${data.numberOfShares.toLocaleString()} @ $${data.pricePerShare.toFixed(2)} per share`, margin, yPosition);
  yPosition += 8;
  pdf.text(`Total: $${data.purchaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin, yPosition);
  yPosition += 20;
  
  // Signature table header
  pdf.setFont('helvetica', 'bold');
  pdf.text('Signatory', margin, yPosition);
  pdf.text('Role', margin + 60, yPosition);
  pdf.text('Date Signed', margin + 100, yPosition);
  yPosition += 3;
  
  // Draw line under header
  pdf.setDrawColor(0);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  // Seller row
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.sellerName || 'Andrew Appleton', margin, yPosition);
  pdf.text('Seller', margin + 60, yPosition);
  if (data.sellerSignedAt) {
    pdf.text(new Date(data.sellerSignedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 100, yPosition);
  } else {
    pdf.text('—', margin + 100, yPosition);
  }
  yPosition += 10;
  
  // Purchaser row
  pdf.text(data.purchaserName, margin, yPosition);
  pdf.text('Purchaser', margin + 60, yPosition);
  if (data.purchaserSignedAt) {
    pdf.text(new Date(data.purchaserSignedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 100, yPosition);
  } else {
    pdf.text('—', margin + 100, yPosition);
  }
  yPosition += 10;
  
  // Chairman row
  pdf.text(data.chairmanName || 'Chairman', margin, yPosition);
  pdf.text('Chairman of the Board', margin + 60, yPosition);
  if (data.chairmanSignedAt) {
    pdf.text(new Date(data.chairmanSignedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 100, yPosition);
  } else {
    pdf.text('—', margin + 100, yPosition);
  }
  yPosition += 20;
  
  // Draw bottom line
  pdf.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5);
  
  // Status
  yPosition += 10;
  const allSigned = data.sellerSignedAt && data.purchaserSignedAt && data.chairmanSignedAt;
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Status: ${allSigned ? 'Fully Executed' : 'Pending Signatures'}`, margin, yPosition);
  
  // Generated timestamp
  yPosition += 20;
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.text(`Document generated: ${new Date().toLocaleString()}`, margin, yPosition);
}

/**
 * Export agreement as PDF with proper page breaks
 */
export async function exportToPdf(data: ExportData): Promise<void> {
  const renderedText = renderBodyText(data.bodyText, data);
  
  // Pre-load signature images
  const signatureImages: Record<string, string | null> = {};
  if (data.sellerSignatureUrl) {
    signatureImages.seller = await imageUrlToBase64(data.sellerSignatureUrl);
  }
  if (data.purchaserSignatureUrl) {
    signatureImages.purchaser = await imageUrlToBase64(data.purchaserSignatureUrl);
  }
  if (data.chairmanSignatureUrl) {
    signatureImages.chairman = await imageUrlToBase64(data.chairmanSignatureUrl);
  }
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 25;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;
  const lineHeight = 5;
  const pageHeight = pdf.internal.pageSize.getHeight();
  const bottomMargin = 30; // Increased for page numbers
  const signatureHeight = 15;
  const signatureWidth = 50;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const lines = renderedText.split('\n');
  let seenTitle = false;
  let currentSection = '';
  
  // Track if we're in the Joinder section (EXHIBIT C) - this is where chairman signature goes
  let inJoinderSection = false;
  
  // Track if we've already rendered "AGREED AND ACKNOWLEDGED" section in main body (skip duplicate in page 6)
  let mainAgreedRendered = false;
  let skipUntilExhibit = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    const upperLine = trimmedLine.toUpperCase();
    
    // Check for exhibit cover page headers
    const exhibitCheck = isExhibitCoverHeader(trimmedLine);
    if (exhibitCheck.isExhibit) {
      // Reset skip flag when we hit an exhibit
      skipUntilExhibit = false;
      
      // Force new page for exhibit cover
      pdf.addPage();
      yPosition = margin + 60; // Start lower on the page for centered look
      
      // Render exhibit cover page: EXHIBIT X (underlined)
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const exhibitText = `EXHIBIT ${exhibitCheck.exhibitLetter}`;
      const exhibitWidth = pdf.getTextWidth(exhibitText);
      const exhibitX = (pageWidth - exhibitWidth) / 2;
      pdf.text(exhibitText, exhibitX, yPosition);
      // Underline
      pdf.setLineWidth(0.5);
      pdf.line(exhibitX, yPosition + 1, exhibitX + exhibitWidth, yPosition + 1);
      yPosition += lineHeight * 3;
      
      // Title
      const exhibitTitle = getExhibitTitle(exhibitCheck.exhibitLetter);
      if (exhibitTitle) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const titleWidth = pdf.getTextWidth(exhibitTitle);
        pdf.text(exhibitTitle, (pageWidth - titleWidth) / 2, yPosition);
        yPosition += lineHeight * 2;
      }
      
      // "(Attached)"
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const attachedText = '(Attached)';
      const attachedWidth = pdf.getTextWidth(attachedText);
      pdf.text(attachedText, (pageWidth - attachedWidth) / 2, yPosition);
      
      // Start new page for actual exhibit content
      pdf.addPage();
      yPosition = margin;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Track Joinder section
      if (exhibitCheck.exhibitLetter === 'C') {
        inJoinderSection = true;
      }
      continue;
    }
    
    // Skip duplicate exhibit title lines that follow (e.g., "STOCK POWER" right after "EXHIBIT A")
    if (upperLine === 'STOCK POWER' || upperLine === 'JOINDER AGREEMENT' || 
        upperLine.includes('CERTIFICATE OF STATUS AS A SOPHISTICATED')) {
      // These are now part of the cover page, skip if immediately after exhibit
      const prevLine = i > 0 ? lines[i - 1].trim().toUpperCase() : '';
      if (prevLine.match(/^EXHIBIT [A-Z]$/)) {
        continue;
      }
    }
    
    // Track when we enter Joinder section content
    if (upperLine.includes('JOINDER AGREEMENT') && !exhibitCheck.isExhibit) {
      inJoinderSection = true;
    }
    
    // SKIP the "AGREED AND ACKNOWLEDGED" section from main signature page (page 6)
    // This section should ONLY appear in the Joinder Agreement (EXHIBIT C)
    if (!inJoinderSection && (upperLine === 'AGREED AND ACKNOWLEDGED:' || upperLine === 'AGREED AND ACKNOWLEDGED')) {
      // Skip this entire section until we hit an Exhibit
      skipUntilExhibit = true;
      mainAgreedRendered = true;
      continue;
    }
    
    // If we're skipping until exhibit, continue
    if (skipUntilExhibit) {
      if (upperLine.match(/^EXHIBIT [A-Z]$/)) {
        skipUntilExhibit = false;
        // Let this fall through to be processed as exhibit
      } else {
        continue;
      }
    }
    
    // Track section for signature context - determines which signature to use
    // EXHIBIT A (Stock Power) = SELLER signs
    // EXHIBIT B (Accredited Investor) = PURCHASER signs  
    // EXHIBIT C (Joinder) = PURCHASER signs, then CHAIRMAN acknowledges
    if (trimmedLine.includes('SELLER:') || trimmedLine.startsWith('SELLER')) {
      currentSection = 'seller';
    } else if (trimmedLine.includes('BUYER:') || trimmedLine.includes('BUYER') || trimmedLine.includes('[PURCHASER_NAME]')) {
      currentSection = 'purchaser';
    } else if (upperLine.includes('EXHIBIT A') || upperLine.includes('STOCK POWER')) {
      currentSection = 'seller'; // Stock Power is signed by SELLER
    } else if (upperLine.includes('EXHIBIT B') || upperLine.includes('ACCREDITED INVESTOR') || upperLine.includes('CERTIFICATE OF STATUS')) {
      currentSection = 'purchaser'; // Accredited Investor is signed by PURCHASER
    } else if (upperLine.includes('EXHIBIT C') || upperLine.includes('JOINDER')) {
      currentSection = 'purchaser'; // Joinder is signed by PURCHASER
    }
    
    // Chairman signature ONLY appears in Joinder section (EXHIBIT C) after "Agreed and Acknowledged:" with "By:"
    if (inJoinderSection && trimmedLine.startsWith('By:') && data.chairmanName && trimmedLine.includes(data.chairmanName) && signatureImages.chairman) {
      // First render the "By:" line
      if (yPosition > pageHeight - bottomMargin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.setFont('helvetica', 'normal');
      pdf.text(trimmedLine, margin, yPosition);
      yPosition += lineHeight;
      
      // Then add the chairman signature image below it
      if (yPosition + signatureHeight + 5 > pageHeight - bottomMargin) {
        pdf.addPage();
        yPosition = margin;
      }
      try {
        pdf.addImage(signatureImages.chairman, 'PNG', margin + 10, yPosition - 5, signatureWidth, signatureHeight);
        yPosition += signatureHeight + 2;
      } catch (e) {
        console.error('Failed to add chairman signature image:', e);
      }
      continue;
    }
    
    // Skip empty lines at the very end of the document
    if (i === lines.length - 1 && !trimmedLine) {
      continue;
    }
    
    // Handle the main title specially - only render once and centered
    if (trimmedLine === 'COMMON STOCK PURCHASE AGREEMENT') {
      if (seenTitle) continue;
      seenTitle = true;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const titleWidth = pdf.getTextWidth(trimmedLine);
      pdf.text(trimmedLine, (pageWidth - titleWidth) / 2, yPosition);
      yPosition += lineHeight * 3;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      continue;
    }
    
    // Check for intentionally blank page markers
    if (trimmedLine.includes('[THIS PAGE INTENTIONALLY LEFT BLANK]')) {
      pdf.addPage();
      yPosition = pageHeight / 2;
      pdf.setFont('helvetica', 'italic');
      const blankText = "[THIS PAGE INTENTIONALLY LEFT BLANK]";
      const blankWidth = pdf.getTextWidth(blankText);
      pdf.text(blankText, (pageWidth - blankWidth) / 2, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition = pageHeight;
      continue;
    }
    
    // Handle signature page markers
    if (trimmedLine.includes('[SIGNATURE PAGE')) {
      pdf.setFont('helvetica', 'italic');
      const sigWidth = pdf.getTextWidth(trimmedLine);
      pdf.text(trimmedLine, (pageWidth - sigWidth) / 2, yPosition);
      yPosition += lineHeight * 2;
      pdf.setFont('helvetica', 'normal');
      continue;
    }
    
    // Handle "[REMAINDER OF PAGE INTENTIONALLY LEFT BLANK]" - render it and force new page
    if (trimmedLine.includes('[REMAINDER OF PAGE INTENTIONALLY LEFT BLANK]')) {
      pdf.setFont('helvetica', 'italic');
      const sigWidth = pdf.getTextWidth(trimmedLine);
      pdf.text(trimmedLine, (pageWidth - sigWidth) / 2, yPosition);
      pdf.setFont('helvetica', 'normal');
      // Force a new page - nothing else should appear on this page
      pdf.addPage();
      yPosition = margin;
      continue;
    }
    
    // Handle signature lines - replace with actual signatures if available
    if (trimmedLine.startsWith('Signature:') && trimmedLine.includes('___')) {
      if (yPosition + signatureHeight + 5 > pageHeight - bottomMargin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      let signatureImage: string | null = null;
      if (currentSection === 'seller' && signatureImages.seller) {
        signatureImage = signatureImages.seller;
      } else if (currentSection === 'purchaser' && signatureImages.purchaser) {
        signatureImage = signatureImages.purchaser;
      } else if (currentSection === 'chairman' && signatureImages.chairman) {
        signatureImage = signatureImages.chairman;
      }
      
      pdf.text('Signature:', margin, yPosition);
      
      if (signatureImage) {
        try {
          pdf.addImage(signatureImage, 'PNG', margin + 25, yPosition - 10, signatureWidth, signatureHeight);
          yPosition += signatureHeight + 2;
        } catch (e) {
          console.error('Failed to add signature image:', e);
          pdf.text('___________________________', margin + 25, yPosition);
          yPosition += lineHeight;
        }
      } else {
        pdf.text('___________________________', margin + 25, yPosition);
        yPosition += lineHeight;
      }
      continue;
    }
    
    // Handle standalone signature underlines (often used after "By:")
    if (trimmedLine === '___________________________' || trimmedLine.match(/^_{10,}$/)) {
      if (yPosition + signatureHeight + 5 > pageHeight - bottomMargin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      let signatureImage: string | null = null;
      if (currentSection === 'seller' && signatureImages.seller) {
        signatureImage = signatureImages.seller;
      } else if (currentSection === 'purchaser' && signatureImages.purchaser) {
        signatureImage = signatureImages.purchaser;
      } else if (currentSection === 'chairman' && signatureImages.chairman) {
        signatureImage = signatureImages.chairman;
      }
      
      if (signatureImage) {
        try {
          pdf.addImage(signatureImage, 'PNG', margin, yPosition - 10, signatureWidth, signatureHeight);
          yPosition += signatureHeight + 2;
        } catch (e) {
          console.error('Failed to add signature image:', e);
          pdf.text(trimmedLine, margin, yPosition);
          yPosition += lineHeight;
        }
      } else {
        pdf.text(trimmedLine, margin, yPosition);
        yPosition += lineHeight;
      }
      continue;
    }
    
    // Handle empty lines
    if (!trimmedLine) {
      yPosition += lineHeight;
      if (yPosition > pageHeight - bottomMargin) {
        pdf.addPage();
        yPosition = margin;
      }
      continue;
    }
    
    const isCentered = shouldCenter(trimmedLine);
    const isBold = isHeader(trimmedLine);
    
    if (isBold) {
      pdf.setFont('helvetica', 'bold');
      if (/^(EXHIBIT [A-Z]|STOCK POWER|JOINDER AGREEMENT|ACCREDITED INVESTOR)$/i.test(trimmedLine)) {
        pdf.setFontSize(12);
      }
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
    }
    
    // Split long lines
    const splitLines = pdf.splitTextToSize(trimmedLine, maxWidth);
    
    for (const splitLine of splitLines) {
      if (yPosition > pageHeight - bottomMargin) {
        pdf.addPage();
        yPosition = margin;
      }
      
      if (isCentered) {
        const textWidth = pdf.getTextWidth(splitLine);
        pdf.text(splitLine, (pageWidth - textWidth) / 2, yPosition);
      } else {
        pdf.text(splitLine, margin, yPosition);
      }
      yPosition += lineHeight;
    }
    
    pdf.setFontSize(10);
    yPosition += lineHeight * 0.3;
  }
  
  // Add the signature summary final page
  addSignatureSummaryPage(pdf, data);
  
  // Add page numbers to all pages
  addPageNumbers(pdf);
  
  pdf.save(generateFilename(data.purchaserName, data.instanceId, 'pdf'));
}
