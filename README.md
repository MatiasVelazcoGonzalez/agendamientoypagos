# Agendamiento y Pagos

Sistema completo de reservas online con pagos automáticos construido con:

- Next.js (App Router)
- Tailwind CSS
- Supabase (PostgreSQL)
- MercadoPago
- Google Calendar API
- WhatsApp Business API

## Configuración

### 1) Variables de entorno

```bash
cp .env.local.example .env.local
```

Completá las variables de:

- Google Calendar
- MercadoPago
- WhatsApp Business
- Supabase
- App

### 2) Base de datos (Supabase)

Ejecutá `supabase/schema.sql` en el SQL Editor.

### 3) Instalar y ejecutar

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`

## Endpoints

- `GET /api/health`
- `GET /api/availability?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `POST /api/bookings`
- `POST /api/bookings/prepare`
- `POST /api/webhooks/mercadopago`

## Variables de entorno

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Si | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Si | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Si | Service role key (server-side) |
| `MERCADOPAGO_ACCESS_TOKEN` | Si | Access token de MercadoPago |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Si | Public key de MercadoPago |
| `MERCADOPAGO_WEBHOOK_SECRET` | Si | Secret para firmas de webhook |
| `NEXT_PUBLIC_BASE_URL` | Si | URL publica del sitio |
| `NEXT_PUBLIC_PRECIO_SESION` | Si | Precio de la sesion en moneda local |
| `GOOGLE_CLIENT_ID` | No | Client ID OAuth2 de Google |
| `GOOGLE_CLIENT_SECRET` | No | Client secret OAuth2 de Google |
| `GOOGLE_REFRESH_TOKEN` | No | Refresh token con scope Calendar |
| `GOOGLE_CALENDAR_ID` | No | ID del calendario (ej: primary) |
| `WHATSAPP_TOKEN` | No | Token permanente de Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | No | ID del numero en Meta Business |
| `WHATSAPP_VERIFY_TOKEN` | No | Token para validar webhook de Meta |
| `NEXT_PUBLIC_APP_TIMEZONE` | No | Timezone (default: America/Argentina/Buenos_Aires) |

Google Calendar y WhatsApp son opcionales. Si no se configuran el sistema los omite sin fallar.

## Flujo de reserva

1. Cliente elige horario en `/` o `/reservar`
2. `POST /api/bookings` (o `/api/bookings/prepare`) crea un booking pending en Supabase con advisory lock para prevenir duplicados, luego crea una preference de pago en MercadoPago
3. Cliente completa el pago en el checkout de MercadoPago
4. MercadoPago llama a `POST /api/webhooks/mercadopago`, que verifica la firma HMAC-SHA256, marca el booking como `paid`, agrega el evento en Google Calendar (idempotente) y envia confirmacion por WhatsApp

## Deploy en Vercel

1. Conectar el repositorio en vercel.com
2. Agregar todas las variables de entorno en el dashboard de Vercel
3. Configurar el webhook de MercadoPago apuntando a `https://tudominio.com/api/webhooks/mercadopago`
4. El archivo `vercel.json` ya incluye la configuracion necesaria
