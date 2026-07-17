import type { AdminMessageRow } from "./types";

const ISTANBUL_TIME_ZONE = "Europe/Istanbul";
const MILLISECONDS_PER_DAY = 86_400_000;

const ISTANBUL_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: ISTANBUL_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const readString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const isValidTimestamp = (value: number): boolean =>
  Number.isFinite(value) &&
  value > 0 &&
  !Number.isNaN(new Date(value).getTime());

const readTimestampParts = (
  value: Record<string, unknown>,
): { seconds: number; nanoseconds: number } | null => {
  const seconds =
    typeof value.seconds === "number"
      ? value.seconds
      : typeof value._seconds === "number"
        ? value._seconds
        : null;
  const nanoseconds =
    typeof value.nanoseconds === "number"
      ? value.nanoseconds
      : typeof value._nanoseconds === "number"
        ? value._nanoseconds
        : 0;

  if (
    seconds === null ||
    !Number.isFinite(seconds) ||
    !Number.isFinite(nanoseconds) ||
    nanoseconds < 0 ||
    nanoseconds >= 1_000_000_000
  ) {
    return null;
  }

  return { seconds, nanoseconds };
};

/**
 * Parses current numeric and legacy Firestore Timestamp createdAt values.
 *
 * @param value - Unknown createdAt field value
 * @returns Milliseconds since Unix epoch, or null when the value is invalid
 */
export const parseCreatedAtMillis = (value: unknown): number | null => {
  if (typeof value === "number") {
    return isValidTimestamp(value) ? value : null;
  }

  if (value instanceof Date) {
    const timestamp = value.getTime();
    return isValidTimestamp(timestamp) ? timestamp : null;
  }

  if (typeof value !== "object" || value === null) return null;

  const timestampValue = value as Record<string, unknown>;
  if (typeof timestampValue.toMillis === "function") {
    try {
      const timestamp = timestampValue.toMillis.call(value);
      return typeof timestamp === "number" && isValidTimestamp(timestamp)
        ? timestamp
        : null;
    } catch {
      return null;
    }
  }

  const parts = readTimestampParts(timestampValue);
  if (!parts) return null;

  const timestamp =
    parts.seconds * 1_000 + Math.floor(parts.nanoseconds / 1_000_000);
  return isValidTimestamp(timestamp) ? timestamp : null;
};

/**
 * Converts a timestamp to its Europe/Istanbul calendar-day index.
 *
 * @param timestampMs - Valid Unix timestamp in milliseconds
 * @returns An integer day index, or null for an invalid timestamp
 */
export const getIstanbulCalendarDayIndex = (
  timestampMs: number,
): number | null => {
  if (!isValidTimestamp(timestampMs)) return null;

  const parts = ISTANBUL_DATE_PARTS_FORMATTER.formatToParts(
    new Date(timestampMs),
  );
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const year = Number(parts.find((part) => part.type === "year")?.value);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year)
  ) {
    return null;
  }

  return Math.floor(Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY);
};

/**
 * Computes the exclusive cutoff day for requests older than seven Istanbul
 * calendar days. A request exactly seven days old is intentionally excluded.
 *
 * @param nowMs - Server-controlled current timestamp
 * @returns Exclusive Istanbul day cutoff, or null if the date is invalid
 */
export const getOverdueMessageCutoffDay = (
  nowMs: number,
): number | null => {
  const today = getIstanbulCalendarDayIndex(nowMs);
  return today === null ? null : today - 7;
};

/**
 * Checks whether a request date is strictly before the seven-day cutoff.
 *
 * @param createdAt - Parsed request creation time
 * @param cutoffDay - Exclusive Istanbul calendar-day cutoff
 * @returns True only for a valid request date older than seven days
 */
export const isMessageOlderThanCutoff = (
  createdAt: number | null,
  cutoffDay: number,
): boolean => {
  if (createdAt === null) return false;
  const createdDay = getIstanbulCalendarDayIndex(createdAt);
  return createdDay !== null && createdDay < cutoffDay;
};

/**
 * Converts an unknown Firestore message payload into a serializable admin row.
 * Unknown or legacy statuses are preserved for the client-side safe fallback.
 *
 * @param id - Firestore document ID used for row identity and mutations
 * @param value - Unknown Firestore document payload
 * @returns A defensive, serializable message row
 */
export const parseAdminMessageRow = (
  id: string,
  value: unknown,
): AdminMessageRow => {
  const data =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return {
    id,
    name: readString(data.name),
    phone: readString(data.phone),
    service: readString(data.service),
    region: readString(data.region),
    status: readString(data.status),
    createdAt: parseCreatedAtMillis(data.createdAt),
  };
};
