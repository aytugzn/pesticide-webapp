import { NextRequest, NextResponse } from "next/server";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  editTelegramMessageAsResolved,
  answerTelegramCallback,
  sendTelegramAdminMessage,
} from "@/lib/telegram";
import { z } from "zod";

const telegramCallbackQuerySchema = z.object({
  callback_query: z.object({
    id: z.string(),
    data: z.string().optional(),
    message: z.object({
      message_id: z.number(),
      chat: z.object({
        id: z.number(),
      }),
    }).optional(),
  }).optional(),
});

const telegramDict = DICTIONARY.home.contact.telegram;

/**
 * POST /api/telegram-webhook
 *
 * Listens only for the "resolve_" callback button.
 * The "Call" button directly triggers a tel: URL, bypassing the webhook.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // --- 1. Security: Verify the secret token ---
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!secret) {
    console.error("TELEGRAM_WEBHOOK_SECRET is missing");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token");
  if (incomingSecret !== secret) {
    console.warn("Webhook secret mismatch or missing");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // --- 2. Only handle valid callback_query updates ---
  const parsed = telegramCallbackQuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  const callbackQuery = parsed.data.callback_query;
  const message = callbackQuery?.message;

  if (!callbackQuery || !message) {
    return NextResponse.json({ ok: true });
  }

  const callbackQueryId = callbackQuery.id;
  const callbackData = callbackQuery.data;
  const chatId = String(message.chat.id);
  const messageId = message.message_id;

  // --- 3. Parse callback_data ---
  let requestId: string | null = null;

  // We only care about the "resolve_" prefix now
  if (callbackData?.startsWith("resolve_")) {
    requestId = callbackData.slice("resolve_".length);
  }

  if (!requestId) {
    // Unknown button — just dismiss the spinner
    await answerTelegramCallback(callbackQueryId);
    return NextResponse.json({ ok: true });
  }

  // --- 4. Database Operations and Error Handling ---
  try {
    // 4A. Try updating Firestore first
    await getAdminDb()
      .collection("messages")
      .doc(requestId)
      .update({ status: "resolved" });

    // 4B. If successful: dismiss spinner and mark message as resolved
    await answerTelegramCallback(callbackQueryId);
    await editTelegramMessageAsResolved(chatId, messageId);

  } catch (error) {
    console.error("Failed to resolve contact request", error);

    // 4C. ERROR STATE: Failed to update database
    // Send an extra warning message to admin from dictionary
    await sendTelegramAdminMessage(telegramDict.dbErrorMessage);

    // Dismiss spinner and show alert to the clicking user from dictionary
    await answerTelegramCallback(callbackQueryId, {
      showAlert: true,
      text: telegramDict.dbErrorAlert,
    });
  }

  return NextResponse.json({ ok: true });
}