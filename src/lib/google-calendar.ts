'use server';

import { google, calendar_v3 } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

/**
 * Create an OAuth2 client
 */
function getOAuth2Client() {
    return new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );
}

/**
 * Get the Google OAuth URL for user authentication
 */
export async function getGoogleAuthUrl(state?: string): Promise<string> {
    const oauth2Client = getOAuth2Client();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
        ],
        state: state || '',
    });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

/**
 * Get an authenticated calendar client for a user.
 * Handles token refresh automatically via the OAuth2 client.
 */
/**
 * Get an authenticated calendar client for a user.
 */
async function getCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminSupabase = createAdminClient();

    const { data: user } = await adminSupabase
        .from('users')
        .select('google_access_token, google_refresh_token, google_token_expiry')
        .eq('id', userId)
        .single();

    if (!user?.google_access_token && !user?.google_refresh_token) {
        console.warn('No Google tokens found for user (ADMIN check):', userId);
        return null;
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
        access_token: user.google_access_token,
        refresh_token: user.google_refresh_token,
        expiry_date: user.google_token_expiry ? new Date(user.google_token_expiry).getTime() : undefined,
    });

    // Auto-refresh tokens and persist to DB using Admin client to bypass RLS
    oauth2Client.on('tokens', async (tokens) => {
        const updateData: Record<string, string | null> = {};
        if (tokens.access_token) updateData.google_access_token = tokens.access_token;
        if (tokens.refresh_token) updateData.google_refresh_token = tokens.refresh_token;
        if (tokens.expiry_date) updateData.google_token_expiry = new Date(tokens.expiry_date).toISOString();

        if (Object.keys(updateData).length > 0) {
            await adminSupabase
                .from('users')
                .update(updateData)
                .eq('id', userId);
        }
    });

    // Force token refresh if expired or about to expire (within 5 minutes)
    const now = Date.now();
    const expiryDate = user.google_token_expiry ? new Date(user.google_token_expiry).getTime() : 0;
    if (expiryDate > 0 && expiryDate - now < 5 * 60 * 1000) {
        try {
            console.log('Token nearing expiry, refreshing...');
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);
        } catch (refreshError) {
            console.error('Failed to refresh Google token:', refreshError);
            if (!user.google_access_token) return null;
        }
    }

    return google.calendar({ version: 'v3', auth: oauth2Client });
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a Google Calendar event with Meet conferencing.
 * Includes retry logic to ensure the Meet link is properly generated.
 */
export async function createMeetEvent(params: {
    userId: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    timezone: string;
    attendees?: { email: string }[];
}): Promise<{
    meetLink: string | null;
    calendarEventId: string | null;
    isRealMeet: boolean;
}> {
    const calendar = await getCalendarClient(params.userId);

    if (!calendar || !GOOGLE_CLIENT_ID) {
        console.warn('Google Calendar client not initialized or missing credentials');
        return {
            meetLink: null,
            calendarEventId: null,
            isRealMeet: false,
        };
    }

    try {
        console.log('Creating Google Calendar event for user:', params.userId);

        const requestId = `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const event = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            sendUpdates: 'all',
            requestBody: {
                summary: params.title,
                description: params.description || '',
                start: {
                    dateTime: params.startTime,
                    timeZone: params.timezone,
                },
                end: {
                    dateTime: params.endTime,
                    timeZone: params.timezone,
                },
                attendees: params.attendees || [],
                conferenceData: {
                    createRequest: {
                        requestId: requestId,
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 5 },
                        { method: 'popup', minutes: 5 },
                    ],
                },
            },
        });

        const eventId = event.data.id;
        if (!eventId) {
            console.error('No event ID returned from Google Calendar');
            return { meetLink: null, calendarEventId: null, isRealMeet: false };
        }

        // Extract Meet link from initial response
        let meetLink =
            event.data.hangoutLink ||
            event.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
            null;

        // If no Meet link yet, the conference might be pending. Retry up to 3 times.
        if (!meetLink) {
            for (let attempt = 1; attempt <= 3; attempt++) {
                await sleep(1500 * attempt); // 1.5s, 3s, 4.5s

                try {
                    const updatedEvent = await calendar.events.get({
                        calendarId: 'primary',
                        eventId: eventId,
                    });

                    meetLink =
                        updatedEvent.data.hangoutLink ||
                        updatedEvent.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri ||
                        null;

                    if (meetLink) {
                        console.log(`Meet link retrieved on retry attempt ${attempt}:`, meetLink);
                        break;
                    }
                } catch (retryError) {
                    console.warn(`Retry ${attempt} failed:`, retryError);
                }
            }
        }

        if (!meetLink) {
            console.warn('No Google Meet link generated after retries. conferenceData:', JSON.stringify(event.data.conferenceData, null, 2));
        }

        return {
            meetLink,
            calendarEventId: eventId,
            isRealMeet: !!meetLink,
        };
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        return {
            meetLink: null,
            calendarEventId: null,
            isRealMeet: false,
        };
    }
}

/**
 * Update a Google Calendar event
 */
export async function updateMeetEvent(params: {
    userId: string;
    calendarEventId: string;
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    timezone?: string;
    attendees?: { email: string }[];
}): Promise<boolean> {
    const calendar = await getCalendarClient(params.userId);
    if (!calendar) return false;

    try {
        const requestBody: calendar_v3.Schema$Event = {};
        if (params.title) requestBody.summary = params.title;
        if (params.description) requestBody.description = params.description;
        if (params.startTime) {
            requestBody.start = {
                dateTime: params.startTime,
                timeZone: params.timezone || 'Asia/Kolkata',
            };
        }
        if (params.endTime) {
            requestBody.end = {
                dateTime: params.endTime,
                timeZone: params.timezone || 'Asia/Kolkata',
            };
        }
        if (params.attendees) {
            requestBody.attendees = params.attendees;
        }

        await calendar.events.patch({
            calendarId: 'primary',
            eventId: params.calendarEventId,
            sendUpdates: 'all',
            requestBody,
        });

        return true;
    } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        return false;
    }
}

/**
 * Delete/cancel a Google Calendar event
 */
export async function deleteMeetEvent(params: {
    userId: string;
    calendarEventId: string;
}): Promise<boolean> {
    const calendar = await getCalendarClient(params.userId);
    if (!calendar) return false;

    try {
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: params.calendarEventId,
            sendUpdates: 'all',
        });
        return true;
    } catch (error) {
        console.error('Error deleting Google Calendar event:', error);
        return false;
    }
}
/**
 * Build a proper ISO 8601 datetime string from date, time, and timezone.
 * offsetHint: if provided, helps detect if this time is actually the next day (midnight crossover).
 */
export async function buildISODateTime(date: string, time: string, timezone: string, startTimeHint?: string): Promise<string> {
    let finalDate = date;

    // Handle midnight crossover if hint provided
    if (startTimeHint && time < startTimeHint) {
        try {
            const d = new Date(date);
            d.setDate(d.getDate() + 1);
            finalDate = d.toISOString().split('T')[0];
        } catch (e) {
            console.error('Failed to increment date for midnight crossover:', e);
        }
    }

    const dateTimeStr = `${finalDate}T${time}:00`;

    try {
        const dateObj = new Date(dateTimeStr + 'Z');

        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'longOffset',
        });

        const parts = formatter.formatToParts(dateObj);
        const offsetPart = parts.find(p => p.type === 'timeZoneName');

        if (offsetPart?.value) {
            const match = offsetPart.value.match(/GMT([+-]\d{2}:\d{2})/);
            if (match) return `${finalDate}T${time}:00${match[1]}`;

            const cleanMatch = offsetPart.value.match(/([+-]\d{2}:?\d{2})/);
            if (cleanMatch) {
                let offset = cleanMatch[1];
                if (!offset.includes(':')) {
                    offset = `${offset.substring(0, 3)}:${offset.substring(3)}`;
                }
                return `${finalDate}T${time}:00${offset}`;
            }
        }
    } catch (error) {
        console.error('Error building ISO datetime via Intl:', error);
    }

    // Manual offset mapping for common timezones as bulletproof fallback
    const offsetMap: Record<string, string> = {
        'Asia/Kolkata': '+05:30',
        'Asia/Calcutta': '+05:30',
        'UTC': '+00:00',
        'GMT': '+00:00',
        'Europe/London': '+00:00',
        'America/New_York': '-05:00',
        'America/Los_Angeles': '-08:00',
    };

    const offset = offsetMap[timezone] || '+05:30'; // Default to India if fallback fails
    return `${finalDate}T${time}:00${offset}`;
}
