import type { VercelRequest, VercelResponse } from '@vercel/node';
import redis from './_lib/redis.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const REDIS_KEY = 'levelup_attendance_records';

    if (req.method === 'GET') {
        try {
            const rawData = await redis.get(REDIS_KEY);
            const records = rawData ? JSON.parse(rawData) : {};
            return res.status(200).json({ success: true, records });
        } catch (error: any) {
            console.error('Error fetching attendance records:', error.message);
            return res.status(500).json({ success: false, error: 'Failed to fetch attendance.' });
        }
    }

    if (req.method === 'POST') {
        try {
            const { records } = req.body;
            if (!records) {
                return res.status(400).json({ success: false, error: 'No records provided.' });
            }

            await redis.set(REDIS_KEY, JSON.stringify(records));
            return res.status(200).json({ success: true });
        } catch (error: any) {
            console.error('Error saving attendance records:', error.message);
            return res.status(500).json({ success: false, error: 'Failed to save attendance.' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
