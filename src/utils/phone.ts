export const TURKISH_PHONE_NATIONAL_DIGIT_LENGTH = 10;
export const TURKISH_PHONE_INPUT_MAX_LENGTH = 19;
export const TURKISH_PHONE_COUNTRY_PREFIX = "+90";

type TurkishPhonePrefixKind = "international" | "local" | "national";
type TurkishPhoneInputIssue =
  | "invalid_characters"
  | "invalid_prefix"
  | "too_long";

type TurkishPhoneParts = {
  isPrefixValid: boolean;
  localDigits: string;
  prefixKind: TurkishPhonePrefixKind;
  progressivePrefix: string;
};

export type TurkishPhoneParseResult =
  | {
      success: true;
      canonicalPhone: string;
      nationalNumber: string;
    }
  | {
      success: false;
      reason:
        | "empty"
        | "incomplete"
        | "invalid_characters"
        | "invalid_number"
        | "invalid_prefix"
        | "too_long";
    };

export type TurkishPhoneInputUpdate = {
  accepted: boolean;
  value: string;
  issue?: TurkishPhoneInputIssue;
};

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
    if (char >= "0" && char <= "9") {
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
 * Classifies a Turkish country/local prefix without truncating meaningful digits.
 *
 * @param value - Raw phone value
 * @param digits - Digit-only representation of the raw value
 * @returns Prefix metadata and the complete national-number candidate
 */
const getTurkishPhoneParts = (
  value: string,
  digits: string,
): TurkishPhoneParts => {
  const hasPlusPrefix = value.trimStart().startsWith("+");

  if (hasPlusPrefix) {
    if (!digits) {
      return {
        isPrefixValid: true,
        localDigits: "",
        prefixKind: "international",
        progressivePrefix: "+",
      };
    }

    if (digits === "9") {
      return {
        isPrefixValid: true,
        localDigits: "",
        prefixKind: "international",
        progressivePrefix: "+9",
      };
    }

    if (!digits.startsWith("90")) {
      return {
        isPrefixValid: false,
        localDigits: digits,
        prefixKind: "international",
        progressivePrefix: "",
      };
    }

    return {
      isPrefixValid: true,
      localDigits: digits.slice(2),
      prefixKind: "international",
      progressivePrefix: digits === "90" ? "+90" : "",
    };
  }

  if (
    digits.startsWith("90") &&
    digits.length >= TURKISH_PHONE_NATIONAL_DIGIT_LENGTH + 2
  ) {
    return {
      isPrefixValid: true,
      localDigits: digits.slice(2),
      prefixKind: "international",
      progressivePrefix: digits === "90" ? "90" : "",
    };
  }

  if (digits.startsWith("0")) {
    return {
      isPrefixValid: true,
      localDigits: digits.slice(1),
      prefixKind: "local",
      progressivePrefix: "",
    };
  }

  return {
    isPrefixValid: true,
    localDigits: digits,
    prefixKind: "national",
    progressivePrefix: "",
  };
};

/**
 * Groups national phone digits for display while preserving overflow.
 *
 * @param nationalDigits - Prefix-free national phone digits
 * @returns National display value without a country or trunk prefix
 */
export const formatTurkishNationalPhoneInput = (
  nationalDigits: string,
): string => {
  const groups = [
    nationalDigits.slice(0, 3),
    nationalDigits.slice(3, 6),
    nationalDigits.slice(6, 8),
    nationalDigits.slice(8, 10),
    nationalDigits.slice(10),
  ].filter(Boolean);

  return groups.join(" ");
};

/**
 * Groups local digits for display while preserving overflow for validation.
 *
 * @param localDigits - Prefix-free local phone digits
 * @returns Locally formatted digits with any overflow still visible
 */
const formatLocalPhoneDigits = (localDigits: string): string => {
  const formattedNationalPhone =
    formatTurkishNationalPhoneInput(localDigits);
  return formattedNationalPhone ? `0${formattedNationalPhone}` : "";
};

/**
 * Returns the first client-input safety issue without mutating the value.
 *
 * @param value - Prospective complete input value
 * @returns The rejected-input reason, or undefined when the change is safe
 */
const getTurkishPhoneInputIssue = (
  value: string,
): TurkishPhoneInputIssue | undefined => {
  if (value.length > TURKISH_PHONE_INPUT_MAX_LENGTH) return "too_long";
  if (!value) return undefined;
  if (!hasSupportedPhoneCharacters(value)) return "invalid_characters";

  const digits = sanitizePhoneToDigits(value);
  const parts = getTurkishPhoneParts(value, digits);
  if (!parts.isPrefixValid) return "invalid_prefix";
  if (parts.localDigits.length > TURKISH_PHONE_NATIONAL_DIGIT_LENGTH) {
    return "too_long";
  }

  return undefined;
};

/**
 * Checks a complete progressive input candidate before browser formatting.
 *
 * @param value - Prospective complete phone input value
 * @returns Whether the value has supported syntax and no digit overflow
 */
export const isTurkishPhoneInputAllowed = (value: string): boolean =>
  !getTurkishPhoneInputIssue(value);

/**
 * Formats a safe progressive value with optional incomplete-prefix preservation.
 *
 * @param value - Raw, already safety-checked input value
 * @param preserveProgressivePrefix - Whether +, +9, +90, 9, and 90 remain visible
 * @returns Progressive local display value without truncation
 */
const formatProgressiveTurkishPhone = (
  value: string,
  preserveProgressivePrefix: boolean,
): string => {
  if (!value) return "";

  const digits = sanitizePhoneToDigits(value);
  if (!digits) {
    return preserveProgressivePrefix && value.trim() === "+" ? "+" : "";
  }

  const parts = getTurkishPhoneParts(value, digits);
  if (preserveProgressivePrefix && parts.progressivePrefix) {
    return parts.progressivePrefix;
  }

  return parts.localDigits
    ? formatLocalPhoneDigits(parts.localDigits)
    : parts.prefixKind === "local"
      ? "0"
      : "";
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
 * Invalid or overflowing values are preserved rather than silently truncated.
 *
 * @param value - The raw input string
 * @returns The formatted string
 */
export const formatTurkishPhoneInput = (value: string): string => {
  if (!isTurkishPhoneInputAllowed(value)) return value;
  return formatProgressiveTurkishPhone(value, false);
};

/**
 * Formats the admin contact phone while preserving incomplete country prefixes.
 *
 * @param value - The raw settings input string
 * @returns Progressive local display value or the untouched invalid value
 */
export const formatTurkishSettingsPhoneInput = (value: string): string => {
  if (!isTurkishPhoneInputAllowed(value)) return value;
  return formatProgressiveTurkishPhone(value, true);
};

/**
 * Applies one controlled-input change without accepting overflow or bad syntax.
 *
 * @param currentValue - Currently rendered controlled value
 * @param nextValue - Browser-proposed value
 * @param inputType - Native input operation type when available
 * @param preserveProgressivePrefix - Whether incomplete country prefixes remain visible
 * @param selectionStart - Caret position after the native change
 * @returns Accepted formatted value or the unchanged current value with an issue
 */
export const getTurkishPhoneInputUpdate = (
  currentValue: string,
  nextValue: string,
  inputType = "",
  preserveProgressivePrefix = false,
  selectionStart: number | null = null,
): TurkishPhoneInputUpdate => {
  let candidateValue = nextValue;

  if (inputType === "deleteContentBackward") {
    const currentDigits = sanitizePhoneToDigits(currentValue);
    const nextDigits = sanitizePhoneToDigits(nextValue);

    if (currentDigits === nextDigits && nextDigits.length > 0) {
      const caret = selectionStart ?? nextValue.length;
      const removedCharacter = currentValue[caret];
      const removedFormattingCharacter =
        removedCharacter === " " ||
        removedCharacter === "-" ||
        removedCharacter === "(" ||
        removedCharacter === ")";
      if (removedFormattingCharacter) {
        const digitsBeforeCaret = sanitizePhoneToDigits(
          nextValue.slice(0, caret),
        ).length;
        const removeIndex = Math.max(0, digitsBeforeCaret - 1);
        candidateValue =
          nextDigits.slice(0, removeIndex) + nextDigits.slice(removeIndex + 1);
      }
    }
  }

  const issue = getTurkishPhoneInputIssue(candidateValue);
  if (issue) {
    return { accepted: false, value: currentValue, issue };
  }

  return {
    accepted: true,
    value: preserveProgressivePrefix
      ? formatTurkishSettingsPhoneInput(candidateValue)
      : formatTurkishPhoneInput(candidateValue),
  };
};

/**
 * Converts an admin national-phone input change into digit-only component state.
 * Complete local and country-code variants are accepted for paste/autofill,
 * while progressive keyboard input keeps only a leading trunk zero out of state.
 *
 * @param currentNationalNumber - Current digit-only national state
 * @param nextValue - Browser-proposed visible input value
 * @param inputType - Native input operation type when available
 * @param selectionStart - Caret position after the native change
 * @returns Accepted digit-only state or the unchanged current state with an issue
 */
export const getTurkishNationalPhoneInputUpdate = (
  currentNationalNumber: string,
  nextValue: string,
  inputType = "",
  selectionStart: number | null = null,
): TurkishPhoneInputUpdate => {
  if (!nextValue) return { accepted: true, value: "" };
  if (!hasSupportedPhoneCharacters(nextValue)) {
    return {
      accepted: false,
      value: currentNationalNumber,
      issue: "invalid_characters",
    };
  }

  if (
    currentNationalNumber.length === 0 &&
    sanitizePhoneToDigits(nextValue) === "0" &&
    !nextValue.trimStart().startsWith("+")
  ) {
    return { accepted: true, value: "" };
  }

  const parsedPhone = parseTurkishPhone(nextValue);
  if (parsedPhone.success) {
    return { accepted: true, value: parsedPhone.nationalNumber };
  }

  let nationalDigits = sanitizePhoneToDigits(nextValue);
  if (inputType === "deleteContentBackward") {
    const currentDisplay = formatTurkishNationalPhoneInput(
      currentNationalNumber,
    );
    if (nationalDigits === currentNationalNumber && nationalDigits.length > 0) {
      const caret = selectionStart ?? nextValue.length;
      if (currentDisplay[caret] === " ") {
        const digitsBeforeCaret = sanitizePhoneToDigits(
          nextValue.slice(0, caret),
        ).length;
        const removeIndex = Math.max(0, digitsBeforeCaret - 1);
        nationalDigits =
          nationalDigits.slice(0, removeIndex) +
          nationalDigits.slice(removeIndex + 1);
      }
    }
  }

  if (nationalDigits.length > TURKISH_PHONE_NATIONAL_DIGIT_LENGTH) {
    return {
      accepted: false,
      value: currentNationalNumber,
      issue: "too_long",
    };
  }
  if (nationalDigits.startsWith("0")) {
    return {
      accepted: false,
      value: currentNationalNumber,
      issue: "invalid_prefix",
    };
  }

  return { accepted: true, value: nationalDigits };
};

/**
 * Formats only a valid Turkish national number for user-facing display.
 *
 * @param value - Raw or canonical Turkish phone number
 * @returns Local display value, or an empty string for invalid input
 */
export const formatTurkishPhoneDisplay = (value: string): string => {
  const parsedPhone = parseTurkishPhone(value);
  return parsedPhone.success
    ? formatLocalPhoneDigits(parsedPhone.nationalNumber)
    : "";
};

/**
 * Strictly parses a complete Turkish phone without truncating overflow.
 *
 * @param value - Raw Turkish phone value
 * @returns Canonical/national values or a precise invalid-input reason
 */
export const parseTurkishPhone = (value: string): TurkishPhoneParseResult => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return { success: false, reason: "empty" };
  if (trimmedValue.length > TURKISH_PHONE_INPUT_MAX_LENGTH) {
    return { success: false, reason: "too_long" };
  }
  if (!hasSupportedPhoneCharacters(trimmedValue)) {
    return { success: false, reason: "invalid_characters" };
  }

  const digits = sanitizePhoneToDigits(trimmedValue);
  const parts = getTurkishPhoneParts(trimmedValue, digits);
  if (!parts.isPrefixValid) {
    return { success: false, reason: "invalid_prefix" };
  }
  if (parts.localDigits.length > TURKISH_PHONE_NATIONAL_DIGIT_LENGTH) {
    return { success: false, reason: "too_long" };
  }
  if (parts.localDigits.length < TURKISH_PHONE_NATIONAL_DIGIT_LENGTH) {
    return { success: false, reason: "incomplete" };
  }
  if (parts.localDigits.startsWith("0")) {
    return { success: false, reason: "invalid_number" };
  }

  return {
    success: true,
    canonicalPhone: `+90${parts.localDigits}`,
    nationalNumber: parts.localDigits,
  };
};

/**
 * Normalizes a complete Turkish phone into canonical E.164 form.
 *
 * @param value - Raw Turkish phone value
 * @returns Canonical +905551234567 value, or an empty string when invalid
 */
export const normalizeTurkishPhone = (value: string): string => {
  const parsedPhone = parseTurkishPhone(value);
  return parsedPhone.success ? parsedPhone.canonicalPhone : "";
};
