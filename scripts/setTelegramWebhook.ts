import { isIP } from "node:net";
import { config } from "dotenv";
import { z } from "zod";
import { AppError } from "../src/lib/exceptions";

config({ path: ".env.local", override: false, quiet: true });

const WEBHOOK_PATH = "/api/telegram-webhook";
const PROBE_TIMEOUT_MS = 10_000;
const TELEGRAM_TIMEOUT_MS = 15_000;

const telegramResponseSchema = z.object({
  ok: z.boolean(),
});

const webhookInfoResponseSchema = z.object({
  ok: z.literal(true),
  result: z.object({
    url: z.string().url(),
    has_custom_certificate: z.boolean().optional(),
    pending_update_count: z.number().int().nonnegative(),
    last_error_date: z.number().int().nonnegative().optional(),
    last_error_message: z.string().optional(),
    max_connections: z.number().int().positive().optional(),
    allowed_updates: z.array(z.string()).optional(),
  }),
});

type OriginSource = "TELEGRAM_WEBHOOK_ORIGIN" | "VERCEL_PROJECT_PRODUCTION_URL";

type ResolvedOrigin = {
  source: OriginSource;
  url: URL;
};

/**
 * Returns true when an unknown value is a plain object-like record.
 *
 * @param value - Value to inspect
 * @returns Whether the value can be safely accessed as a record
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Creates a controlled setup error without exposing credentials or response bodies.
 *
 * @param message - Safe developer-facing error message
 * @param code - Stable setup error code
 * @returns AppError instance suitable for throwing
 */
const createSetupError = (message: string, code: string): AppError =>
  new AppError(message, code);

/**
 * Reads a required environment value without logging its contents.
 *
 * @param name - Environment variable name
 * @returns Trimmed environment value
 */
const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw createSetupError(`Missing required environment variable: ${name}`, "ENV_MISSING");
  }

  return value;
};

/**
 * Rejects local, private, or literal IP webhook hostnames.
 *
 * @param hostname - Normalized URL hostname
 * @returns Whether the hostname is unsafe for a production webhook
 */
const isUnsafeHostname = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  return (
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    isIP(normalized) !== 0
  );
};

/**
 * Parses and validates a production-only webhook origin.
 *
 * @param rawValue - Configured origin or Vercel production hostname
 * @param source - Environment variable supplying the value
 * @returns Normalized HTTPS origin URL
 */
const parseOrigin = (rawValue: string, source: OriginSource): URL => {
  const candidate =
    source === "VERCEL_PROJECT_PRODUCTION_URL" && !rawValue.includes("://")
      ? `https://${rawValue}`
      : rawValue;

  let parsed: URL;

  try {
    parsed = new URL(candidate);
  } catch {
    throw createSetupError(`${source} must be a valid production origin`, "INVALID_ORIGIN");
  }

  if (parsed.protocol !== "https:") {
    throw createSetupError(`${source} must use HTTPS`, "INSECURE_ORIGIN");
  }

  if (
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    (parsed.pathname !== "/" && parsed.pathname !== "")
  ) {
    throw createSetupError(`${source} must contain only an HTTPS origin`, "INVALID_ORIGIN_SHAPE");
  }

  if (isUnsafeHostname(parsed.hostname)) {
    throw createSetupError(`${source} cannot target a local, private, or IP hostname`, "UNSAFE_ORIGIN");
  }

  return new URL(parsed.origin);
};

/**
 * Resolves the webhook origin from explicit configuration before the Vercel system hostname.
 *
 * @returns Resolved origin and the environment source used
 */
const resolveWebhookOrigin = (): ResolvedOrigin => {
  const explicitOrigin = process.env.TELEGRAM_WEBHOOK_ORIGIN?.trim();

  if (explicitOrigin) {
    return {
      source: "TELEGRAM_WEBHOOK_ORIGIN",
      url: parseOrigin(explicitOrigin, "TELEGRAM_WEBHOOK_ORIGIN"),
    };
  }

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  if (vercelProductionUrl) {
    return {
      source: "VERCEL_PROJECT_PRODUCTION_URL",
      url: parseOrigin(vercelProductionUrl, "VERCEL_PROJECT_PRODUCTION_URL"),
    };
  }

  throw createSetupError(
    "TELEGRAM_WEBHOOK_ORIGIN or VERCEL_PROJECT_PRODUCTION_URL is required",
    "WEBHOOK_ORIGIN_MISSING",
  );
};

/**
 * Builds the fixed webhook route and optionally adds the Vercel protection bypass.
 *
 * @param origin - Validated production origin
 * @param bypassSecret - Optional Vercel automation bypass secret
 * @returns Complete webhook URL kept in memory only
 */
const buildWebhookUrl = (origin: URL, bypassSecret?: string): URL => {
  const webhookUrl = new URL(WEBHOOK_PATH, `${origin.origin}/`);

  if (bypassSecret) {
    webhookUrl.searchParams.set("x-vercel-protection-bypass", bypassSecret);
  }

  return webhookUrl;
};

/**
 * Produces a log-safe webhook target with all query values redacted.
 *
 * @param webhookUrl - Complete webhook URL
 * @returns Redacted target suitable for terminal output
 */
const redactWebhookUrl = (webhookUrl: URL): string =>
  `${webhookUrl.origin}${webhookUrl.pathname}${webhookUrl.search ? "?<redacted>" : ""}`;

/**
 * Reads an HTTP response body as unknown JSON without exposing raw content.
 *
 * @param response - Fetch response
 * @returns Parsed JSON or null when the body is not valid JSON
 */
const readJsonBody = async (response: Response): Promise<unknown | null> => {
  try {
    return JSON.parse(await response.text()) as unknown;
  } catch {
    return null;
  }
};

/**
 * Detects Vercel Authentication or protection responses before route-level handling.
 *
 * @param response - Fetch response
 * @param body - Parsed response body
 * @returns Whether Vercel blocked the request before it reached the application
 */
const isVercelProtectionResponse = (response: Response, body: unknown): boolean => {
  const location = response.headers.get("location") || "";
  const contentType = response.headers.get("content-type") || "";
  const error = isRecord(body) && isRecord(body.error) ? body.error : null;
  const protectionMessage = error && typeof error.message === "string" ? error.message : "";

  return (
    location.includes("vercel.com/sso-api") ||
    protectionMessage.toLowerCase().includes("protected deployment") ||
    (response.status >= 300 && response.status < 400) ||
    contentType.includes("text/html")
  );
};

/**
 * Sends a harmless webhook probe that never contains callback data or a Firestore document ID.
 *
 * @param webhookUrl - Complete production webhook URL
 * @param webhookSecret - Optional Telegram secret header for authenticated verification
 * @returns HTTP response and parsed JSON body
 */
const sendProbe = async (
  webhookUrl: URL,
  webhookSecret?: string,
): Promise<{ response: Response; body: unknown | null }> => {
  const response = await fetch(webhookUrl, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      ...(webhookSecret
        ? { "X-Telegram-Bot-Api-Secret-Token": webhookSecret }
        : {}),
    },
    body: JSON.stringify({ update_id: 0 }),
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
  });

  return { response, body: await readJsonBody(response) };
};

/**
 * Verifies route reachability and exact production Telegram secret matching.
 *
 * @param webhookUrl - Complete production webhook URL
 * @param webhookSecret - Telegram webhook secret expected by the deployed route
 */
const verifyWebhookEndpoint = async (
  webhookUrl: URL,
  webhookSecret: string,
): Promise<void> => {
  const anonymousProbe = await sendProbe(webhookUrl);

  if (isVercelProtectionResponse(anonymousProbe.response, anonymousProbe.body)) {
    throw createSetupError(
      "Vercel deployment protection blocked the webhook probe",
      "VERCEL_PROTECTION_BLOCKED",
    );
  }

  if (
    anonymousProbe.response.status !== 401 ||
    !isRecord(anonymousProbe.body) ||
    anonymousProbe.body.ok !== false
  ) {
    throw createSetupError(
      "Webhook endpoint did not return the expected unauthenticated response",
      "WEBHOOK_PROBE_REJECTED",
    );
  }

  const authenticatedProbe = await sendProbe(webhookUrl, webhookSecret);

  if (isVercelProtectionResponse(authenticatedProbe.response, authenticatedProbe.body)) {
    throw createSetupError(
      "Vercel deployment protection blocked the authenticated webhook probe",
      "VERCEL_PROTECTION_BLOCKED",
    );
  }

  if (
    authenticatedProbe.response.status !== 200 ||
    !isRecord(authenticatedProbe.body) ||
    authenticatedProbe.body.ok !== true
  ) {
    throw createSetupError(
      "Production webhook secret does not match the deployed route",
      "WEBHOOK_SECRET_MISMATCH",
    );
  }
};

/**
 * Calls a Telegram Bot API method without logging the token-bearing URL.
 *
 * @param token - Telegram bot token
 * @param method - Bot API method name
 * @param payload - JSON request payload
 * @returns HTTP response and parsed JSON body
 */
const callTelegramApi = async (
  token: string,
  method: "setWebhook" | "getWebhookInfo",
  payload?: Record<string, unknown>,
): Promise<{ response: Response; body: unknown | null }> => {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
    signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
  });

  return { response, body: await readJsonBody(response) };
};

/**
 * Registers and then independently verifies the Telegram webhook configuration.
 *
 * @param token - Telegram bot token
 * @param webhookSecret - Telegram callback secret token
 * @param webhookUrl - Verified production webhook URL
 */
const registerTelegramWebhook = async (
  token: string,
  webhookSecret: string,
  webhookUrl: URL,
): Promise<void> => {
  const registration = await callTelegramApi(token, "setWebhook", {
    url: webhookUrl.toString(),
    secret_token: webhookSecret,
    allowed_updates: ["callback_query"],
    drop_pending_updates: false,
  });
  const registrationBody = telegramResponseSchema.safeParse(registration.body);

  if (!registration.response.ok || !registrationBody.success || !registrationBody.data.ok) {
    throw createSetupError("Telegram rejected the webhook registration", "TELEGRAM_SET_FAILED");
  }

  const verification = await callTelegramApi(token, "getWebhookInfo");
  const verificationBody = webhookInfoResponseSchema.safeParse(verification.body);

  if (!verification.response.ok || !verificationBody.success) {
    throw createSetupError("Telegram webhook verification failed", "TELEGRAM_INFO_FAILED");
  }

  const info = verificationBody.data.result;
  const registeredUrl = new URL(info.url);
  const allowedUpdates = info.allowed_updates || [];

  if (registeredUrl.toString() !== webhookUrl.toString()) {
    throw createSetupError("Telegram registered an unexpected webhook URL", "TELEGRAM_URL_MISMATCH");
  }

  if (allowedUpdates.length !== 1 || allowedUpdates[0] !== "callback_query") {
    throw createSetupError(
      "Telegram registered unexpected update filters",
      "TELEGRAM_UPDATES_MISMATCH",
    );
  }

  if (info.last_error_message) {
    throw createSetupError(
      "Telegram reports a webhook delivery error",
      "TELEGRAM_DELIVERY_ERROR",
    );
  }

  console.log("Telegram webhook registered", {
    target: redactWebhookUrl(webhookUrl),
    allowedUpdates,
    pendingUpdateCount: info.pending_update_count,
    lastErrorDate: info.last_error_date || null,
  });
};

/**
 * Runs endpoint verification and optional one-time Telegram registration.
 */
const main = async (): Promise<void> => {
  const dryRun = process.argv.includes("--dry-run");
  const webhookSecret = getRequiredEnv("TELEGRAM_WEBHOOK_SECRET");
  const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  const resolvedOrigin = resolveWebhookOrigin();
  const webhookUrl = buildWebhookUrl(resolvedOrigin.url, bypassSecret);

  console.log("Verifying Telegram webhook endpoint", {
    source: resolvedOrigin.source,
    target: redactWebhookUrl(webhookUrl),
    usesVercelAutomationBypass: Boolean(bypassSecret),
  });

  await verifyWebhookEndpoint(webhookUrl, webhookSecret);

  if (dryRun) {
    console.log("Telegram webhook dry run completed");
    return;
  }

  const token = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  await registerTelegramWebhook(token, webhookSecret, webhookUrl);
};

main().catch((error: unknown) => {
  if (error instanceof AppError) {
    console.error("Telegram webhook setup failed", {
      code: error.code,
      message: error.message,
    });
  } else {
    console.error("Telegram webhook setup failed", { code: "UNEXPECTED_ERROR" });
  }

  process.exitCode = 1;
});
