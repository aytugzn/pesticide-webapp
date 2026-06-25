/**
 * Extracts only the digit characters from a phone string.
 * Completely regex-free for maximum performance and ReDoS immunity.
 *
 * @param phone - Raw phone string (e.g. "+90 (555) 123-4567")
 * @returns Cleaned string containing only numbers (e.g. "905551234567")
 */
export const sanitizePhoneToDigits = (phone: string): string => {
  if (!phone) return "";
  let result = "";
  for (let i = 0; i < phone.length; i++) {
    const char = phone[i];
    if (char >= '0' && char <= '9') {
      result += char;
    }
  }
  return result;
};

/**
 * Generates a WhatsApp API URL (wa.me) using a raw phone number.
 * 
 * @param phone - Raw phone string
 * @returns Formatted WhatsApp URL
 */
export const generateWhatsAppUrl = (phone: string): string => {
  const digits = sanitizePhoneToDigits(phone);
  return `https://wa.me/${digits}`;
};

/**
 * Generates a Telephone Link (tel:) using a raw phone number.
 * 
 * @param phone - Raw phone string
 * @returns Formatted tel protocol URL
 */
export const generateTelUrl = (phone: string): string => {
  const digits = sanitizePhoneToDigits(phone);
  return `tel:+${digits}`;
};

/**
 * Formats a phone number input as "0 (5XX) XXX XX XX".
 * Automatically normalizes country codes (+90, 90) into the local '0' prefix.
 * 
 * @param value - The raw input string
 * @returns The formatted string
 */
export const formatTurkishPhoneInput = (value: string): string => {
  if (!value) return "";

  // Extract digits only
  let digits = sanitizePhoneToDigits(value);

  // Normalize Turkish country code +90 or 90 to 0
  if (digits.startsWith("90") && digits.length > 2) {
    digits = "0" + digits.substring(2);
  }
  
  // Prepend 0 if missing (common for TR standard)
  if (digits.length > 0 && !digits.startsWith("0")) {
    digits = "0" + digits;
  }

  // Standard 11 digits for Turkey (05551234567)
  digits = digits.substring(0, 11);

  // Apply masking: 0 (5XX) XXX XX XX
  let formatted = "";
  if (digits.length > 0) {
    formatted = digits.substring(0, 1);
  }
  if (digits.length > 1) {
    formatted += " (" + digits.substring(1, 4);
  }
  if (digits.length >= 4) {
    formatted += ") " + digits.substring(4, 7);
  }
  if (digits.length >= 7) {
    formatted += " " + digits.substring(7, 9);
  }
  if (digits.length >= 9) {
    formatted += " " + digits.substring(9, 11);
  }

  return formatted;
};

/**
 * Normalizes any valid Turkish phone into the canonical E.164 format (+905551234567).
 * Ideal for backend processing and APIs.
 */
export const normalizeTurkishPhone = (value: string): string => {
  let digits = sanitizePhoneToDigits(value);
  
  if (digits.startsWith("90")) {
    return "+" + digits;
  }
  if (digits.startsWith("0")) {
    return "+90" + digits.substring(1);
  }
  if (digits.length === 10) {
    return "+90" + digits;
  }
  return "+" + digits; 
};
