# Agendamiento y Pagos

Sistema de agendamiento con **Next.js 14 + App Router + Tailwind + Supabase**.

## Flujo implementado (actual)

- Pantalla de bienvenida con botón **Book my session**.
- Vista `/reservar` con calendario (FullCalendar) mostrando slots disponibles.
- Formulario de nombre, email y WhatsApp (+código país).
- Resumen de slot y precio.
- Acción **Confirmar y pagar** que crea una reserva `pending` (bloqueo temporal) vía RPC de Supabase.
- Redirección temporal a `/checkout/simulado` (placeholder hasta integrar MercadoPago real).

## Requisitos de entorno

```bash
cp .env.local.example .env.local
```

Completar variables de:
- Google Calendar
- MercadoPago
- WhatsApp Business
- Supabase
- App

## Base de datos (Supabase)

1. Abrir SQL Editor de Supabase.
2. Ejecutar `supabase/schema.sql`.

Incluye:
- tabla `bookings`
- índice único parcial para evitar doble reserva (`pending`/`paid`)
- `expire_pending_bookings()`
- `create_pending_booking(...)` con advisory lock por slot

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`

## Endpoints disponibles

- `GET /api/health`
- `GET /api/availability?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `POST /api/bookings/prepare`

## Qué falta para quedar 100%

- Integrar disponibilidad de Google Calendar en `api/availability`.
- Integrar checkout real de MercadoPago.
- Implementar webhook MercadoPago con validación de firma.
- Crear evento en Google Calendar al pagar.
- Enviar confirmación por WhatsApp automática.

## Nota de entorno del agente

En este entorno del agente `npm install` está bloqueado por `403` del registry. En entorno local/CI con acceso npm, el proyecto se ejecuta normalmente.
