import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createBookingWithPayment,
  SlotUnavailableError,
} from "@/lib/booking/create-booking";
import { formatDateInAppTimezone, formatTimeInAppTimezone } from "@/lib/timezone";

const bookingSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  slotStart: z.string().datetime(),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const slotDate = new Date(parsed.data.slotStart);
  if (Number.isNaN(slotDate.getTime())) {
    return NextResponse.json({ error: "Invalid slotStart" }, { status: 400 });
  }

  const date = formatDateInAppTimezone(slotDate);
  const time = formatTimeInAppTimezone(slotDate);

  try {
    const result = await createBookingWithPayment({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      date,
      time,
    });

    return NextResponse.json({
      bookingId: result.bookingId,
      checkoutUrl: result.paymentUrl,
      preferenceId: result.preferenceId,
    });
  } catch (error) {
    if (error instanceof SlotUnavailableError) {
      return NextResponse.json({ error: "slot_unavailable" }, { status: 409 });
    }

    console.error("[POST /api/bookings/prepare] error:", error);
    return NextResponse.json(
      { error: "No se pudo preparar la reserva." },
      { status: 500 },
    );
  }
}
