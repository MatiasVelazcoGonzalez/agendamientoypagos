import BookingFlow from "@/components/booking/booking-flow";

export default function ReservarPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Agenda tu sesión</h1>
      <p className="mt-2 text-slate-600">Selecciona un horario disponible, completa tus datos y confirma el pago.</p>
      <section className="mt-8">
        <BookingFlow />
      </section>
    </main>
  );
}
