# Agendamiento y Pagos

Sistema completo de **reservas online con pagos automáticos** construido con:

- **Next.js 14** (App Router)
- **Tailwind CSS** para la UI
- **Supabase** como base de datos (PostgreSQL)
- **MercadoPago** para el procesamiento de pagos
- **Google Calendar** para crear eventos automáticamente
- **WhatsApp Business API** para notificaciones

## Funcionalidades

- 📅 Formulario de reserva de turno (fecha, horario, datos personales)
- 💳 Redirección automática a MercadoPago para el pago
- ✅ Confirmación automática vía webhook: crea evento en Google Calendar y envía mensaje de WhatsApp
- 🔒 Control de concurrencia por slot con advisory locks (sin doble reserva)
- ⏱️ Expiración automática de turnos pendientes a los 15 minutos

## Estructura del proyecto

```
src/
  app/
    page.tsx                          # Formulario de reserva
    layout.tsx                        # Layout principal
    globals.css                       # Estilos globales
    api/
      health/route.ts                 # Health check
      bookings/route.ts               # Crear / consultar turno
      webhooks/mercadopago/route.ts   # Webhook de pago
    booking/
      success/page.tsx                # Pago aprobado
      failure/page.tsx                # Pago rechazado
      pending/page.tsx                # Pago pendiente
  lib/
    env.ts                            # Validación de variables de entorno
    google-calendar.ts                # Integración Google Calendar
    mercadopago.ts                    # Integración MercadoPago
    whatsapp.ts                       # Integración WhatsApp Business
    supabase/
      client.ts                       # Cliente público Supabase
      admin.ts                        # Cliente service role Supabase
  types/
    booking.ts                        # Tipos TypeScript
supabase/
  schema.sql                          # Esquema SQL + funciones PL/pgSQL
```

## Configuración

### 1. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completa los valores:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key de Supabase |
| `MERCADOPAGO_ACCESS_TOKEN` | Access token de MercadoPago |
| `MERCADOPAGO_WEBHOOK_SECRET` | Webhook secret de MercadoPago |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Public key de MercadoPago |
| `GOOGLE_CLIENT_ID` | OAuth Client ID de Google |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret de Google |
| `GOOGLE_REFRESH_TOKEN` | Refresh token de Google |
| `GOOGLE_CALENDAR_ID` | ID del calendario Google |
| `WHATSAPP_TOKEN` | Token de WhatsApp Business API |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de teléfono |
| `WHATSAPP_VERIFY_TOKEN` | Token de verificación del webhook |
| `NEXT_PUBLIC_BASE_URL` | URL pública de la app (ej: `https://tudominio.com`) |
| `NEXT_PUBLIC_PRECIO_SESION` | Precio de la sesión en ARS |

### 2. Base de datos Supabase

Ejecuta el archivo `supabase/schema.sql` en el SQL Editor de tu proyecto Supabase. Esto crea:

- Tabla `bookings` con todos los campos necesarios
- Índices para consultas eficientes
- Índice único parcial que evita doble reserva del mismo slot
- Función `expire_pending_bookings()` para expirar turnos
- Función `create_pending_booking()` con advisory lock para control de concurrencia

### 3. Instalar dependencias y ejecutar

```bash
npm install
npm run dev
```

Verificar:

- `http://localhost:3000` — formulario de reserva
- `http://localhost:3000/api/health` — health check

## Scripts

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción
npm run start     # Iniciar build
npm run lint      # ESLint
npm run typecheck # TypeScript check
```

## Flujo de reserva

1. El usuario completa el formulario con sus datos y elige fecha/horario
2. La API `/api/bookings` crea un turno `pending` en Supabase (con control de concurrencia)
3. Se crea una preferencia de pago en MercadoPago y se redirige al usuario
4. Al completar el pago, MercadoPago llama al webhook `/api/webhooks/mercadopago`
5. El webhook:
   - Actualiza el estado del turno a `paid`
   - Crea el evento en Google Calendar
   - Envía confirmación por WhatsApp al cliente

## Deploy

El proyecto incluye `vercel.json` para deploy directo en Vercel. También funciona en cualquier plataforma que soporte Node.js.
