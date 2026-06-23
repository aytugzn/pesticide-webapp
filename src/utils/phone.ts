/**
 * Extracts only the digit characters from a phone string.
 * Completely regex-free for maximum performance and ReDoS immunity.
 *
 * @param phone - Raw phone string (e.g. "+90 (555) 123-4567")
 * @returns Cleaned string containing only numbers (e.g. "905551234567")
 */
export function sanitizePhoneToDigits(phone: string): string {
  if (!phone) return "";
  let result = "";
  for (let i = 0; i < phone.length; i++) {
    const char = phone[i];
    if (char >= '0' && char <= '9') {
      result += char;
    }
  }
  return result;
}

/**
 * Generates a WhatsApp API URL (wa.me) using a raw phone number.
 * 
 * @param phone - Raw phone string
 * @returns Formatted WhatsApp URL
 */
export function generateWhatsAppUrl(phone: string): string {
  const digits = sanitizePhoneToDigits(phone);
  return `https://wa.me/${digits}`;
}

/**
 * Generates a Telephone Link (tel:) using a raw phone number.
 * 
 * @param phone - Raw phone string
 * @returns Formatted tel protocol URL
 */
export function generateTelUrl(phone: string): string {
  const digits = sanitizePhoneToDigits(phone);
  return `tel:+${digits}`;
}
