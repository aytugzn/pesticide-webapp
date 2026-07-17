const ISTANBUL_TIME_ZONE = "Europe/Istanbul";

const TURKISH_DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  timeZone: ISTANBUL_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const TURKISH_TIME_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  timeZone: ISTANBUL_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export type TurkishDateTime = {
  date: string;
  time: string;
};

/**
 * Formats a millisecond timestamp as compact Istanbul date and time parts.
 *
 * @param timestampMs - Valid Unix timestamp in milliseconds
 * @returns dd.MM.yyyy and HH:mm parts, or null for an invalid value
 */
export const formatTurkishDateTime = (
  timestampMs: number,
): TurkishDateTime | null => {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) return null;

  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) return null;

  const dateParts = TURKISH_DATE_FORMATTER.formatToParts(date);
  const timeParts = TURKISH_TIME_FORMATTER.formatToParts(date);
  const day = dateParts.find((part) => part.type === "day")?.value;
  const month = dateParts.find((part) => part.type === "month")?.value;
  const year = dateParts.find((part) => part.type === "year")?.value;
  const hour = timeParts.find((part) => part.type === "hour")?.value;
  const minute = timeParts.find((part) => part.type === "minute")?.value;

  return day && month && year && hour && minute
    ? { date: `${day}.${month}.${year}`, time: `${hour}:${minute}` }
    : null;
};
