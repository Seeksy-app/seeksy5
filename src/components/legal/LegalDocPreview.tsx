import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FieldValues {
  purchaser_name?: string;
  purchaser_email?: string;
  purchaser_street?: string;
  purchaser_city?: string;
  purchaser_state?: string;
  purchaser_zip?: string;
  seller_name?: string;
  seller_email?: string;
  seller_street?: string;
  seller_city?: string;
  seller_state?: string;
  seller_zip?: string;
  chairman_name?: string;
  chairman_title?: string;
  purchase_amount?: number;
  number_of_shares?: number;
  accredited_net_worth?: boolean;
  accredited_income?: boolean;
  accredited_director?: boolean;
  accredited_other?: boolean;
  accredited_other_text?: string;
}

interface ComputedValues {
  price_per_share?: number;
  computed_purchase_amount?: number;
  computed_number_of_shares?: number;
}

interface LegalDocPreviewProps {
  bodyText: string;
  fieldValues: FieldValues;
  computedValues: ComputedValues;
  highlightPlaceholders?: boolean;
}

export function LegalDocPreview({
  bodyText,
  fieldValues,
  computedValues,
  highlightPlaceholders = true,
}: LegalDocPreviewProps) {
  const renderedText = useMemo(() => {
    let text = bodyText;
    
    // Format addresses from components
    const formatAddress = (street?: string, city?: string, state?: string, zip?: string) => {
      const parts = [];
      if (street) parts.push(street);
      if (city || state || zip) {
        const cityStateZip = [city, state].filter(Boolean).join(", ") + (zip ? " " + zip : "");
        if (cityStateZip.trim()) parts.push(cityStateZip.trim());
      }
      return parts.join("\n");
    };
    
    // Get current date formatted
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
    
    // Get values with fallbacks
    const purchaserName = fieldValues.purchaser_name || "[PURCHASER_NAME]";
    const purchaserEmail = fieldValues.purchaser_email || "[PURCHASER_EMAIL]";
    const purchaserAddress = formatAddress(
      fieldValues.purchaser_street,
      fieldValues.purchaser_city,
      fieldValues.purchaser_state,
      fieldValues.purchaser_zip
    ) || "[PURCHASER_ADDRESS]";
    const sellerName = fieldValues.seller_name || "[SELLER_NAME]";
    const sellerEmail = fieldValues.seller_email || "[SELLER_EMAIL]";
    const sellerAddress = formatAddress(
      fieldValues.seller_street,
      fieldValues.seller_city,
      fieldValues.seller_state,
      fieldValues.seller_zip
    ) || "[SELLER_ADDRESS]";
    const chairmanName = fieldValues.chairman_name || "[CHAIRMAN_NAME]";
    const chairmanTitle = fieldValues.chairman_title || "[CHAIRMAN_TITLE]";
    const pricePerShare = computedValues.price_per_share 
      ? `$${computedValues.price_per_share.toFixed(2)}` 
      : "[PRICE_PER_SHARE]";
    const numberOfShares = fieldValues.number_of_shares ?? computedValues.computed_number_of_shares;
    const purchaseAmount = fieldValues.purchase_amount ?? computedValues.computed_purchase_amount;
    
    const sharesDisplay = numberOfShares !== undefined 
      ? numberOfShares.toLocaleString() 
      : "[NUMBER_OF_SHARES]";
    const amountDisplay = purchaseAmount !== undefined 
      ? `$${purchaseAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "[PURCHASE_AMOUNT]";

    const hasPurchaserAddress = !!(fieldValues.purchaser_street || fieldValues.purchaser_city || fieldValues.purchaser_state || fieldValues.purchaser_zip);
    const hasSellerAddress = !!(fieldValues.seller_street || fieldValues.seller_city || fieldValues.seller_state || fieldValues.seller_zip);

    // Replace placeholders with values or highlighted placeholders
    const replacements: Record<string, { value: string; isFilled: boolean }> = {
      "[PURCHASER_NAME]": { value: purchaserName, isFilled: !!fieldValues.purchaser_name },
      "[PURCHASER_EMAIL]": { value: purchaserEmail, isFilled: !!fieldValues.purchaser_email },
      "[PURCHASER_ADDRESS]": { value: purchaserAddress, isFilled: hasPurchaserAddress },
      "[SELLER_NAME]": { value: sellerName, isFilled: !!fieldValues.seller_name },
      "[SELLER_EMAIL]": { value: sellerEmail, isFilled: !!fieldValues.seller_email },
      "[SELLER_ADDRESS]": { value: sellerAddress, isFilled: hasSellerAddress },
      "[CHAIRMAN_NAME]": { value: chairmanName, isFilled: !!fieldValues.chairman_name },
      "[CHAIRMAN_TITLE]": { value: chairmanTitle, isFilled: !!fieldValues.chairman_title },
      "[PRICE_PER_SHARE]": { value: pricePerShare, isFilled: !!computedValues.price_per_share },
      "[NUMBER_OF_SHARES]": { value: sharesDisplay, isFilled: numberOfShares !== undefined },
      "[PURCHASE_AMOUNT]": { value: amountDisplay, isFilled: purchaseAmount !== undefined },
      "[SELLER_DATE]": { value: currentDate, isFilled: true },
      "[PURCHASER_DATE]": { value: currentDate, isFilled: true },
      "[CHAIRMAN_DATE]": { value: currentDate, isFilled: true },
      "[ACCREDITED_OTHER_TEXT]": { value: fieldValues.accredited_other_text || "___", isFilled: !!fieldValues.accredited_other_text },
    };

    // Checkbox replacements
    const checkboxReplacements: Record<string, string> = {
      "[CHECKBOX_NET_WORTH]": fieldValues.accredited_net_worth ? "☑" : "☐",
      "[CHECKBOX_INCOME]": fieldValues.accredited_income ? "☑" : "☐",
      "[CHECKBOX_DIRECTOR]": fieldValues.accredited_director ? "☑" : "☐",
      "[CHECKBOX_OTHER]": fieldValues.accredited_other ? "☑" : "☐",
    };

    // Replace checkboxes first
    for (const [placeholder, value] of Object.entries(checkboxReplacements)) {
      text = text.replace(new RegExp(placeholder.replace(/[[\]]/g, '\\$&'), 'g'), value);
    }

    // Create regex pattern for all placeholders
    const placeholderPattern = /\[(PURCHASER_NAME|PURCHASER_EMAIL|PURCHASER_ADDRESS|SELLER_NAME|SELLER_EMAIL|SELLER_ADDRESS|CHAIRMAN_NAME|CHAIRMAN_TITLE|PRICE_PER_SHARE|NUMBER_OF_SHARES|PURCHASE_AMOUNT|SELLER_DATE|PURCHASER_DATE|CHAIRMAN_DATE|ACCREDITED_OTHER_TEXT)\]/g;
    
    text = text.replace(placeholderPattern, (match) => {
      const replacement = replacements[match];
      if (!replacement) return match;
      
      if (highlightPlaceholders) {
        const className = replacement.isFilled 
          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-medium"
          : "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded font-medium";
        return `<span class="${className}">${replacement.value}</span>`;
      }
      return replacement.value;
    });

    // Format the title if present - centered and bold
    text = text.replace(/^(COMMON STOCK PURCHASE AGREEMENT)/m, '<h1 class="text-lg font-bold text-center mb-8 text-foreground uppercase">$1</h1>');
    
    // Format RECITALS, AGREEMENT, etc. - centered, bold, underlined
    text = text.replace(/^(RECITALS|AGREEMENT|EXHIBITS?)$/gm, '<h2 class="text-base font-bold text-center mt-8 mb-4 text-foreground underline">$1</h2>');
    
    // Format EXHIBIT headers - only the first line, not duplicate
    text = text.replace(/^(EXHIBIT [A-Z])\n([A-Z][A-Z\s]+)$/gm, '<h2 class="text-base font-bold text-center mt-8 mb-2 text-foreground">$1</h2><h3 class="text-sm font-bold text-center mb-4 text-foreground uppercase">$2</h3>');
    
    // Format numbered section headers (1. Purchase and Sale...) - bold with underlined title
    text = text.replace(/(\d+\.)\s+([^.]+\.)/g, (match, num, title) => {
      if (/^[A-Z]/.test(title.trim())) {
        return `<span class="font-bold">${num}</span> <span class="font-bold underline">${title.trim()}</span>`;
      }
      return match;
    });
    
    // Format sub-sections with underlined titles (a), (b), (i), (ii) etc.
    text = text.replace(/(\([a-z]\)|\([ivx]+\))\s+([^.]+\.)/g, (match, letter, title) => {
      if (/^[A-Z]/.test(title.trim()) && title.length < 80) {
        return `<span class="ml-8">${letter}</span> <span class="underline">${title.trim()}</span>`;
      }
      return `<span class="ml-8">${letter}</span> ${title}`;
    });
    
    // Format roman numeral sub-sub-sections
    text = text.replace(/^\s*(i+\.)\s+/gm, '<span class="ml-16">$1</span> ');
    
    // Format NOW, THEREFORE and IN WITNESS WHEREOF
    text = text.replace(/(NOW, THEREFORE,)/g, '<span class="font-bold">$1</span>');
    text = text.replace(/(IN WITNESS WHEREOF,?)/g, '<span class="font-bold">$1</span>');
    
    // Format SELLER:, BUYER:, etc.
    text = text.replace(/^(SELLER|BUYER|AGREED AND ACKNOWLEDGED):?$/gm, '<h3 class="font-bold mt-6 mb-2 text-foreground uppercase">$1:</h3>');
    
    // Format [REMAINDER OF PAGE INTENTIONALLY LEFT BLANK]
    text = text.replace(/\[(REMAINDER OF PAGE INTENTIONALLY LEFT BLANK|SIGNATURE PAGE[^\]]*)\]/g, '<p class="text-center italic my-8 text-muted-foreground">[$1]</p>');
    
    // Format signature lines
    text = text.replace(/_{3,}/g, '<span class="border-b border-foreground inline-block min-w-[200px]">&nbsp;</span>');
    
    // Add paragraph spacing - convert double newlines to paragraph breaks
    text = text.replace(/\n\n+/g, '</p><p class="mb-4 text-justify">');
    
    // Single newlines within paragraphs
    text = text.replace(/\n/g, '<br/>');

    // Wrap in paragraph tags
    text = '<p class="mb-4 text-justify">' + text + '</p>';

    return text;
  }, [bodyText, fieldValues, computedValues, highlightPlaceholders]);

  return (
    <ScrollArea className="h-full">
      <div className="p-8 font-serif text-sm leading-relaxed">
        <div 
          className="[&>h1]:whitespace-normal [&>h2]:whitespace-normal [&>h3]:whitespace-normal [&>p]:whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: renderedText }}
        />
      </div>
    </ScrollArea>
  );
}
