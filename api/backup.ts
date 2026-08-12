import type { VercelRequest, VercelResponse } from '@vercel/node';
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

async function getAllKeysToBackup(): Promise<string[]> {
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
    console.warn('Could not read member registry for backup key enumeration, using fallbacks:', err);
    for (const member of FALLBACK_MEMBERS) {
      keysSet.add(`levelup_user_${member}`);
      keysSet.add(`levelup_notifications_${member}`);
    }
  }

  return Array.from(keysSet);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Security check: Must have CRON_SECRET configured AND valid Bearer token
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized. Valid Bearer token matching CRON_SECRET is required.' });
  }

  const githubToken = process.env.GITHUB_BACKUP_TOKEN;
  const githubRepo = process.env.GITHUB_BACKUP_REPO;

  if (!githubToken || !githubRepo) {
    return res.status(500).json({
      error: 'Missing required env vars: GITHUB_BACKUP_TOKEN or GITHUB_BACKUP_REPO',
    });
  }

  try {
    const keys = await getAllKeysToBackup();
    const backupData: Record<string, any> = {};

    let totalKeysFound = 0;
    for (const key of keys) {
      const rawValue = await redis.get(key);
      if (rawValue !== null && rawValue !== undefined) {
        try {
          backupData[key] = JSON.parse(rawValue);
        } catch {
          backupData[key] = rawValue;
        }
        totalKeysFound++;
      }
    }

    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];
    const fullBackupPayload = {
      meta: {
        timestamp,
        totalKeysChecked: keys.length,
        totalKeysFound,
        system: 'BazManager Redis Backup',
      },
      keys: backupData,
    };

    const jsonString = JSON.stringify(fullBackupPayload, null, 2);
    const contentBase64 = Buffer.from(jsonString, 'utf-8').toString('base64');
    const filePath = `backups/backup-${dateStr}.json`;
    const githubApiUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;

    let sha: string | undefined;
    try {
      const checkRes = await fetch(githubApiUrl, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'BazManager-Backup-Cron',
        },
      });
      if (checkRes.ok) {
        const fileMeta: any = await checkRes.json();
        sha = fileMeta.sha;
      }
    } catch {}

    const putRes = await fetch(githubApiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'BazManager-Backup-Cron',
      },
      body: JSON.stringify({
        message: `Automated Redis Backup - ${timestamp}`,
        content: contentBase64,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const errorText = await putRes.text();
      console.error('GitHub API error:', errorText);
      return res.status(500).json({ error: 'Failed to commit backup to GitHub', details: errorText });
    }

    const responseData: any = await putRes.json();

    return res.status(200).json({
      success: true,
      message: `Backup successfully created at ${filePath}`,
      keysFound: totalKeysFound,
      commitSha: responseData.commit?.sha,
    });
  } catch (error: any) {
    console.error('Error executing backup:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
