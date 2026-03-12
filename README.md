# Agendamiento y Pagos

Base de **Next.js 14 + App Router + Tailwind CSS** para construir un sistema de reservas y pagos automáticos (Google Calendar + MercadoPago + WhatsApp + Supabase).

## Qué debemos hacer para que funcione

1. Instalar dependencias en una máquina con acceso a npm registry.
2. Crear variables de entorno locales desde `.env.local.example`.
3. Ejecutar el SQL en Supabase para crear `bookings`, índices y funciones de concurrencia/expiración.
4. Levantar la app y verificar endpoint de salud.

## Estado actual

- ✅ **Paso 1**: scaffolding de Next.js + Tailwind.
- ✅ **Paso 2**: variables de entorno de referencia, cliente Supabase y esquema SQL base con control de concurrencia por slot.
- ✅ Fix aplicado: separación segura de variables públicas vs. servidor para evitar fallos por secretos faltantes en módulos compartidos.

## Estructura clave

- `src/app/`: UI y API Routes.
- `src/lib/env.ts`: validación de variables de entorno obligatorias (con funciones separadas para entorno público/servidor).
- `src/lib/supabase/`: clientes Supabase (público y service role).
- `supabase/schema.sql`: tabla `bookings`, índices y funciones SQL de expiración/bloqueo.
- `.env.local.example`: plantilla de variables requeridas.

## Variables de entorno

1. Copia el ejemplo:

```bash
cp .env.local.example .env.local
```

2. Completa los valores.

## Supabase

Ejecuta `supabase/schema.sql` en el SQL Editor de tu proyecto Supabase.

## Scripts

- `npm run dev`: servidor de desarrollo.
- `npm run build`: build de producción.
- `npm run start`: levantar build.
- `npm run lint`: lint de Next.
- `npm run typecheck`: chequeo de tipos TypeScript.

## Verificación mínima

```bash
npm install
npm run dev
```

Luego abrir:

- `http://localhost:3000`
- `http://localhost:3000/api/health`

## Nota del entorno automatizado

En este entorno de ejecución de agente, `npm install` responde `403 Forbidden` hacia npm registry. Eso impide correr `next dev/build/lint/typecheck` aquí, pero no afecta la validez del código para una máquina/CI con acceso normal a npm.
