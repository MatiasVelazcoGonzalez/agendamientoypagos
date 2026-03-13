import { getWhatsAppEnvOptional } from "@/lib/env";

interface WhatsAppTextMessage {
  to: string;
  text: string;
}

async function sendWhatsAppMessage({ to, text }: WhatsAppTextMessage): Promise<void> {
  const env = getWhatsAppEnvOptional();
  if (!env) {
    console.warn("[WhatsApp] Not configured – skipping notification");
    return;
  }

  const normalizedPhone = to.replace(/\D/g, "");

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${env.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "text",
        text: { body: text },
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`WhatsApp API error: ${response.status} – ${errorBody}`);
  }
}

export async function sendBookingConfirmationWhatsApp(params: {
  phone: string;
  name: string;
  date: string;
  time: string;
}): Promise<void> {
  const time = params.time.slice(0, 5); // normalize "HH:MM:SS" → "HH:MM"
  const text =
    `¡Hola ${params.name}! Tu turno fue confirmado para el ${params.date} a las ${time} hs. ` +
    `Te esperamos. Si necesitás cancelar o reprogramar, respondé este mensaje.`;

  await sendWhatsAppMessage({ to: params.phone, text });
}

export async function sendBookingReminderWhatsApp(params: {
  phone: string;
  name: string;
  date: string;
  time: string;
}): Promise<void> {
  const time = params.time.slice(0, 5); // normalize "HH:MM:SS" → "HH:MM"
  const text =
    `¡Hola ${params.name}! Te recordamos que mañana tenés turno a las ${time} hs. ` +
    `Si necesitás cancelar, respondé este mensaje.`;

  await sendWhatsAppMessage({ to: params.phone, text });
}
