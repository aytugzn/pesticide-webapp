import "server-only";
import { DICTIONARY } from "@/constants/dictionary";
import {
  fetchWithTimeout,
  isProviderTimeoutError,
} from "@/lib/serverRequest";

const telegramDict = DICTIONARY.telegram;
const TELEGRAM_TIMEOUT_MS = 15_000;

const TELEGRAM_LOG_MESSAGES = {
  missingConfig: "Missing Telegram bot token or chat ID",
  apiFailed: "Telegram API request failed",
  networkError: "Network error while sending Telegram message",
  timeout: "Telegram API request timed out",
};

const TELEGRAM_ERRORS = {
  missingConfig: "TELEGRAM_MISSING_CONFIG",
  apiFailed: "TELEGRAM_API_FAILED",
  networkError: "TELEGRAM_NETWORK_ERROR",
  timeout: "TELEGRAM_TIMEOUT",
};

type TelegramResult =
  | { success: true; messageId: number; chatId: string }
  | { success: false; error: string; missingConfig?: boolean };

type TelegramEditResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Sends a contact request notification to the configured Telegram chat.
 * Includes a single inline button:
 * - "✅ Arandı / Kapat": a callback button that triggers the webhook to resolve the request.
 * (The dialer link is embedded directly in the text message to bypass Telegram restrictions).
 *
 * @param message - The formatted text message to send
 * @param requestId - The Firestore document ID, embedded in the callback button data
 * @returns Result object with messageId and chatId on success (needed to edit the message later)
 */
export const sendTelegramContactRequest = async (
  message: string,
  requestId: string
): Promise<TelegramResult> => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error(TELEGRAM_LOG_MESSAGES.missingConfig);
    return { success: false, error: TELEGRAM_ERRORS.missingConfig, missingConfig: true };
  }

  try {
    const response = await fetchWithTimeout(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              // Callback: triggers our webhook to resolve this request
              { text: telegramDict.resolveButton, callback_data: `resolve_${requestId}` },
            ],
          ],
        },
      }),
    }, TELEGRAM_TIMEOUT_MS, "telegram");

    if (!response.ok) {
      console.error(TELEGRAM_LOG_MESSAGES.apiFailed, {
        status: response.status,
      });
      return { success: false, error: TELEGRAM_ERRORS.apiFailed };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.result.message_id,
      chatId: String(data.result.chat.id),
    };
  } catch (error: unknown) {
    if (isProviderTimeoutError(error)) {
      console.error(TELEGRAM_LOG_MESSAGES.timeout);
      return { success: false, error: TELEGRAM_ERRORS.timeout };
    }
    console.error(TELEGRAM_LOG_MESSAGES.networkError);
    return { success: false, error: TELEGRAM_ERRORS.networkError };
  }
};

/**
 * Edits an existing Telegram message to mark a contact request as resolved.
 * Replaces the original message text and removes the inline keyboard buttons.
 *
 * @param chatId - The Telegram chat ID where the message lives
 * @param messageId - The Telegram message ID to edit
 */
export const editTelegramMessageAsResolved = async (
  chatId: string,
  messageId: number
): Promise<TelegramEditResult> => {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.error(TELEGRAM_LOG_MESSAGES.missingConfig);
    return { success: false, error: TELEGRAM_ERRORS.missingConfig };
  }

  try {
    const response = await fetchWithTimeout(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: telegramDict.resolvedMessage,
        reply_markup: { inline_keyboard: [] }, // Remove all buttons
      }),
    }, TELEGRAM_TIMEOUT_MS, "telegram");

    if (!response.ok) {
      console.error(TELEGRAM_LOG_MESSAGES.apiFailed, {
        status: response.status,
      });
      return { success: false, error: TELEGRAM_ERRORS.apiFailed };
    }

    return { success: true };
  } catch (error: unknown) {
    if (isProviderTimeoutError(error)) {
      console.error(TELEGRAM_LOG_MESSAGES.timeout);
      return { success: false, error: TELEGRAM_ERRORS.timeout };
    }
    console.error(TELEGRAM_LOG_MESSAGES.networkError);
    return { success: false, error: TELEGRAM_ERRORS.networkError };
  }
};

/**
 * Sends a generic text message to the configured Telegram admin chat.
 * Used for system alerts (e.g., database update failures).
 */
export const sendTelegramAdminMessage = async (message: string): Promise<void> => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) return;

  try {
    await fetchWithTimeout(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      },
      TELEGRAM_TIMEOUT_MS,
      "telegram",
    );
  } catch (error: unknown) {
    console.warn("Telegram admin notification failed", {
      reason: isProviderTimeoutError(error) ? "timeout" : "network",
    });
  }
};

/**
 * Answers a Telegram callback query to dismiss the "loading spinner" on the button.
 * Can optionally show an alert box with custom text.
 */
export const answerTelegramCallback = async (
  callbackQueryId: string,
  options?: { showAlert?: boolean; text?: string }
): Promise<void> => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    await fetchWithTimeout(
      `https://api.telegram.org/bot${token}/answerCallbackQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          ...(options?.showAlert ? { show_alert: true } : {}),
          ...(options?.text ? { text: options.text } : {}),
        }),
      },
      TELEGRAM_TIMEOUT_MS,
      "telegram",
    );
  } catch (error: unknown) {
    console.warn("Telegram callback answer failed", {
      reason: isProviderTimeoutError(error) ? "timeout" : "network",
    });
  }
};
