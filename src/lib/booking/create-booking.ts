import { createPaymentPreference } from "@/lib/mercadopago";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface CreateBookingWithPaymentInput {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
}

export interface CreateBookingWithPaymentResult {
  bookingId: string;
  paymentUrl: string;
  preferenceId: string;
}

export class SlotUnavailableError extends Error {
  constructor() {
    super("SLOT_UNAVAILABLE");
  }
}

export async function createBookingWithPayment(
  input: CreateBookingWithPaymentInput,
): Promise<CreateBookingWithPaymentResult> {
  const { data: booking, error: bookingError } = await supabaseAdmin.rpc(
    "create_pending_booking",
    {
      p_name: input.name,
      p_email: input.email,
      p_phone: input.phone,
      p_date: input.date,
      p_time: input.time,
      p_mercadopago_preference_id: null,
    },
  );

  if (bookingError) {
    if (bookingError.message.includes("SLOT_ALREADY_TAKEN")) {
      throw new SlotUnavailableError();
    }
    throw bookingError;
  }

  const bookingId = booking.id as string;

  try {
    const preference = await createPaymentPreference({
      bookingId,
      name: input.name,
      email: input.email,
      date: input.date,
      time: input.time,
    });

    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({ mercadopago_preference_id: preference.id })
      .eq("id", bookingId);

    if (updateError) {
      throw updateError;
    }

    return {
      bookingId,
      paymentUrl: preference.initPoint,
      preferenceId: preference.id,
    };
  } catch (error) {
    await supabaseAdmin
      .from("bookings")
      .update({ payment_status: "failed" })
      .eq("id", bookingId)
      .eq("payment_status", "pending");

    throw error;
  }
}
