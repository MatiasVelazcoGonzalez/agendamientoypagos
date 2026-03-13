import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getPaymentInfo } from "@/lib/mercadopago";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendBookingConfirmationWhatsApp } from "@/lib/whatsapp";

interface MercadoPagoWebhookBody {
  action?: string;
  type?: string;
  data?: { id?: string };
}

interface BookingRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  payment_status: string;
  google_event_id: string | null;
  mercadopago_payment_id: string | null;
  whatsapp_sent: boolean;
}

function verifySignature(
  request: NextRequest,
  rawBody: string,
  secret: string,
): boolean {
  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");

  if (!signatureHeader || !requestId) {
    return false;
  }

  const parts = signatureHeader.split(",");
  const tsEntry = parts.find((p) => p.startsWith("ts="));
  const v1Entry = parts.find((p) => p.startsWith("v1="));

  if (!tsEntry || !v1Entry) return false;

  const ts = tsEntry.split("=")[1];
  const v1 = v1Entry.split("=")[1];

  if (!ts || !v1) {
    return false;
  }

  const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(manifest + rawBody)
    .digest("hex");

  const receivedBuffer = Buffer.from(v1, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

async function getBookingById(bookingId: string): Promise<BookingRow | null> {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      "id, name, email, phone, date, time, payment_status, google_event_id, mercadopago_payment_id, whatsapp_sent",
    )
    .eq("id", bookingId)
    .single<BookingRow>();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (webhookSecret && !verifySignature(request, rawBody, webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: MercadoPagoWebhookBody;
  try {
    body = JSON.parse(rawBody) as MercadoPagoWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const paymentId = String(body.data.id);

  try {
    const payment = await getPaymentInfo(paymentId);

    if (!payment.external_reference) {
      return NextResponse.json({ ok: true });
    }

    const bookingId = payment.external_reference;
    const status = payment.status;

    if (status === "approved") {
      const booking = await getBookingById(bookingId);
      if (!booking) {
        console.error("[webhook] booking not found:", bookingId);
        return NextResponse.json({ ok: true });
      }

      const { data: duplicatedPaymentRows, error: duplicatedPaymentError } =
        await supabaseAdmin
          .from("bookings")
          .select("id")
          .eq("mercadopago_payment_id", paymentId)
          .neq("id", bookingId)
          .limit(1);

      if (duplicatedPaymentError) {
        throw duplicatedPaymentError;
      }

      if ((duplicatedPaymentRows ?? []).length > 0) {
        console.error("[webhook] duplicated payment id across bookings", {
          bookingId,
          paymentId,
        });
        return NextResponse.json({ ok: true });
      }

      if (
        booking.payment_status === "paid" &&
        booking.google_event_id &&
        booking.mercadopago_payment_id === paymentId
      ) {
        return NextResponse.json({ ok: true, duplicate: true });
      }

      if (booking.payment_status !== "paid") {
        const { error: updateError } = await supabaseAdmin
          .from("bookings")
          .update({
            payment_status: "paid",
            mercadopago_payment_id: paymentId,
          })
          .eq("id", bookingId);

        if (updateError) {
          throw updateError;
        }
      }

      if (!booking.google_event_id) {
        try {
          const googleEventId = await createCalendarEvent({
            summary: `Turno – ${booking.name}`,
            description: `Email: ${booking.email}\nTeléfono: ${booking.phone}`,
            date: booking.date,
            time: booking.time,
            attendeeEmail: booking.email,
          });

          const { error: googleUpdateError } = await supabaseAdmin
            .from("bookings")
            .update({ google_event_id: googleEventId })
            .eq("id", bookingId)
            .is("google_event_id", null);

          if (googleUpdateError) {
            console.error("[webhook] Failed to persist google_event_id:", googleUpdateError);
          } else {
            console.log("[webhook] Google Calendar event created:", googleEventId);
          }
        } catch (calErr) {
          // Payment is already confirmed. Calendar failure should not block the webhook.
          // MP must not retry for a calendar problem — return 200 and log for manual review.
          console.error(
            "[webhook] Google Calendar error – payment confirmed but event not created:",
            calErr,
          );
        }
      }

      if (!booking.whatsapp_sent) {
        try {
          await sendBookingConfirmationWhatsApp({
            phone: booking.phone,
            name: booking.name,
            date: booking.date,
            time: booking.time,
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