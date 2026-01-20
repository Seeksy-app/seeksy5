/**
 * Formats a phone number as XXX-XXX-XXXX for input fields
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format as XXX-XXX-XXXX
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
}

/**
 * Formats a phone number for display, handling +1 country code
 * Input: +12026695354 or 12026695354 or 2026695354
 * Output: +1 (202) 669-5354
 */
export function formatPhoneForDisplay(value: string | null | undefined): string {
  if (!value) return 'Unknown';
  
  // Remove all non-digits except leading +
  let digits = value.replace(/[^\d+]/g, '');
  
  // Handle + prefix
  const hasPlus = digits.startsWith('+');
  digits = digits.replace(/\D/g, '');
  
  // If it starts with 1 and has 11 digits, it's a US number with country code
  if (digits.length === 11 && digits.startsWith('1')) {
    const areaCode = digits.slice(1, 4);
    const exchange = digits.slice(4, 7);
    const subscriber = digits.slice(7, 11);
    return `+1 (${areaCode}) ${exchange}-${subscriber}`;
  }
  
  // If 10 digits, assume US number without country code
  if (digits.length === 10) {
    const areaCode = digits.slice(0, 3);
    const exchange = digits.slice(3, 6);
    const subscriber = digits.slice(6, 10);
    return `+1 (${areaCode}) ${exchange}-${subscriber}`;
  }
  
  // For other formats, just return cleaned up version
  if (digits.length > 0) {
    return hasPlus ? `+${digits}` : digits;
  }
  
  return 'Unknown';
}

/**
 * Strips formatting from phone number, returning only digits
 */
export function stripPhoneFormatting(value: string): string {
  return value.replace(/\D/g, '');
}
