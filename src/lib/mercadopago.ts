import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { getServerEnv, getPublicEnv } from "@/lib/env";

function getMercadoPagoClient() {
  const env = getServerEnv();
  return new MercadoPagoConfig({ accessToken: env.mercadoPagoAccessToken });
}

export interface CreatePreferenceInput {
  bookingId: string;
  name: string;
  email: string;
  date: string;
  time: string;
}

export async function createPaymentPreference(
  input: CreatePreferenceInput,
): Promise<{ id: string; initPoint: string }> {
  const publicEnv = getPublicEnv();
  const client = getMercadoPagoClient();
  const preference = new Preference(client);

  const price = Number(publicEnv.sessionPrice);
  const baseUrl = publicEnv.baseUrl;

  const response = await preference.create({
    body: {
      items: [
        {
          id: input.bookingId,
          title: `Turno ${input.date} ${input.time}`,
          description: `Sesión para ${input.name}`,
          quantity: 1,
          unit_price: price,
          currency_id: "ARS",
        },
      ],
      payer: {
        name: input.name,
        email: input.email,
      },
      back_urls: {
        success: `${baseUrl}/booking/success?id=${input.bookingId}`,
        failure: `${baseUrl}/booking/failure?id=${input.bookingId}`,
        pending: `${baseUrl}/booking/pending?id=${input.bookingId}`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      external_reference: input.bookingId,
    },
  });

  if (!response.id || !response.init_point) {
    throw new Error("MercadoPago preference creation failed");
  }

  return { id: response.id, initPoint: response.init_point };
}

export async function getPaymentInfo(paymentId: string) {
  const client = getMercadoPagoClient();
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}
