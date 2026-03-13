import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";

const bookingSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  slotStart: z.string().datetime(),
});

export async function POST(req: Request) {
  const payload = await req.json();
  const parsed = bookingSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid booking payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const slotDate = new Date(parsed.data.slotStart);
  const date = slotDate.toISOString().slice(0, 10);
  const time = slotDate.toISOString().slice(11, 19);
  const preferenceId = `pref_${crypto.randomUUID()}`;

  const { data, error } = await supabaseAdmin.rpc("create_pending_booking", {
    p_name: parsed.data.name,
    p_email: parsed.data.email,
    p_phone: parsed.data.phone,
    p_date: date,
    p_time: time,
    p_mercadopago_preference_id: preferenceId,
  });

  if (error) {
    const isSlotError = error.message.includes("SLOT_ALREADY_TAKEN");

    return NextResponse.json(
      { error: isSlotError ? "slot_unavailable" : error.message },
      { status: isSlotError ? 409 : 500 },
    );
  }

  return NextResponse.json({
    booking: data,
    checkoutUrl: `/checkout/simulado?bookingId=${data.id}&preferenceId=${preferenceId}`,
  });
}
