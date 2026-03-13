import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";
import {
  createBookingWithPayment,
  SlotUnavailableError,
} from "@/lib/booking/create-booking";
import type { CreateBookingInput } from "@/types/booking";

const createBookingSchema = z.object({
  name: z.string().min(3).max(120),
  email: z.string().email().max(160),
  phone: z.string().min(8).max(30),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
});

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = (await request.json()) as CreateBookingInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createBookingSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid booking payload",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const result = await createBookingWithPayment(parsed.data);

    return NextResponse.json(
      {
        bookingId: result.bookingId,
        paymentUrl: result.paymentUrl,
        preferenceId: result.preferenceId,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof SlotUnavailableError) {
      return NextResponse.json(
        { error: "El horario seleccionado ya no está disponible." },
        { status: 409 },
      );
    }

    console.error("[POST /api/bookings] error:", err);
    return NextResponse.json(
      { error: "Error al crear el turno. Intente nuevamente." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing booking id" },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("id, name, date, time, payment_status")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
