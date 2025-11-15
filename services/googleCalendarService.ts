
export interface CalendarEvent {
    summary: string;
    description: string;
    start: {
        dateTime: string;
    };
    end: {
        dateTime: string;
    };
}

// Simulate fetching data from Google Calendar API
export const getUpcomingEvents = async (): Promise<CalendarEvent[]> => {
    console.log("Simulating fetch from Google Calendar API...");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 750));

    const now = new Date();
    const futureDate = (days: number, hours: number = 9) => {
        const date = new Date(now);
        date.setDate(date.getDate() + days);
        date.setHours(hours, 0, 0, 0);
        return date.toISOString();
    }

    return [
        {
            summary: "Microprocessors Exam",
            description: "Final exam. Syllabus: 8085 architecture, memory interfacing, I/O ports, interrupts.",
            start: { dateTime: futureDate(2) }, // Exam in 2 days for testing urgency
            end: { dateTime: futureDate(2, 12) },
        },
        {
            summary: "AI/ML Final Exam",
            description: "Syllabus includes: Convolutional Neural Networks (CNNs), Recurrent Neural Networks (RNNs), and Transformer models.",
            start: { dateTime: futureDate(12) },
            end: { dateTime: futureDate(12, 12) },
        },
        {
            summary: "Study Block: Microprocessor Interrupts",
            description: "Focus on understanding the 8085 interrupt structure.",
            start: { dateTime: futureDate(1, 10) },
            end: { dateTime: futureDate(1, 12) },
        },
        {
            summary: "Project Work: IoT Weather Station",
            description: "Work on the sensor integration part using MQTT.",
            start: { dateTime: futureDate(5, 14) },
            end: { dateTime: futureDate(5, 17) },
        }
    ];
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
        return `- Title: "${event.summary}"\n  Date: ${eventDate}\n  Days Until: ${daysUntil}\n  Details: ${event.description}`;
    }).join('\n');

    return `CRITICAL INTEL FROM GOOGLE CALENDAR (Highest Priority):\n${formattedEvents}`;
};
