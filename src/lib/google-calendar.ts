import { google } from "googleapis";
import { getServerEnv } from "@/lib/env";

function getOAuth2Client() {
  const env = getServerEnv();
  const oauth2Client = new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
  );
  oauth2Client.setCredentials({ refresh_token: env.googleRefreshToken });
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
  const env = getServerEnv();
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  const durationMinutes = input.durationMinutes ?? 60;
  const startDateTime = new Date(`${input.date}T${input.time}:00`);
  const endDateTime = new Date(
    startDateTime.getTime() + durationMinutes * 60 * 1000,
  );

  const response = await calendar.events.insert({
    calendarId: env.googleCalendarId,
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() },
      attendees: [{ email: input.attendeeEmail }],
    },
  });

  if (!response.data.id) {
    throw new Error("Google Calendar event creation failed: no event ID returned");
  }

  return response.data.id;
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const env = getServerEnv();
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  await calendar.events.delete({
    calendarId: env.googleCalendarId,
    eventId,
  });
}
