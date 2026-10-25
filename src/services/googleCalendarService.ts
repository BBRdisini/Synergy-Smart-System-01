import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ScheduledTask } from '../types/agronomy';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.acls',
  'https://www.googleapis.com/auth/calendar.acls.readonly',
  'https://www.googleapis.com/auth/calendar.app.created',
  'https://www.googleapis.com/auth/calendar.calendarlist',
  'https://www.googleapis.com/auth/calendar.calendarlist.readonly',
  'https://www.googleapis.com/auth/calendar.calendars',
  'https://www.googleapis.com/auth/calendar.calendars.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.events.freebusy',
  'https://www.googleapis.com/auth/calendar.events.owned',
  'https://www.googleapis.com/auth/calendar.events.owned.readonly',
  'https://www.googleapis.com/auth/calendar.events.public.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.freebusy',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.settings.readonly',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token strictly in memory (never in localStorage/sessionStorage).
let cachedAccessToken: string | null = null;

export interface GoogleCalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google Calendar dari Firebase Auth.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Calendar sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

/**
 * Fetches upcoming events from the user's primary Google Calendar.
 */
export async function listGoogleCalendarEvents(
  maxResults = 12
): Promise<GoogleCalendarEventItem[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const timeMin = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeMin', timeMin);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NO_ACCESS_TOKEN');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || `Gagal memuat Google Calendar (HTTP ${res.status})`
    );
  }

  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

/**
 * Parses a TaniCerdas ScheduledTask timeSlot (e.g., "06:00 – 08:00") and isoDate ("2025-05-02")
 * into ISO start/end timestamps in Asia/Jakarta (+07:00).
 */
function buildTaskStartEndIso(isoDate: string, timeSlot?: string): {
  startDateTime: string;
  endDateTime: string;
} {
  const cleanDate = /^\d{4}-\d{2}-\d{2}$/.test(isoDate)
    ? isoDate
    : new Date().toISOString().slice(0, 10);

  let startHour = '06:30';
  let endHour = '08:30';
  if (timeSlot) {
    const match = timeSlot.match(/(\d{2}:\d{2})\s*[–-]\s*(\d{2}:\d{2})/);
    if (match) {
      startHour = match[1];
      endHour = match[2];
    }
  }

  return {
    startDateTime: `${cleanDate}T${startHour}:00+07:00`,
    endDateTime: `${cleanDate}T${endHour}:00+07:00`,
  };
}

/**
 * Creates a single farm schedule event on the user's primary Google Calendar.
 */
export async function createGoogleCalendarEvent(params: {
  summary: string;
  description: string;
  location?: string;
  isoDate: string;
  timeSlot?: string;
}): Promise<GoogleCalendarEventItem> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const { startDateTime, endDateTime } = buildTaskStartEndIso(
    params.isoDate,
    params.timeSlot
  );

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: params.summary,
        description: params.description,
        location: params.location || 'Lahan Pertanian TaniCerdas AI',
        start: {
          dateTime: startDateTime,
          timeZone: 'Asia/Jakarta',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'Asia/Jakarta',
        },
      }),
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NO_ACCESS_TOKEN');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || `Gagal membuat jadwal di Google Calendar (HTTP ${res.status})`
    );
  }

  return await res.json();
}

/**
 * Syncs multiple TaniCerdas AI farm tasks to the user's primary Google Calendar.
 * Must be called ONLY after explicit user confirmation in the UI dialog.
 */
export async function syncFarmTasksToGoogleCalendar(
  tasks: ScheduledTask[],
  locationName?: string
): Promise<GoogleCalendarEventItem[]> {
  const createdEvents: GoogleCalendarEventItem[] = [];
  for (const task of tasks) {
    const ev = await createGoogleCalendarEvent({
      summary: `[TaniCerdas AI] ${task.title} — ${task.commodity} (${task.plotName})`,
      description: `Kategori: ${task.category}\nLahan: ${task.plotName} (${task.commodity})\nCatatan/Dosis: ${task.dosageOrNote}\nDisinkronkan dari Kalender Tanam TaniCerdas AI.`,
      location: locationName || task.plotName,
      isoDate: task.isoDate,
      timeSlot: task.timeSlot,
    });
    createdEvents.push(ev);
  }
  return createdEvents;
}

/**
 * Deletes an event from the user's primary Google Calendar.
 * Must be called ONLY after explicit user confirmation in the UI dialog.
 */
export async function deleteGoogleCalendarEvent(eventId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('NO_ACCESS_TOKEN');
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(
      eventId
    )}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (res.status === 401 || res.status === 403) {
    cachedAccessToken = null;
    throw new Error('NO_ACCESS_TOKEN');
  }

  if (!res.ok && res.status !== 204) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData?.error?.message || `Gagal menghapus jadwal Google Calendar (HTTP ${res.status})`
    );
  }
}
