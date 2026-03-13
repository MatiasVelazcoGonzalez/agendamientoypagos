import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Bienvenido</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Agenda y Pago de Sesiones</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Reserva tu sesión en línea en menos de 2 minutos con bloqueo automático de horario y confirmación.
      </p>
      <Link
        href="/reservar"
        className="mt-8 inline-flex rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700"
      >
        Book my session
      </Link>
    </main>
  );
}
