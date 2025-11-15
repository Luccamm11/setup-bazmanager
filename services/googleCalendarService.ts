import * as googleAuth from '../auth/googleAuth';

export interface CalendarEvent {
    summary: string;
    description?: string;
    start: {
        dateTime: string;
    };
    end: {
        dateTime: string;
    };
}

// Fetch data from the real Google Calendar API
export const getUpcomingEvents = async (): Promise<CalendarEvent[]> => {
    try {
        const gapi = await googleAuth.getGapiClient();
        if (!gapi || !gapi.client.calendar) {
            throw new Error("Google API client not loaded.");
        }

        const response = await gapi.client.calendar.events.list({
            'calendarId': 'primary',
            'timeMin': (new Date()).toISOString(),
            'showDeleted': false,
            'singleEvents': true,
            'maxResults': 10,
            'orderBy': 'startTime'
        });

        return response.result.items.map((event: any) => ({
            summary: event.summary,
            description: event.description,
            start: { dateTime: event.start.dateTime || event.start.date },
            end: { dateTime: event.end.dateTime || event.end.date },
        }));

    } catch (error) {
        console.error("Error fetching Google Calendar events:", error);
        // Handle token expiration or other errors
        if ((error as any)?.result?.error?.code === 401) {
            // Attempt to refresh token or prompt for re-login
            console.log("Token expired, trying to sign out to force re-login.");
            googleAuth.signOut();
        }
        throw new Error("Could not fetch calendar events.");
    }
};

export const formatEventsForPrompt = (events: CalendarEvent[]): string => {
    if (!events || events.length === 0) {
        return "No upcoming events found.";
    }

    const now = new Date();
    const formattedEvents = events
    .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime())
    .map(event => {
        const startDate = new Date(event.start.dateTime);
        const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        const eventDate = `${startDate.toLocaleDateString()} at ${startDate.toLocaleTimeString()}`;
        const description = event.description ? `\n  Details: ${event.description}` : '';
        return `- Title: "${event.summary}"\n  Date: ${eventDate}\n  Days Until: ${daysUntil}${description}`;
    }).join('\n');

    return `CRITICAL INTEL FROM GOOGLE CALENDAR (Highest Priority):\n${formattedEvents}`;
};