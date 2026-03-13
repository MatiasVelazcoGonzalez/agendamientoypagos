import Link from "next/link";

export default function CheckoutSimuladoPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold">Redirección de pago</h1>
      <p className="mt-3 text-slate-600">
        Esta es una URL temporal de checkout para la etapa de integración. En el siguiente paso se conectará MercadoPago.
      </p>
      <Link href="/reservar" className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-white">
        Volver a reservar
      </Link>
    </main>
  );
}
