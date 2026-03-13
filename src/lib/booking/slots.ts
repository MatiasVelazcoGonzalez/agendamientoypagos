import type { Booking } from "@/types/booking";
import { toUtcDateFromAppDateTime, toUtcIsoFromAppDateTime } from "@/lib/timezone";

export interface Slot {
  start: string;
  end: string;
}

const WORKING_HOURS = {
  start: 9,
  end: 18,
};

const SESSION_MINUTES = 60;

function toDateOnlyKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getWeekdayFromDateOnly(dateOnly: string): number {
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export const generateSlots = (startDate: Date, endDate: Date): Slot[] => {
  const slots: Slot[] = [];
  let cursor = new Date(Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate(),
  ));
  const limit = new Date(Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate(),
  ));

  while (cursor <= limit) {
    const dateOnly = toDateOnlyKey(cursor);
    const day = getWeekdayFromDateOnly(dateOnly);
    const isWeekday = day >= 1 && day <= 5;

    if (isWeekday) {
      for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour += 1) {
        const time = `${String(hour).padStart(2, "0")}:00`;
        const start = toUtcDateFromAppDateTime(dateOnly, time);
        const startIso = toUtcIsoFromAppDateTime(dateOnly, time);

        const end = new Date(start);
        end.setMinutes(end.getMinutes() + SESSION_MINUTES);

        slots.push({ start: startIso, end: end.toISOString() });
      }
    }

    cursor = addDays(cursor, 1);
  }

  return slots;
};

const overlaps = (slot: Slot, blocked: Slot) => {
  const slotStart = new Date(slot.start).getTime();
  const slotEnd = new Date(slot.end).getTime();
  const blockedStart = new Date(blocked.start).getTime();
  const blockedEnd = new Date(blocked.end).getTime();

  return slotStart < blockedEnd && slotEnd > blockedStart;
};

export const mapBookingsToBlockedSlots = (bookings: Booking[]): Slot[] =>
  bookings.map((booking) => {
    const time = String(booking.time).slice(0, 5);
    const start = toUtcDateFromAppDateTime(booking.date, time);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + SESSION_MINUTES);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  });

export const mapBusyRangesToBlockedSlots = (
  busyRanges: Array<{ start: string; end: string }>,
): Slot[] => busyRanges.map((busy) => ({ start: busy.start, end: busy.end }));

export const filterAvailableSlots = (slots: Slot[], blockedSlots: Slot[]): Slot[] =>
  slots.filter((slot) => !blockedSlots.some((blocked) => overlaps(slot, blocked)));
