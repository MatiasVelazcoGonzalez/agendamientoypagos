import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { filterAvailableSlots, generateSlots, mapBookingsToBlockedSlots } from "@/lib/booking/slots";
import type { Booking } from "@/types/booking";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end are required" }, { status: 400 });
  }

  await supabaseAdmin.rpc("expire_pending_bookings");

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .gte("date", start)
    .lte("date", end)
    .in("payment_status", ["pending", "paid"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T23:59:59`);

  const allSlots = generateSlots(startDate, endDate);
  const blockedSlots = mapBookingsToBlockedSlots((data ?? []) as Booking[]);
  const availableSlots = filterAvailableSlots(allSlots, blockedSlots);

  return NextResponse.json({
    start,
    end,
    total: availableSlots.length,
    slots: availableSlots,
  });
}
