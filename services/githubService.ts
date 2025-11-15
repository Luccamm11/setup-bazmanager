
export interface GithubActivity {
    repo: string;
    type: 'COMMIT' | 'PR_OPEN' | 'PR_MERGE';
    message: string;
    date: string;
    linesAdded?: number;
    linesRemoved?: number;
}

// Simulate fetching recent activity from GitHub
export const getRecentActivity = async (): Promise<GithubActivity[]> => {
    console.log("Simulating fetch from GitHub API...");
    await new Promise(resolve => setTimeout(resolve, 600));

    const now = new Date();
    const recentDate = (daysAgo: number) => {
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString();
    }

    return [
        {
            repo: "shounak-dev/iot-weather-station",
            type: 'COMMIT',
            message: "feat: Integrate MQTT for sensor data transmission",
            date: recentDate(1),
            linesAdded: 85,
            linesRemoved: 12,
        },
        {
            repo: "shounak-dev/portfolio-website",
            type: 'COMMIT',
            message: "fix: Corrected alignment issue on mobile view",
            date: recentDate(2),
            linesAdded: 5,
            linesRemoved: 5,
        },
        {
            repo: "shounak-dev/ai-awakening-rpg",
            type: 'PR_OPEN',
            message: "feat: Implement GitHub integration for quest generation",
            date: recentDate(0),
        }
    ];
};

export const formatActivityForPrompt = (activity: GithubActivity[]): string => {
    if (!activity || activity.length === 0) {
        return "";
    }

    const formattedActivity = activity
    .map(act => {
        let line = `- [${act.repo}] ${act.type}: "${act.message}"`;
        if (act.type === 'COMMIT' && act.linesAdded !== undefined && act.linesRemoved !== undefined) {
            line += ` (+${act.linesAdded} / -${act.linesRemoved})`;
        }
        return line;
    }).join('\n');

    return `\nRECENT GITHUB ACTIVITY (Consider for 'Creation' realm quests):\n${formattedActivity}\n`;
};
