import { DICTIONARY } from "@/constants/dictionary";

const sysDict = DICTIONARY.systemErrors;

type TelegramResult = 
  | { success: true }
  | { success: false; error: string; missingConfig?: boolean };

/**
 * Sends a raw text message to the configured Telegram chat.
 * 
 * @param message - The text message to send
 * @returns Result object indicating success or failure
 */
export const sendTelegramMessage = async (message: string): Promise<TelegramResult> => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error(sysDict.env.telegram);
    return { success: false, error: sysDict.telegramReturns.missingConfig, missingConfig: true };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(sysDict.api.telegramFailed, errorData);
      return { success: false, error: sysDict.telegramReturns.apiFailed };
    }

    return { success: true };
  } catch (error) {
    console.error(sysDict.logs.telegramSend, error);
    return { success: false, error: sysDict.telegramReturns.networkError };
  }
};
