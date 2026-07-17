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
 * Checks whether a raw phone value contains only supported input characters.
 *
 * @param value - Untrusted phone input
 * @returns Whether the value can be safely parsed by the phone normalizer
 */
const hasSupportedPhoneCharacters = (value: string): boolean => {
  const trimmedValue = value.trim();
  let plusCount = 0;

  for (let index = 0; index < trimmedValue.length; index++) {
    const character = trimmedValue[index];
    const isDigit = character >= "0" && character <= "9";
    const isFormattingCharacter =
      character === " " ||
      character === "-" ||
      character === "(" ||
      character === ")";

    if (character === "+") {
      plusCount += 1;
      if (index !== 0 || plusCount > 1) return false;
    } else if (!isDigit && !isFormattingCharacter) {
      return false;
    }
  }

  return trimmedValue.length > 0;
};

/**
 * Removes a recognized Turkish country or local prefix without truncating.
 *
 * @param value - Raw phone value
 * @returns All remaining local digits, including any invalid overflow
 */
const getLocalPhoneDigits = (value: string): string => {
  const digits = sanitizePhoneToDigits(value);

  if (digits.startsWith("90")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
};

/**
 * Groups local digits for display while preserving overflow for validation.
 *
 * @param localDigits - Prefix-free local phone digits
 * @returns Locally formatted digits with any overflow still visible
 */
const formatLocalPhoneDigits = (localDigits: string): string => {
  const groups = [
    localDigits.slice(0, 3),
    localDigits.slice(3, 6),
    localDigits.slice(6, 8),
    localDigits.slice(8, 10),
    localDigits.slice(10),
  ].filter(Boolean);

  return groups.length > 0 ? `0${groups.join(" ")}` : "";
};

/**
 * Generates a WhatsApp API URL (wa.me) using a raw phone number.
 * 
 * @param phone - Raw phone string
 * @returns Formatted WhatsApp URL
 */
export const generateWhatsAppUrl = (phone: string): string => {
  const digits = sanitizePhoneToDigits(normalizeTurkishPhone(phone));
  return digits ? `https://wa.me/${digits}` : "";
};

/**
 * Generates a Telephone Link (tel:) using a raw phone number.
 * 
 * @param phone - Raw phone string
 * @returns Formatted tel protocol URL
 */
export const generateTelUrl = (phone: string): string => {
  const normalizedPhone = normalizeTurkishPhone(phone);
  return normalizedPhone ? `tel:${normalizedPhone}` : "";
};

/**
 * Formats a phone input progressively as "05XX XXX XX XX".
 * Country-code and local-prefix variants share the same visible mask.
 * 
 * @param value - The raw input string
 * @returns The formatted string
 */
export const formatTurkishPhoneInput = (value: string): string => {
  if (!value) return "";
  const digits = sanitizePhoneToDigits(value);
  if (!digits) return "";

  const localDigits = getLocalPhoneDigits(value);
  return localDigits ? formatLocalPhoneDigits(localDigits) : "0";
};

/**
 * Formats only a valid Turkish mobile number for user-facing display.
 *
 * @param value - Raw or canonical Turkish mobile number
 * @returns Local display value, or an empty string for invalid input
 */
export const formatTurkishPhoneDisplay = (value: string): string => {
  const canonicalPhone = normalizeTurkishPhone(value);
  return canonicalPhone
    ? formatLocalPhoneDigits(canonicalPhone.slice(3))
    : "";
};

/**
 * Normalizes any valid Turkish phone into the canonical E.164 format (+905551234567).
 * Ideal for backend processing and APIs.
 *
 * @param value - Raw Turkish phone value
 * @returns Canonical E.164-like phone value
 */
export const normalizeTurkishPhone = (value: string): string => {
  if (!hasSupportedPhoneCharacters(value)) return "";

  const digits = sanitizePhoneToDigits(value);
  const localDigits = getLocalPhoneDigits(value);
  const hasKnownPrefix =
    digits.startsWith("90") || digits.startsWith("0") || digits.length === 10;

  if (
    !hasKnownPrefix ||
    localDigits.length !== 10 ||
    !localDigits.startsWith("5")
  ) {
    return "";
  }

  return `+90${localDigits}`;
};
