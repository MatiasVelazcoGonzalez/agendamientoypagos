import { google } from "googleapis";
import { APP_TIMEZONE, toUtcIsoFromAppDateTime } from "@/lib/timezone";

interface GoogleCalendarEnv {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
}

function getGoogleEnvOptional(): GoogleCalendarEnv | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!clientId || !clientSecret || !refreshToken || !calendarId) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    refreshToken,
    calendarId,
  };
}

function getGoogleEnvRequired(): GoogleCalendarEnv {
  const env = getGoogleEnvOptional();
  if (!env) {
    throw new Error("Missing Google Calendar environment variables");
  }
  return env;
}

function getOAuth2Client() {
  const env = getGoogleEnvRequired();
  const oauth2Client = new google.auth.OAuth2(
    env.clientId,
    env.clientSecret,
  );
  oauth2Client.setCredentials({ refresh_token: env.refreshToken });
  return oauth2Client;
}

export interface CalendarEventInput {
  summary: string;
  description: string;
  date: string;
  time: string;
  durationMinutes?: number;
  attendeeEmail: string;
}

export async function createCalendarEvent(
  input: CalendarEventInput,
): Promise<string> {
  const env = getGoogleEnvRequired();
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  const durationMinutes = input.durationMinutes ?? 60;
  // Normalize time: Postgres returns "HH:MM:SS", we only need "HH:MM"
  const normalizedTime = input.time.slice(0, 5);
  const startDateTime = new Date(toUtcIsoFromAppDateTime(input.date, normalizedTime));
  const endDateTime = new Date(
    startDateTime.getTime() + durationMinutes * 60 * 1000,
  );

  const response = await calendar.events.insert({
    calendarId: env.calendarId,
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: startDateTime.toISOString(), timeZone: APP_TIMEZONE },
      end: { dateTime: endDateTime.toISOString(), timeZone: APP_TIMEZONE },
      attendees: [{ email: input.attendeeEmail }],
    },
  });

  if (!response.data.id) {
    throw new Error("Google Calendar event creation failed: no event ID returned");
  }

  return response.data.id;
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const env = getGoogleEnvRequired();
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: env.calendarId,
    eventId,
  });
}

export async function listCalendarBusyRanges(params: {
  startDate: string;
  endDate: string;
}): Promise<Array<{ start: string; end: string }>> {
  const env = getGoogleEnvOptional();
  if (!env) {
    return [];
  }

  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: new Date(params.startDate).toISOString(),
      timeMax: new Date(params.endDate).toISOString(),
      timeZone: APP_TIMEZONE,
      items: [{ id: env.calendarId }],
    },
  });

  const busy = response.data.calendars?.[env.calendarId]?.busy ?? [];

  return busy
    .filter((item) => item.start && item.end)
    .map((item) => ({
      start: item.start as string,
      end: item.end as string,
    }));
}
