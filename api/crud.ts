import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import redis from './_lib/redis.js';

const KEYS = {
  attendance: 'levelup_attendance_records',
  finance: 'levelup_finance_records',
  kanban: 'levelup_kanban_tasks',
  learning_trails: 'levelup_learning_trails_data',
  chat: 'levelup_chat_data',
};

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
  'levelup_projects',
  'levelup_prototypes',
  'levelup_b_projects',
  'levelup_forms_records',
  'levelup_goals_board',
];

const FALLBACK_MEMBERS = [
  'Jonas', 'Ramon', 'Lucca', 'Clarice', 'Ana Clara', 'Bernardo',
  'Enzo Soares', 'Pedro', 'Yan', 'Guilherme', 'Enzo Resende', 'Sara Galdino',
];

function sha256(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function canonicalJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJson).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(k => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}

function getNormalizedSupabaseConfig() {
  let rawUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    rawUrl = `https://${rawUrl}`;
  }
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

  return { supabaseUrl: rawUrl, supabaseKey };
}

async function getAllKeysToProcess(): Promise<string[]> {
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

  return Array.from(keysSet);
}

/**
 * handleBackup: Always reads from Supabase key_value_store (Active Source of Truth)
 * and commits backup directly to GitHub repository via GitHub REST API.
 */
async function handleBackup(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized. Valid Bearer token matching CRON_SECRET is required.' });
  }

  const { supabaseUrl, supabaseKey } = getNormalizedSupabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/ANON_KEY for backup.' });
  }

  const githubToken = process.env.GITHUB_BACKUP_TOKEN;
  const githubRepo = process.env.GITHUB_BACKUP_REPO;

  if (!githubToken || !githubRepo) {
    return res.status(500).json({
      error: 'Missing required env vars: GITHUB_BACKUP_TOKEN or GITHUB_BACKUP_REPO',
    });
  }

  try {
    // 1. Fetch all rows directly from Supabase key_value_store
    const targetEndpoint = `${supabaseUrl}/rest/v1/key_value_store?select=key,value,updated_at`;
    const sbRes = await fetch(targetEndpoint, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!sbRes.ok) {
      const errText = await sbRes.text();
      console.error('Supabase backup fetch error:', errText);
      return res.status(500).json({ error: 'Failed to fetch data from Supabase for backup', details: errText });
    }

    const rows: { key: string; value: any; updated_at?: string }[] = await sbRes.json();
    const backupData: Record<string, any> = {};

    // Sort keys alphabetically for clean, deterministic backup JSON
    rows.sort((a, b) => a.key.localeCompare(b.key));
    for (const row of rows) {
      backupData[row.key] = row.value;
    }

    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split('T')[0];
    const fullBackupPayload = {
      meta: {
        timestamp,
        totalKeysFound: rows.length,
        source: 'Supabase key_value_store',
        system: 'BazManager Automated Backup',
      },
      keys: backupData,
    };

    const jsonString = JSON.stringify(fullBackupPayload, null, 2);
    const contentBase64 = Buffer.from(jsonString, 'utf-8').toString('base64');
    const filePath = `backups/backup-${dateStr}.json`;
    const githubApiUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;

    // Check if file already exists in GitHub repository to get SHA for update
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

    // Commit backup JSON file to GitHub
    const putRes = await fetch(githubApiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'BazManager-Backup-Cron',
      },
      body: JSON.stringify({
        message: `Automated Supabase Backup - ${timestamp}`,
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
      message: `Backup successfully created at ${filePath} from Supabase`,
      source: 'supabase',
      keysFound: rows.length,
      commitSha: responseData.commit?.sha,
    });
  } catch (error: any) {
    console.error('Error executing backup:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

async function handleAdminDryrun(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized. Valid Bearer token matching CRON_SECRET is required.' });
  }

  try {
    const allKeys = await getAllKeysToProcess();
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

async function handleVerifyIntegrity(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized. Valid Bearer token matching CRON_SECRET is required.' });
  }

  const { supabaseUrl, supabaseKey } = getNormalizedSupabaseConfig();
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY/ANON_KEY are required.' });
  }

  try {
    const allKeys = await getAllKeysToProcess();

    const targetEndpoint = `${supabaseUrl}/rest/v1/key_value_store?select=key,value`;
    const sbRes = await fetch(targetEndpoint, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    if (!sbRes.ok) {
      const errText = await sbRes.text();
      return res.status(500).json({ error: `Failed to fetch from Supabase: ${sbRes.status}`, details: errText });
    }

    const supabaseRows: { key: string; value: any }[] = await sbRes.json();
    const supabaseMap = new Map<string, any>();
    for (const row of supabaseRows) {
      supabaseMap.set(row.key, row.value);
    }

    const results = [];
    let matchCount = 0;
    let mismatchCount = 0;

    for (const key of allKeys) {
      const rawRedisVal = await redis.get(key);
      if (rawRedisVal === null || rawRedisVal === undefined) {
        continue;
      }

      let parsedRedis: any;
      try {
        parsedRedis = JSON.parse(rawRedisVal);
      } catch {
        parsedRedis = rawRedisVal;
      }

      if (!supabaseMap.has(key)) {
        mismatchCount++;
        const redisCanon = canonicalJson(parsedRedis);
        results.push({
          key,
          status: 'MISSING_IN_SUPABASE',
          match: false,
          redisHash: sha256(redisCanon),
          supabaseHash: null,
        });
        continue;
      }

      const parsedSupabase = supabaseMap.get(key);
      const redisCanon = canonicalJson(parsedRedis);
      const supabaseCanon = canonicalJson(parsedSupabase);

      const redisHash = sha256(redisCanon);
      const supabaseHash = sha256(supabaseCanon);

      const isMatch = (redisHash === supabaseHash);
      if (isMatch) {
        matchCount++;
      } else {
        mismatchCount++;
      }

      results.push({
        key,
        status: isMatch ? 'MATCH' : 'MISMATCH',
        match: isMatch,
        redisHash,
        supabaseHash,
      });
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        totalRedisKeysChecked: results.length,
        totalSupabaseRows: supabaseRows.length,
        perfectMatches: matchCount,
        mismatches: mismatchCount,
        allMatch: mismatchCount === 0 && results.length > 0,
      },
      results,
    });
  } catch (error: any) {
    console.error('Integrity verification error:', error.message);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action, type } = req.query as { action?: string; type?: string };

  if (action === 'backup') {
    return handleBackup(req, res);
  }

  if (action === 'admin-dryrun') {
    return handleAdminDryrun(req, res);
  }

  if (action === 'verify-integrity') {
    return handleVerifyIntegrity(req, res);
  }

  if (!type || !KEYS[type as keyof typeof KEYS]) {
    return res.status(400).json({ success: false, error: 'Invalid or missing type or action parameter' });
  }

  const REDIS_KEY = KEYS[type as keyof typeof KEYS];

  try {
    if (req.method === 'GET') {
      const rawData = await redis.get(REDIS_KEY);
      const data = rawData ? JSON.parse(rawData) : (type === 'kanban' || type === 'chat' ? [] : {});
      return res.status(200).json({ success: true, [type]: data });
    }

    if (req.method === 'POST') {
      const { records, tasks, learning_trails, chat } = req.body;
      let data: any;
      if (type === 'kanban') {
        data = tasks;
      } else if (type === 'learning_trails') {
        data = learning_trails;
      } else if (type === 'chat') {
        data = chat;
      } else {
        data = records;
      }

      if (!data) {
        return res.status(400).json({ success: false, error: 'No data provided' });
      }

      if ((type === 'kanban' || type === 'chat') && !Array.isArray(data)) {
        return res.status(400).json({ success: false, error: `Invalid ${type} format` });
      }

      await redis.set(REDIS_KEY, JSON.stringify(data));
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error: any) {
    console.error(`${type} API Error:`, error.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
