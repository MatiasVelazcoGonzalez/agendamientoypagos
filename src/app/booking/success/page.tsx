import Link from "next/link";

export default function BookingSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          ¡Turno confirmado!
        </h1>
        <p className="mb-6 text-slate-500">
          Tu pago fue aprobado. Recibirás una confirmación por WhatsApp y el
          evento fue agregado a tu calendario.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-sky-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
