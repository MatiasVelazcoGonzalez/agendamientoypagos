import Link from "next/link";

export default function BookingFailurePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Pago rechazado
        </h1>
        <p className="mb-6 text-slate-500">
          No pudimos procesar tu pago. Por favor intentá nuevamente con otro
          método de pago.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-sky-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          Reintentar
        </Link>
      </div>
    </main>
  );
}
