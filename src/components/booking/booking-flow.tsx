"use client";

import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface AvailabilityResponse {
  slots: { start: string; end: string }[];
}

const thisMonday = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  now.setDate(now.getDate() + diff);
  now.setHours(0, 0, 0, 0);
  return now;
};

export default function BookingFlow() {
  const [slots, setSlots] = useState<AvailabilityResponse["slots"]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const initialDate = useMemo(() => thisMonday(), []);

  const loadAvailability = async (startStr: string, endStr: string) => {
    const start = startStr.slice(0, 10);
    const end = endStr.slice(0, 10);
    const res = await fetch(`/api/availability?start=${start}&end=${end}`);
    const data = (await res.json()) as AvailabilityResponse;
    setSlots(data.slots ?? []);
  };

  const handleSubmit = async () => {
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/bookings/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, slotStart: selectedSlot }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoading(false);
      setMessage(data.error === "slot_unavailable" ? "Ese horario ya fue reservado. Elige otro." : "No se pudo preparar la reserva.");
      return;
    }

    window.location.href = data.checkoutUrl;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4">
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          initialDate={initialDate}
          selectable
          selectMirror
          allDaySlot={false}
          slotMinTime="09:00:00"
          slotMaxTime="18:00:00"
          weekends={false}
          events={slots.map((slot) => ({ ...slot, title: "Disponible" }))}
          datesSet={(arg) => {
            void loadAvailability(arg.startStr, arg.endStr);
          }}
          select={(info) => {
            setSelectedSlot(info.start.toISOString());
          }}
          eventClick={(info) => {
            setSelectedSlot(info.event.start?.toISOString() ?? "");
          }}
          height="auto"
        />
      </div>

      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold">Datos del cliente</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="rounded-md border px-3 py-2" placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded-md border px-3 py-2" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="rounded-md border px-3 py-2 sm:col-span-2" placeholder="WhatsApp (+56912345678)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
          <p><strong>Slot:</strong> {selectedSlot ? new Date(selectedSlot).toLocaleString("es-CL") : "No seleccionado"}</p>
          <p><strong>Precio:</strong> {process.env.NEXT_PUBLIC_PRECIO_SESION ?? "No configurado"}</p>
        </div>

        {message ? <p className="mt-3 text-sm text-rose-600">{message}</p> : null}

        <button
          type="button"
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={!selectedSlot || !name || !email || !phone || loading}
        >
          {loading ? "Procesando..." : "Confirmar y pagar"}
        </button>
      </div>
    </div>
  );
}
