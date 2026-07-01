"use server";

import "server-only";

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
    .collection("messages")
    .where("ip", "==", ip)
    .where("status", "==", "pending")
    .get();

  if (pendingSnap.size >= PENDING_LIMIT) {
    return { success: false, error: uiDict.contactRequest.pendingLimitReached };
  }

  const { name, phone, service, region } = parsed.data;

  // 1. Create an empty document reference (and ID) before saving to Firestore
  const docRef = db.collection("messages").doc();
  const requestId = docRef.id;

  // Helper to escape HTML characters for Telegram's parse_mode: "HTML"
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  // 2. Prepare the message
  const cleanPhone = normalizeTurkishPhone(phone);
  const message = formatTemplate(uiDict.telegram.template, {
    name: escapeHtml(name),
    phone: cleanPhone, // Clean phone only contains digits and +
    rawPhone: cleanPhone,
    service: escapeHtml(service || uiDict.telegram.notSpecified),
    region: escapeHtml(region || uiDict.telegram.notSpecified),
  });

  // 3. Save the request before notifying external services.
  const requestData: Omit<ContactRequestDoc, "id"> = {
    ip,
    name,
    phone,
    service: service || "",
    region: region || "",
    status: "pending",
    createdAt: Date.now(),
    notificationStatus: "pending",
  };

  try {
    await docRef.set(requestData);
  } catch (error) {
    console.error("Failed to save contact request", error);
    return { success: false, error: uiDict.form.error };
  }

  // 4. Telegram is a notification channel; the lead is already safely stored.
  const result = await sendTelegramContactRequest(message, requestId);

  if (!result.success) {
    if (result.missingConfig) {
      console.warn("Telegram configuration is missing");
    }

    // Mark as failed but still return success to the user
    try {
      await docRef.set({ notificationStatus: "failed" }, { merge: true });
    } catch (e) {
      console.error("Failed to update notificationStatus to failed", e);
    }

    return { success: true };
  }

  try {
    await docRef.set(
      {
        telegramMessageId: result.messageId,
        telegramChatId: result.chatId,
        notificationStatus: "sent",
      },
      { merge: true },
    );
  } catch (error) {
    console.error("Failed to save contact request", error);
  }

  return { success: true };
};