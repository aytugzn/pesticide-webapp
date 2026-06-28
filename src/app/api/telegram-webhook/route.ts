import { NextRequest, NextResponse } from "next/server";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  editTelegramMessageAsResolved,
  answerTelegramCallback,
  sendTelegramAdminMessage,
} from "@/lib/telegram";

const sysDict = DICTIONARY.systemErrors;
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
  if (secret) {
    const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token");
    if (incomingSecret !== secret) {
      console.warn(sysDict.logs.webhookSecret);
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // --- 2. Only handle callback_query updates ---
  const callbackQuery = body.callback_query as {
    id: string;
    data: string;
    message: { message_id: number; chat: { id: number } };
  } | undefined;

  if (!callbackQuery) {
    return NextResponse.json({ ok: true });
  }

  const { id: callbackQueryId, data: callbackData, message } = callbackQuery;
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
      .collection("contact_requests")
      .doc(requestId)
      .update({ status: "resolved" });

    // 4B. If successful: dismiss spinner and mark message as resolved
    await answerTelegramCallback(callbackQueryId);
    await editTelegramMessageAsResolved(chatId, messageId);

  } catch (error) {
    console.error(sysDict.logs.contactRequestResolve, error);

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