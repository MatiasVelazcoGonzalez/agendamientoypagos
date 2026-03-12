# Agendamiento y Pagos

Base de **Next.js 14 + App Router + Tailwind CSS** para construir un sistema de reservas y pagos automáticos (Google Calendar + MercadoPago + WhatsApp + Supabase).

## Estado actual

- ✅ **Paso 1**: scaffolding de Next.js + Tailwind.
- ✅ **Paso 2**: variables de entorno de referencia, cliente Supabase y esquema SQL base con control de concurrencia por slot.

## Estructura clave

- `src/app/`: UI y API Routes.
- `src/lib/env.ts`: validación de variables de entorno obligatorias.
- `src/lib/supabase/`: clientes Supabase (público y service role).
- `supabase/schema.sql`: tabla `bookings`, índices y funciones SQL de expiración/bloqueo.
- `.env.local.example`: plantilla de variables requeridas.

## Variables de entorno

1. Copia el ejemplo:

```bash
cp .env.local.example .env.local
```

2. Completa todos los valores antes de ejecutar APIs que dependan de integraciones externas.

## Supabase

Ejecuta el SQL de `supabase/schema.sql` en el SQL Editor del proyecto Supabase para crear tabla, índices y funciones.

## Scripts

- `npm run dev`: servidor de desarrollo.
- `npm run build`: build de producción.
- `npm run start`: levantar build.
- `npm run lint`: lint de Next.
- `npm run typecheck`: chequeo de tipos TypeScript.

## Debug rápido

- `GET /api/health` devuelve estado básico del backend.
- Si falta una variable de entorno obligatoria, el proyecto lanzará error explícito con el nombre de la variable faltante.

## Nota del entorno

En este entorno automatizado, `npm install` falla con HTTP 403 hacia npm registry. El código queda preparado para ejecución normal en un entorno con acceso al registro.
