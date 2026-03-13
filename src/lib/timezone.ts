import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const APP_TIMEZONE =
  process.env.NEXT_PUBLIC_APP_TIMEZONE ||
  process.env.APP_TIMEZONE ||
  "America/Argentina/Buenos_Aires";

export function formatDateInAppTimezone(date: Date): string {
  return formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd");
}

export function formatTimeInAppTimezone(date: Date): string {
  return formatInTimeZone(date, APP_TIMEZONE, "HH:mm");
}

export function toUtcDateFromAppDateTime(date: string, time: string): Date {
  return fromZonedTime(`${date}T${time}:00`, APP_TIMEZONE);
}

export function toUtcIsoFromAppDateTime(date: string, time: string): string {
  return toUtcDateFromAppDateTime(date, time).toISOString();
}
