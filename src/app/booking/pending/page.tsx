import Link from "next/link";

export default function BookingPendingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <svg
            className="h-8 w-8 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Pago pendiente
        </h1>
        <p className="mb-6 text-slate-500">
          Tu pago está siendo procesado. Una vez confirmado recibirás una
          notificación por WhatsApp y el turno quedará reservado.
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
