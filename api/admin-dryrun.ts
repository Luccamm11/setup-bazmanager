import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import redis from './_lib/redis.js';

const FIXED_KEYS = [
  'levelup_members_registry',
  'levelup_team_missions',
  'levelup_5w2h_plans',
  'levelup_printer_queue',
  'levelup_team_legacy',
  'levelup_mentors',
  'levelup_mentorship_records',
  'levelup_volunteer_works',
  'levelup_attendance_records',
  'levelup_finance_records',
  'levelup_kanban_tasks',
  'levelup_learning_trails_data',
  'levelup_chat_data',
];

const FALLBACK_MEMBERS = [
  'Jonas', 'Ramon', 'Lucca', 'Clarice', 'Ana Clara', 'Bernardo',
  'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende', 'Sara Galdino',
];

function sha256(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Strict Security check: Must have CRON_SECRET configured AND valid Bearer token
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized. Valid Bearer token matching CRON_SECRET is required.' });
  }

  try {
    const keysSet = new Set<string>(FIXED_KEYS);

    try {
      const rawMembers = await redis.get('levelup_members_registry');
      const membersList: { username: string }[] = rawMembers ? JSON.parse(rawMembers) : [];
      const memberUsernames = membersList.map(m => m.username);
      const allMembers = Array.from(new Set([...FALLBACK_MEMBERS, ...memberUsernames]));

      for (const member of allMembers) {
        keysSet.add(`levelup_user_${member}`);
        keysSet.add(`levelup_notifications_${member}`);
      }
    } catch (err) {
      for (const member of FALLBACK_MEMBERS) {
        keysSet.add(`levelup_user_${member}`);
        keysSet.add(`levelup_notifications_${member}`);
      }
    }

    const allKeys = Array.from(keysSet);
    const summary = [];
    let totalBytes = 0;
    let foundKeysCount = 0;

    for (const key of allKeys) {
      const rawValue = await redis.get(key);
      if (rawValue !== null && rawValue !== undefined) {
        foundKeysCount++;
        const bytes = Buffer.byteLength(rawValue, 'utf8');
        totalBytes += bytes;
        const hash = sha256(rawValue);

        let isValidJson = false;
        try {
          JSON.parse(rawValue);
          isValidJson = true;
        } catch {}

        summary.push({
          key,
          status: 'EXISTS',
          sizeBytes: bytes,
          sha256Full: hash,
          sha256Prefix: hash.substring(0, 16) + '...',
          validJson: isValidJson,
        });
      } else {
        summary.push({
          key,
          status: 'EMPTY',
          sizeBytes: 0,
          sha256Full: '-',
          sha256Prefix: '-',
          validJson: false,
        });
      }
    }

    return res.status(200).json({
      success: true,
      mode: 'DRY-RUN',
      timestamp: new Date().toISOString(),
      summary: {
        keysChecked: allKeys.length,
        activeKeysFound: foundKeysCount,
        totalPayloadSizeKB: (totalBytes / 1024).toFixed(2),
      },
      keysDetails: summary,
    });
  } catch (error: any) {
    console.error('Dry-run error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
