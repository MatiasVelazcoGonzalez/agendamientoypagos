const getRequiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const getPublicEnv = () => ({
  supabaseUrl: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  mercadoPagoPublicKey: getRequiredEnv("NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY"),
  baseUrl: getRequiredEnv("NEXT_PUBLIC_BASE_URL"),
  sessionPrice: getRequiredEnv("NEXT_PUBLIC_PRECIO_SESION"),
});

export const getServerEnv = () => ({
  googleClientId: getRequiredEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: getRequiredEnv("GOOGLE_CLIENT_SECRET"),
  googleRefreshToken: getRequiredEnv("GOOGLE_REFRESH_TOKEN"),
  googleCalendarId: getRequiredEnv("GOOGLE_CALENDAR_ID"),
  mercadoPagoAccessToken: getRequiredEnv("MERCADOPAGO_ACCESS_TOKEN"),
  mercadoPagoWebhookSecret: getRequiredEnv("MERCADOPAGO_WEBHOOK_SECRET"),
  whatsappToken: getRequiredEnv("WHATSAPP_TOKEN"),
  whatsappPhoneNumberId: getRequiredEnv("WHATSAPP_PHONE_NUMBER_ID"),
  whatsappVerifyToken: getRequiredEnv("WHATSAPP_VERIFY_TOKEN"),
  supabaseServiceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
});
