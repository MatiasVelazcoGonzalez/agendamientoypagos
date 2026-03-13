import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  filterAvailableSlots,
  generateSlots,
  mapBookingsToBlockedSlots,
  mapBusyRangesToBlockedSlots,
} from "@/lib/booking/slots";
import { listCalendarBusyRanges } from "@/lib/google-calendar";
import { toUtcIsoFromAppDateTime, toUtcDateFromAppDateTime } from "@/lib/timezone";
import type { Booking } from "@/types/booking";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "start and end are required" }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD for start and end." },
      { status: 400 },
    );
  }

  try {
    await supabaseAdmin.rpc("expire_pending_bookings");
  } catch (expireErr) {
    console.warn("[GET /api/availability] expire_pending_bookings failed:", expireErr);
  }

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .gte("date", start)
    .lte("date", end)
    .in("payment_status", ["pending", "paid"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Use explicit UTC midnight for slot generation (avoids TZ offset bugs)
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);

  const allSlots = generateSlots(startDate, endDate);
  let googleBusyRanges: Array<{ start: string; end: string }> = [];

  try {
    // Query Google Calendar using app-timezone-aware bounds
    const gCalStart = toUtcIsoFromAppDateTime(start, "00:00");
    const gCalEndDate = toUtcDateFromAppDateTime(end, "00:00");
    gCalEndDate.setUTCDate(gCalEndDate.getUTCDate() + 1); // include full last day in app TZ
    const gCalEnd = gCalEndDate.toISOString();

    googleBusyRanges = await listCalendarBusyRanges({
      startDate: gCalStart,
      endDate: gCalEnd,
    });
  } catch (googleError) {
    console.error("[GET /api/availability] Google Calendar unavailable:", googleError);
  }

  const blockedSlots = [
    ...mapBookingsToBlockedSlots((data ?? []) as Booking[]),
    ...mapBusyRangesToBlockedSlots(googleBusyRanges),
  ];
  const availableSlots = filterAvailableSlots(allSlots, blockedSlots);

  return NextResponse.json({
    start,
    end,
    total: availableSlots.length,
    slots: availableSlots,
    googleSync: googleBusyRanges.length > 0 || !!process.env.GOOGLE_CLIENT_ID,
  });
}
