import type { Booking } from "@/types/booking";

export interface Slot {
  start: string;
  end: string;
}

const WORKING_HOURS = {
  start: 9,
  end: 18,
};

const SESSION_MINUTES = 60;

const toIso = (date: Date) => date.toISOString();

export const generateSlots = (startDate: Date, endDate: Date): Slot[] => {
  const slots: Slot[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= endDate) {
    const day = cursor.getDay();
    const isWeekday = day >= 1 && day <= 5;

    if (isWeekday) {
      for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour += 1) {
        const start = new Date(cursor);
        start.setHours(hour, 0, 0, 0);

        const end = new Date(start);
        end.setMinutes(end.getMinutes() + SESSION_MINUTES);

        slots.push({ start: toIso(start), end: toIso(end) });
      }
    }

    cursor.setDate(cursor.getDate() + 1);
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
    const start = new Date(`${booking.date}T${booking.time}`);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + SESSION_MINUTES);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  });

export const filterAvailableSlots = (slots: Slot[], blockedSlots: Slot[]): Slot[] =>
  slots.filter((slot) => !blockedSlots.some((blocked) => overlaps(slot, blocked)));
