"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { DICTIONARY } from "@/constants/dictionary";
import { formatTemplate } from "@/utils/template";
import { rateLimit } from "@/utils/rate-limit";
import { formatTurkishPhoneInput, sanitizePhoneToDigits } from "@/utils/phone";
import { sendTelegramMessage } from "@/lib/telegram";

type SendContactResponse = {
  success: boolean;
  error?: string;
};

const uiDict = DICTIONARY.home.contact;
const sysDict = DICTIONARY.systemErrors;

const contactSchema = z.object({
  name: z.string({
    message: uiDict.validation.nameRequired
  })
    .trim()
    .min(2, uiDict.validation.nameMin)
    .max(100, uiDict.validation.nameMax),

  phone: z.string({
    message: uiDict.validation.phoneRequired
  })
    .trim()
    .regex(/^[0-9+\-\s()]+$/, uiDict.validation.phoneRegex)
    .transform(val => sanitizePhoneToDigits(val))
    .refine(digits => digits.length === 10 || digits.length === 11, uiDict.validation.phoneInvalid)
    .transform(digits => formatTurkishPhoneInput(digits)),

  service: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
});

export const sendContactForm = async (formData: FormData): Promise<SendContactResponse> => {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || uiDict.validation.invalidFormat };
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  
  // Rate Limit: max 3 requests per minute
  const isAllowed = rateLimit(ip, 3, 60000);
  
  if (!isAllowed) {
    return { success: false, error: uiDict.validation.rateLimit };
  }

  const { name, phone, service, region } = parsed.data;

  const message = formatTemplate(uiDict.telegram.template, {
    name,
    phone,
    service: service || uiDict.telegram.notSpecified,
    region: region || uiDict.telegram.notSpecified,
  });

  const result = await sendTelegramMessage(message);

  if (!result.success) {
    if (result.missingConfig) {
      if (process.env.NODE_ENV === "production") {
        return { success: false, error: uiDict.form.error };
      }
      console.warn(sysDict.logs.telegramConfig);
      return { success: true };
    }
    
    // API or network failed
    return { success: false, error: uiDict.form.error };
  }

  return { success: true };
};
