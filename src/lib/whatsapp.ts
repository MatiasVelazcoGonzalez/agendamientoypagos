import { getServerEnv } from "@/lib/env";

interface WhatsAppTextMessage {
  to: string;
  text: string;
}

async function sendWhatsAppMessage({ to, text }: WhatsAppTextMessage): Promise<void> {
  const env = getServerEnv();

  const normalizedPhone = to.replace(/\D/g, "");

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${env.whatsappPhoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.whatsappToken}`,
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
  const text =
    `¡Hola ${params.name}! Tu turno fue confirmado para el ${params.date} a las ${params.time} hs. ` +
    `Te esperamos. Si necesitás cancelar o reprogramar, respondé este mensaje.`;

  await sendWhatsAppMessage({ to: params.phone, text });
}

export async function sendBookingReminderWhatsApp(params: {
  phone: string;
  name: string;
  date: string;
  time: string;
}): Promise<void> {
  const text =
    `¡Hola ${params.name}! Te recordamos que mañana tenés turno a las ${params.time} hs. ` +
    `Si necesitás cancelar, respondé este mensaje.`;

  await sendWhatsAppMessage({ to: params.phone, text });
}
