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
import {
  createRateLimitHash,
  limitContactSubmission,
} from "@/lib/rateLimit";
import type { ContactRequestDoc, ActionResponse } from "@/types";
import { CONTACT_ERRORS, type ContactErrorCode } from "../types";


const uiDict = DICTIONARY.home.contact;
const telegramDict = DICTIONARY.telegram;

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
  website: z.string().optional(), // Honeypot field
});

export const sendContactForm = async (formData: FormData): Promise<ActionResponse<void, ContactErrorCode>> => {
  const rawData = Object.fromEntries(formData);

  // 1. Honeypot check: If the hidden 'website' field is filled, it's a bot.
  // We return success: true to trick the bot without writing to the DB or notifying Telegram.
  if (rawData.website) {
    return { success: true };
  }

  const parsed = contactSchema.safeParse(rawData);

  if (!parsed.success) {
    return { success: false, error: CONTACT_ERRORS.VALIDATION_FAILED };
  }

  const { name, phone, service, region } = parsed.data;
  const cleanPhone = normalizeTurkishPhone(phone);

  // 2. IP Handling & Hashing
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const realIp = headersList.get("x-real-ip");

  let ip = "unknown";
  if (forwarded) {
    ip = forwarded.split(",")[0].trim();
  } else if (realIp) {
    ip = realIp.trim();
  }

  // Create hashes (HMAC-SHA256) for data minimization
  let ipHash: string | null = null;
  let phoneHash: string | null = null;

  try {
    ipHash = ip !== "unknown" ? createRateLimitHash(ip) : null;
    phoneHash = createRateLimitHash(cleanPhone);

    // 3. Upstash Rate Limit (3 requests per 10 mins sliding window)
    if (ipHash) {
      const isAllowedIp = await limitContactSubmission(`contact:ip:${ipHash}`);
      if (!isAllowedIp) return { success: false, error: CONTACT_ERRORS.RATE_LIMITED };
    }

    if (phoneHash) {
      const isAllowedPhone = await limitContactSubmission(`contact:phone:${phoneHash}`);
      if (!isAllowedPhone) return { success: false, error: CONTACT_ERRORS.RATE_LIMITED };
    }
  } catch {
    // In production, missing config or Redis failure throws, so we safely fail closed
    return { success: false, error: CONTACT_ERRORS.SAVE_FAILED };
  }

  const db = getAdminDb();

  // 4. Pending Form Limit
  // If phoneHash is available, use it. Otherwise, fallback to cleanPhone (only if secret is missing).
  const messagesRef = db.collection("messages");
  const pendingSnap = phoneHash
    ? await messagesRef.where("phoneHash", "==", phoneHash).where("status", "==", "pending").get()
    : await messagesRef.where("phone", "==", cleanPhone).where("status", "==", "pending").get();

  if (pendingSnap.size >= PENDING_LIMIT) {
    return { success: false, error: CONTACT_ERRORS.PENDING_LIMIT_REACHED };
  }

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
  const message = formatTemplate(telegramDict.template, {
    name: escapeHtml(name),
    phone: cleanPhone, // Clean phone only contains digits and +
    rawPhone: cleanPhone,
    service: escapeHtml(service || telegramDict.notSpecified),
    region: escapeHtml(region || telegramDict.notSpecified),
  });

  // 5. Save the request before notifying external services.
  // Note: We intentionally avoid saving plain IP. We save hashes for debugging/analytics safely.
  const requestData: Omit<ContactRequestDoc, "id"> = {
    name,
    phone: cleanPhone, // Save clean format to ensure fallback pending limit consistency
    service: service || "",
    region: region || "",
    status: "pending",
    createdAt: Date.now(),
    notificationStatus: "pending",
  };

  if (ipHash) requestData.ipHash = ipHash;
  if (phoneHash) requestData.phoneHash = phoneHash;

  try {
    await docRef.set(requestData);
  } catch {
    console.error("Failed to save contact request");
    return { success: false, error: CONTACT_ERRORS.SAVE_FAILED };
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
    } catch {
      console.error("Failed to update contact notification status");
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
  } catch {
    console.error("Failed to save contact notification metadata");
  }

  return { success: true };
};
