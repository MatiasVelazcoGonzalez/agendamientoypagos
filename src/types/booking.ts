export type PaymentStatus = "pending" | "paid" | "expired" | "failed";

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  payment_status: PaymentStatus;
  mercadopago_preference_id: string | null;
  mercadopago_payment_id: string | null;
  google_event_id: string | null;
  whatsapp_sent: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface CreateBookingInput {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
}
