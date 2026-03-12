import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPaymentInfo } from "@/lib/mercadopago";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmationWhatsApp } from "@/lib/whatsapp";
import { getServerEnv } from "@/lib/env";

interface MercadoPagoWebhookBody {
  action?: string;
  type?: string;
  data?: { id?: string };
}

function verifySignature(request: NextRequest, rawBody: string): boolean {
  const env = getServerEnv();
  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");

  if (!signatureHeader || !requestId || !env.mercadoPagoWebhookSecret) {
    return false;
  }

  const parts = signatureHeader.split(",");
  const tsEntry = parts.find((p) => p.startsWith("ts="));
  const v1Entry = parts.find((p) => p.startsWith("v1="));

  if (!tsEntry || !v1Entry) return false;

  const ts = tsEntry.split("=")[1];
  const v1 = v1Entry.split("=")[1];

  const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", env.mercadoPagoWebhookSecret)
    .update(manifest + rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Verify signature when secret is configured
  try {
    const env = getServerEnv();
    if (env.mercadoPagoWebhookSecret) {
      if (!verifySignature(request, rawBody)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }
  } catch {
    // If env vars missing in dev, skip signature check
  }

  let body: MercadoPagoWebhookBody;
  try {
    body = JSON.parse(rawBody) as MercadoPagoWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // MercadoPago sends payment notifications
  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const paymentId = body.data.id;

  try {
    const payment = await getPaymentInfo(paymentId);

    if (!payment.external_reference) {
      return NextResponse.json({ ok: true });
    }

    const bookingId = payment.external_reference;
    const status = payment.status;

    if (status === "approved") {
      // Fetch booking details
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (fetchError || !booking) {
        console.error("[webhook] booking not found:", bookingId);
        return NextResponse.json({ ok: true });
      }

      // Update booking status and payment ID
      const { error: updateError } = await supabaseAdmin
        .from("bookings")
        .update({
          payment_status: "paid",
          mercadopago_payment_id: String(paymentId),
        })
        .eq("id", bookingId);

      if (updateError) {
        throw updateError;
      }

      // Create Google Calendar event
      let googleEventId: string | null = null;
      try {
        googleEventId = await createCalendarEvent({
          summary: `Turno – ${booking.name as string}`,
          description: `Email: ${booking.email as string}\nTeléfono: ${booking.phone as string}`,
          date: booking.date as string,
          time: booking.time as string,
          attendeeEmail: booking.email as string,
        });

        await supabaseAdmin
          .from("bookings")
          .update({ google_event_id: googleEventId })
          .eq("id", bookingId);
      } catch (calErr) {
        console.error("[webhook] Google Calendar error:", calErr);
      }

      // Send WhatsApp confirmation
      if (!booking.whatsapp_sent) {
        try {
          await sendBookingConfirmationWhatsApp({
            phone: booking.phone as string,
            name: booking.name as string,
            date: booking.date as string,
            time: booking.time as string,
          });

          await supabaseAdmin
            .from("bookings")
            .update({ whatsapp_sent: true })
            .eq("id", bookingId);
        } catch (waErr) {
          console.error("[webhook] WhatsApp error:", waErr);
        }
      }
    } else if (status === "rejected" || status === "cancelled") {
      await supabaseAdmin
        .from("bookings")
        .update({ payment_status: "failed" })
        .eq("id", bookingId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
