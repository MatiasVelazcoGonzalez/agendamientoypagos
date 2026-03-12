import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createPaymentPreference } from "@/lib/mercadopago";
import type { CreateBookingInput } from "@/types/booking";

export async function POST(request: NextRequest) {
  let body: CreateBookingInput;

  try {
    body = (await request.json()) as CreateBookingInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, phone, date, time } = body;

  if (!name || !email || !phone || !date || !time) {
    return NextResponse.json(
      { error: "Missing required fields: name, email, phone, date, time" },
      { status: 400 },
    );
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Date format validation (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 },
    );
  }

  // Time format validation (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json(
      { error: "Invalid time format. Use HH:MM" },
      { status: 400 },
    );
  }

  try {
    // Create pending booking with concurrency control via advisory lock
    const { data: booking, error: bookingError } = await supabaseAdmin.rpc(
      "create_pending_booking",
      {
        p_name: name,
        p_email: email,
        p_phone: phone,
        p_date: date,
        p_time: time,
        p_mercadopago_preference_id: null,
      },
    );

    if (bookingError) {
      if (bookingError.message.includes("SLOT_ALREADY_TAKEN")) {
        return NextResponse.json(
          { error: "El horario seleccionado ya no está disponible." },
          { status: 409 },
        );
      }
      throw bookingError;
    }

    // Create MercadoPago preference
    const preference = await createPaymentPreference({
      bookingId: booking.id as string,
      name,
      email,
      date,
      time,
    });

    // Update booking with preference ID
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({ mercadopago_preference_id: preference.id })
      .eq("id", booking.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(
      {
        bookingId: booking.id,
        paymentUrl: preference.initPoint,
      },
      { status: 201 },
    );
  } catch (err) {
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
