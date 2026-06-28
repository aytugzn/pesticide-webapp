"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { DICTIONARY } from "@/constants/dictionary";
import { formatTemplate } from "@/utils/template";
import {
  formatTurkishPhoneInput,
  sanitizePhoneToDigits,
  normalizeTurkishPhone
} from "@/utils/phone";
import { sendTelegramContactRequest } from "@/lib/telegram";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ContactRequestDoc } from "@/types";

type SendContactResponse = {
  success: boolean;
  error?: string;
};

const uiDict = DICTIONARY.home.contact;
const sysDict = DICTIONARY.systemErrors;

// Max pending (unresolved) contact requests per IP
const PENDING_LIMIT = 3;

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

  const db = getAdminDb();
  const pendingSnap = await db
    .collection("contact_requests")
    .where("ip", "==", ip)
    .where("status", "==", "pending")
    .get();

  if (pendingSnap.size >= PENDING_LIMIT) {
    return { success: false, error: uiDict.contactRequest.pendingLimitReached };
  }

  const { name, phone, service, region } = parsed.data;

  // 1. Create an empty document reference (and ID) before saving to Firestore
  const docRef = db.collection("contact_requests").doc();
  const requestId = docRef.id;

  // 2. Prepare the message
  const cleanPhone = normalizeTurkishPhone(phone);
  const message = formatTemplate(uiDict.telegram.template, {
    name,
    phone: cleanPhone,
    rawPhone: cleanPhone,
    service: service || uiDict.telegram.notSpecified,
    region: region || uiDict.telegram.notSpecified,
  });

  // 3. Send to Telegram first
  const result = await sendTelegramContactRequest(message, requestId);

  // 4. If Telegram fails: return error, do NOT save anything to the database.
  if (!result.success) {
    if (result.missingConfig) {
      if (process.env.NODE_ENV === "production") {
        return { success: false, error: uiDict.form.error };
      }
      console.warn(sysDict.logs.telegramConfig);
      return { success: true };
    }
    return { success: false, error: uiDict.form.error };
  }

  // 5. If Telegram is successful: save to the database using the previously generated ID
  const requestData: Omit<ContactRequestDoc, "id"> = {
    ip,
    name,
    phone,
    service: service || "",
    region: region || "",
    status: "pending",
    createdAt: Date.now(),
    telegramMessageId: result.messageId,
    telegramChatId: result.chatId,
  };

  try {
    await docRef.set(requestData);
  } catch (error) {
    console.error(sysDict.logs.contactRequestSave, error);
  }

  return { success: true };
};