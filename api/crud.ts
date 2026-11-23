import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import redis from './_lib/redis.js';
import { authenticateRequest } from './_lib/auth.js';
import type { CompetitionData, CompetitionEvent, MatchRecord, ScoutedTeamPit, MatchScoutEntry, PickListItem, TacticalBoardPlay, BioBuzzAIUpdateNote, BioBuzzAIChatMessage, StrategyScoutingHub, FtcLiveEventSnapshot, FtcLiveTeamRanking, FtcLiveMatch } from '../types.js';
import { INITIAL_COMPETITIONS_DATA } from '../data/initialCompetitionsData.js';

const KEYS = {
  attendance: 'levelup_attendance_records',
  finance: 'levelup_finance_records',
  kanban: 'levelup_kanban_tasks',
  learning_trails: 'levelup_learning_trails_data',
  chat: 'levelup_chat_data',
  competitions: 'levelup_competitions_data',
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
  'levelup_competitions_data',
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

async function lookupFtcTeamFromFtcScout(teamNumber: number) {
  let name: string | undefined;
  let cityState: string | undefined;
  let opr: { total?: number; auto?: number; teleop?: number; endgame?: number } | undefined;

  // 1) Try GraphQL team metadata
  try {
    const gqlRes = await fetch('https://api.ftcscout.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query($n: Int!) { teamByNumber(number: $n) { number name location { city state country } } }`,
        variables: { n: teamNumber },
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (gqlRes.ok) {
      const gqlJson: any = await gqlRes.json();
      const t = gqlJson?.data?.teamByNumber;
      if (t) {
        name = t.name || undefined;
        const locParts = [t.location?.city, t.location?.state, t.location?.country].filter(Boolean);
        if (locParts.length > 0) cityState = locParts.join(', ');
      }
    }
  } catch (err) {
    console.warn('[ftcscout] GraphQL team lookup unavailable:', (err as any)?.message);
  }

  // 2) Try REST quick-stats (2026 then 2025 fallback)
  for (const season of [2026, 2025]) {
    try {
      const restRes = await fetch(`https://api.ftcscout.org/rest/v1/teams/${teamNumber}/quick-stats?season=${season}`, {
        signal: AbortSignal.timeout(3500),
      });
      if (restRes.ok) {
        const statsJson: any = await restRes.json();
        if (statsJson && (statsJson.tot || statsJson.auto || statsJson.dc || statsJson.eg)) {
          opr = {
            total: typeof statsJson.tot?.value === "number" ? Number(statsJson.tot.value.toFixed(1)) : undefined,
            auto: typeof statsJson.auto?.value === "number" ? Number(statsJson.auto.value.toFixed(1)) : undefined,
            teleop: typeof statsJson.dc?.value === "number" ? Number(statsJson.dc.value.toFixed(1)) : undefined,
            endgame: typeof statsJson.eg?.value === "number" ? Number(statsJson.eg.value.toFixed(1)) : undefined,
          };
          break;
        }
      }
    } catch {
      // ignore timeout/network fallback
    }
  }

  if (!name && !opr) {
    return { found: false as const };
  }
  return {
    found: true as const,
    team: {
      teamNumber,
      teamName: name || `Equipe FTC #${teamNumber}`,
      cityState: cityState || undefined,
      opr,
    },
  };
}


async function discoverTeamEventsFromFtcScout(teamNumber: number, season = 2026) {
  const res = await fetch('https://api.ftcscout.org/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query($n: Int!, $s: Int!) {
        teamByNumber(number: $n) {
          number name
          events(season: $s) {
            eventCode
            event {
              code name start end ongoing started finished liveStreamURL
              location { venue city state country }
            }
          }
        }
      }`,
      variables: { n: teamNumber, s: season },
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return [];
  const json: any = await res.json();
  const list = json?.data?.teamByNumber?.events || [];
  return list
    .filter((item: any) => item?.event)
    .map((item: any) => {
      const ev = item.event;
      const loc = [ev.location?.venue, ev.location?.city, ev.location?.state].filter(Boolean).join(', ');
      return {
        code: ev.code,
        name: ev.name,
        start: ev.start,
        end: ev.end,
        ongoing: Boolean(ev.ongoing),
        started: Boolean(ev.started),
        finished: Boolean(ev.finished),
        location: loc || undefined,
        liveStreamURL: ev.liveStreamURL || undefined,
      };
    });
}

async function fetchLiveEventFromFtcScout(eventCode: string, season = 2026): Promise<FtcLiveEventSnapshot | null> {
  const cleanCode = eventCode.trim().toUpperCase();
  const res = await fetch('https://api.ftcscout.org/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query($s: Int!, $c: String!) {
        eventByCode(season: $s, code: $c) {
          code season name start end ongoing started finished liveStreamURL
          location { venue city state country }
          teams {
            teamNumber
            team { number name location { city state country } }
            stats {
              ... on TeamEventStats2026 {
                rank wins losses ties rp tb1 qualMatchesPlayed
                opr { totalPoints totalPointsNp autoPoints dcPoints tips }
                avg { totalPoints }
              }
            }
          }
          matches {
            id matchNum tournamentLevel description hasBeenPlayed scheduledStartTime actualStartTime
            teams { alliance station teamNumber }
            scores {
              ... on MatchScores2026 {
                red { totalPoints autoPoints tips swarmRp pollinator1Rp pollinator2Rp }
                blue { totalPoints autoPoints tips swarmRp pollinator1Rp pollinator2Rp }
              }
            }
          }
        }
      }`,
      variables: { s: season, c: cleanCode },
    }),
    signal: AbortSignal.timeout(6500),
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  const ev = json?.data?.eventByCode;
  if (!ev) return null;

  const rankings: FtcLiveTeamRanking[] = (ev.teams || []).map((tp: any) => {
    const loc = [tp.team?.location?.city, tp.team?.location?.state].filter(Boolean).join(', ');
    const st = tp.stats || null;
    return {
      teamNumber: tp.teamNumber,
      teamName: tp.team?.name || `Equipe #${tp.teamNumber}`,
      cityState: loc || undefined,
      rank: typeof st?.rank === 'number' ? st.rank : undefined,
      wins: typeof st?.wins === 'number' ? st.wins : undefined,
      losses: typeof st?.losses === 'number' ? st.losses : undefined,
      ties: typeof st?.ties === 'number' ? st.ties : undefined,
      rp: typeof st?.rp === 'number' ? Number(st.rp.toFixed(2)) : undefined,
      tb1: typeof st?.tb1 === 'number' ? Number(st.tb1.toFixed(1)) : undefined,
      qualMatchesPlayed: typeof st?.qualMatchesPlayed === 'number' ? st.qualMatchesPlayed : undefined,
      oprTotal: typeof st?.opr?.totalPoints === 'number' ? Number(st.opr.totalPoints.toFixed(1)) : undefined,
      oprAuto: typeof st?.opr?.autoPoints === 'number' ? Number(st.opr.autoPoints.toFixed(1)) : undefined,
      oprTeleop: typeof st?.opr?.dcPoints === 'number' ? Number(st.opr.dcPoints.toFixed(1)) : undefined,
      oprTips: typeof st?.opr?.tips === 'number' ? Number(st.opr.tips.toFixed(2)) : undefined,
      avgTotal: typeof st?.avg?.totalPoints === 'number' ? Number(st.avg.totalPoints.toFixed(1)) : undefined,
    };
  }).sort((a: FtcLiveTeamRanking, b: FtcLiveTeamRanking) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.rank) return -1;
    if (b.rank) return 1;
    return a.teamNumber - b.teamNumber;
  });

  const matches: FtcLiveMatch[] = (ev.matches || []).map((m: any) => {
    const redTeams = (m.teams || []).filter((t: any) => t.alliance === 'Red').map((t: any) => t.teamNumber);
    const blueTeams = (m.teams || []).filter((t: any) => t.alliance === 'Blue').map((t: any) => t.teamNumber);
    const sc = m.scores || null;
    return {
      id: m.id,
      matchNum: m.matchNum,
      tournamentLevel: m.tournamentLevel || 'Quals',
      description: m.description || `M-${m.matchNum}`,
      hasBeenPlayed: Boolean(m.hasBeenPlayed),
      scheduledStartTime: m.scheduledStartTime || undefined,
      actualStartTime: m.actualStartTime || undefined,
      redTeams,
      blueTeams,
      redScore: typeof sc?.red?.totalPoints === 'number' ? sc.red.totalPoints : undefined,
      blueScore: typeof sc?.blue?.totalPoints === 'number' ? sc.blue.totalPoints : undefined,
      redAuto: typeof sc?.red?.autoPoints === 'number' ? sc.red.autoPoints : undefined,
      blueAuto: typeof sc?.blue?.autoPoints === 'number' ? sc.blue.autoPoints : undefined,
      redTips: typeof sc?.red?.tips === 'number' ? sc.red.tips : undefined,
      blueTips: typeof sc?.blue?.tips === 'number' ? sc.blue.tips : undefined,
      redSwarmRp: typeof sc?.red?.swarmRp === 'boolean' ? sc.red.swarmRp : undefined,
      blueSwarmRp: typeof sc?.blue?.swarmRp === 'boolean' ? sc.blue.swarmRp : undefined,
      redPollinator1Rp: typeof sc?.red?.pollinator1Rp === 'boolean' ? sc.red.pollinator1Rp : undefined,
      bluePollinator1Rp: typeof sc?.blue?.pollinator1Rp === 'boolean' ? sc.blue.pollinator1Rp : undefined,
      redPollinator2Rp: typeof sc?.red?.pollinator2Rp === 'boolean' ? sc.red.pollinator2Rp : undefined,
      bluePollinator2Rp: typeof sc?.blue?.pollinator2Rp === 'boolean' ? sc.blue.pollinator2Rp : undefined,
    };
  }).sort((a: FtcLiveMatch, b: FtcLiveMatch) => a.id - b.id);

  const locStr = [ev.location?.venue, ev.location?.city, ev.location?.state].filter(Boolean).join(', ');
  return {
    eventCode: ev.code,
    season: ev.season || season,
    eventName: ev.name,
    location: locStr || undefined,
    start: ev.start || undefined,
    end: ev.end || undefined,
    ongoing: Boolean(ev.ongoing),
    started: Boolean(ev.started),
    finished: Boolean(ev.finished),
    liveStreamURL: ev.liveStreamURL || undefined,
    rankings,
    matches,
    lastSyncedAt: new Date().toISOString(),
  };
}

function ensureStrategyHub(ev: CompetitionEvent): StrategyScoutingHub {
  if (!ev.strategyScouting) {
    ev.strategyScouting = {
      teams: [],
      matchScouts: [],
      pickList: [],
      tacticalPlays: [],
      aiTeamUpdates: [],
      aiChatHistory: [],
    };
  }
  if (!Array.isArray(ev.strategyScouting.teams)) ev.strategyScouting.teams = [];
  if (!Array.isArray(ev.strategyScouting.matchScouts)) ev.strategyScouting.matchScouts = [];
  if (!Array.isArray(ev.strategyScouting.pickList)) ev.strategyScouting.pickList = [];
  if (!Array.isArray(ev.strategyScouting.tacticalPlays)) ev.strategyScouting.tacticalPlays = [];
  if (!Array.isArray(ev.strategyScouting.aiTeamUpdates)) ev.strategyScouting.aiTeamUpdates = [];
  if (!Array.isArray(ev.strategyScouting.aiChatHistory)) ev.strategyScouting.aiChatHistory = [];
  return ev.strategyScouting;
}
async function handleCompetitions(req: VercelRequest, res: VercelResponse) {
  const COMPETITIONS_KEY = 'levelup_competitions_data';

  const loadCompetitionsData = async (): Promise<CompetitionData> => {
    const raw = await redis.get(COMPETITIONS_KEY);
    if (!raw) return INITIAL_COMPETITIONS_DATA;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.events)) {
        return INITIAL_COMPETITIONS_DATA;
      }
      return parsed as CompetitionData;
    } catch (err) {
      console.error('Error parsing competitions data from DB:', err);
      return INITIAL_COMPETITIONS_DATA;
    }
  };

  const saveCompetitionsData = async (data: CompetitionData): Promise<void> => {
    await redis.set(COMPETITIONS_KEY, JSON.stringify(data));
  };

  if (req.method === 'GET') {
    const { lookupTeam, discoverTeam, syncLiveEvent, season } = req.query as {
      lookupTeam?: string;
      discoverTeam?: string;
      syncLiveEvent?: string;
      season?: string;
    };
    const seasonNum = parseInt(season || '2026', 10) || 2026;

    if (discoverTeam) {
      const teamNum = parseInt(discoverTeam, 10) || 21083;
      try {
        const events = await discoverTeamEventsFromFtcScout(teamNum, seasonNum);
        return res.status(200).json({ success: true, teamNumber: teamNum, season: seasonNum, events });
      } catch {
        return res.status(200).json({ success: false, events: [], error: 'FTCScout indisponível.' });
      }
    }

    if (syncLiveEvent) {
      try {
        const snapshot = await fetchLiveEventFromFtcScout(syncLiveEvent, seasonNum);
        if (!snapshot) {
          return res.status(200).json({ success: false, error: 'Evento não encontrado no FTCScout.' });
        }
        return res.status(200).json({ success: true, snapshot });
      } catch {
        return res.status(200).json({ success: false, error: 'Falha ao consultar FTCScout.' });
      }
    }
    if (lookupTeam) {
      const num = parseInt(lookupTeam, 10);
      if (isNaN(num) || num <= 0) {
        return res.status(400).json({ success: false, fallbackManual: true, error: 'Número de equipe inválido.' });
      }
      try {
        const lookupResult = await lookupFtcTeamFromFtcScout(num);
        if (!lookupResult.found) {
          return res.status(200).json({ success: false, fallbackManual: true, message: 'Equipe não localizada no FTCScout; prossiga com o cadastro manual.' });
        }
        return res.status(200).json({ success: true, team: lookupResult.team });
      } catch {
        return res.status(200).json({ success: false, fallbackManual: true, message: 'FTCScout indisponível no momento; prossiga com o cadastro manual.' });
      }
    }
    try {
      const data = await loadCompetitionsData();
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      console.error('Competitions GET error:', err.message);
      return res.status(500).json({ success: false, error: 'Erro ao buscar dados das competições.' });
    }
  }

  if (req.method === 'POST') {
    const auth = authenticateRequest(req);
    if (!auth.valid || !auth.user) {
      return res.status(401).json({ success: false, error: 'Acesso não autorizado. Token ausente ou inválido.' });
    }

    const { action, username, data, eventId, payload } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, error: 'Username é obrigatório.' });
    }

    try {
      const current = await loadCompetitionsData();

      if (action === 'save_all' && data) {
        const updatedData: CompetitionData = {
          ...data,
          updatedAt: new Date().toISOString(),
          updatedBy: username,
        };
        await saveCompetitionsData(updatedData);
        return res.status(200).json({ success: true, data: updatedData });
      }

      if (action === 'set_active_event' && eventId) {
        current.activeEventId = eventId;
        current.updatedAt = new Date().toISOString();
        current.updatedBy = username;
        await saveCompetitionsData(current);
        return res.status(200).json({ success: true, data: current });
      }

      if (action === 'save_event' && payload) {
        const incomingEvent: CompetitionEvent = payload;
        const existingIndex = current.events.findIndex(e => e.id === incomingEvent.id);

        if (existingIndex >= 0) {
          current.events[existingIndex] = {
            ...current.events[existingIndex],
            ...incomingEvent,
            updatedAt: new Date().toISOString(),
          };
        } else {
          current.events.unshift({
            ...incomingEvent,
            createdAt: new Date().toISOString(),
            createdBy: username,
            updatedAt: new Date().toISOString(),
          });
          current.activeEventId = incomingEvent.id;
        }

        current.updatedAt = new Date().toISOString();
        current.updatedBy = username;
        await saveCompetitionsData(current);
        return res.status(200).json({ success: true, data: current });
      }

      if (action === 'delete_event' && eventId) {
        current.events = current.events.filter(e => e.id !== eventId);
        if (current.activeEventId === eventId) {
          current.activeEventId = current.events.length > 0 ? current.events[0].id : null;
        }
        current.updatedAt = new Date().toISOString();
        current.updatedBy = username;
        await saveCompetitionsData(current);
        return res.status(200).json({ success: true, data: current });
      }

      const targetEventId = eventId || current.activeEventId;
      const targetEvent = current.events.find(e => e.id === targetEventId);

      if (!targetEvent) {
        return res.status(404).json({ success: false, error: 'Evento não encontrado.' });
      }

      if (action === 'toggle_departure_item') {
        const { itemId, packed } = payload;
        const item = targetEvent.travelChecklist.departureItems.find(i => i.id === itemId);
        if (item) {
          item.packed = packed !== undefined ? packed : !item.packed;
          item.packedBy = item.packed ? username : undefined;
          item.packedAt = item.packed ? new Date().toISOString() : undefined;
        }
      } else if (action === 'add_departure_item') {
        const newItem = {
          ...payload,
          id: `dep-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          packed: false,
        };
        targetEvent.travelChecklist.departureItems.push(newItem);
        if (!targetEvent.travelChecklist.departureCategories.includes(newItem.category)) {
          targetEvent.travelChecklist.departureCategories.push(newItem.category);
        }
      } else if (action === 'delete_departure_item') {
        const { itemId } = payload;
        targetEvent.travelChecklist.departureItems = targetEvent.travelChecklist.departureItems.filter(i => i.id !== itemId);
      } else if (action === 'sync_return_from_departure') {
        const existingAcquired = targetEvent.travelChecklist.returnItems.filter(i => i.origin === 'acquired_at_event');
        const departureMapped = targetEvent.travelChecklist.departureItems.map(dep => {
          const existingReturn = targetEvent.travelChecklist.returnItems.find(r => r.name.toLowerCase() === dep.name.toLowerCase());
          return {
            id: existingReturn ? existingReturn.id : `ret-${dep.id}`,
            name: dep.name,
            category: dep.category,
            quantity: dep.quantity,
            origin: 'departure' as const,
            packed: existingReturn ? existingReturn.packed : false,
            packedBy: existingReturn ? existingReturn.packedBy : undefined,
            packedAt: existingReturn ? existingReturn.packedAt : undefined,
            notes: dep.notes,
          };
        });
        targetEvent.travelChecklist.returnItems = [...departureMapped, ...existingAcquired];
      } else if (action === 'toggle_return_item') {
        const { itemId, packed } = payload;
        const item = targetEvent.travelChecklist.returnItems.find(i => i.id === itemId);
        if (item) {
          item.packed = packed !== undefined ? packed : !item.packed;
          item.packedBy = item.packed ? username : undefined;
          item.packedAt = item.packed ? new Date().toISOString() : undefined;
        }
      } else if (action === 'add_return_item') {
        const newItem = {
          ...payload,
          id: `ret-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          origin: payload.origin || 'acquired_at_event',
          packed: false,
        };
        targetEvent.travelChecklist.returnItems.push(newItem);
      } else if (action === 'delete_return_item') {
        const { itemId } = payload;
        targetEvent.travelChecklist.returnItems = targetEvent.travelChecklist.returnItems.filter(i => i.id !== itemId);
      } else if (action === 'toggle_hotel_item') {
        const { itemId, completed } = payload;
        const item = targetEvent.matchesChecklist.hotelDepartureChecklist.find(i => i.id === itemId);
        if (item) {
          item.completed = completed !== undefined ? completed : !item.completed;
          item.completedBy = item.completed ? username : undefined;
          item.completedAt = item.completed ? new Date().toISOString() : undefined;
        }
      } else if (action === 'add_hotel_item') {
        const newItem = {
          ...payload,
          id: `hotel-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          completed: false,
        };
        targetEvent.matchesChecklist.hotelDepartureChecklist.push(newItem);
      } else if (action === 'delete_hotel_item') {
        const { itemId } = payload;
        targetEvent.matchesChecklist.hotelDepartureChecklist = targetEvent.matchesChecklist.hotelDepartureChecklist.filter(i => i.id !== itemId);
      } else if (action === 'save_match') {
        const matchData: MatchRecord = payload;
        const matchIndex = targetEvent.matchesChecklist.matches.findIndex(m => m.id === matchData.id);
        if (matchIndex >= 0) {
          targetEvent.matchesChecklist.matches[matchIndex] = matchData;
        } else {
          targetEvent.matchesChecklist.matches.unshift({
            ...matchData,
            createdAt: new Date().toISOString(),
            createdBy: username,
          });
        }
      } else if (action === 'delete_match') {
        const { matchId } = payload;
        targetEvent.matchesChecklist.matches = targetEvent.matchesChecklist.matches.filter(m => m.id !== matchId);
      } else if (action === 'upsert_scout_team') {
        const hub = ensureStrategyHub(targetEvent);
        const team: ScoutedTeamPit = payload;
        const idx = hub.teams.findIndex(t => t.teamNumber === team.teamNumber || t.id === team.id);
        if (idx >= 0) {
          hub.teams[idx] = { ...hub.teams[idx], ...team, updatedAt: new Date().toISOString(), scoutedBy: username };
        } else {
          hub.teams.push({ ...team, id: team.id || `team-${team.teamNumber}-${Date.now()}`, updatedAt: new Date().toISOString(), scoutedBy: username });
        }
      } else if (action === 'delete_scout_team') {
        const isTech = auth.user.role === 'technician' || ['Jonas', 'Ramon'].includes(auth.user.username) || ['Jonas', 'Ramon'].includes(username);
        if (!isTech) {
          return res.status(403).json({ success: false, error: 'Apenas técnicos podem excluir equipes do scouting.' });
        }
        const hub = ensureStrategyHub(targetEvent);
        const { teamNumber } = payload;
        hub.teams = hub.teams.filter(t => t.teamNumber !== teamNumber);
        hub.matchScouts = hub.matchScouts.filter(m => m.teamNumber !== teamNumber);
        hub.pickList = hub.pickList.filter(p => p.teamNumber !== teamNumber);
      } else if (action === 'add_match_scout') {
        const hub = ensureStrategyHub(targetEvent);
        const entry: MatchScoutEntry = payload;
        const idx = hub.matchScouts.findIndex(m => m.id === entry.id);
        if (idx >= 0) {
          hub.matchScouts[idx] = { ...entry, scoutedBy: username, timestamp: new Date().toISOString() };
        } else {
          hub.matchScouts.unshift({ ...entry, id: entry.id || `mscout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, scoutedBy: username, timestamp: new Date().toISOString() });
        }
      } else if (action === 'delete_match_scout') {
        const isTech = auth.user.role === 'technician' || ['Jonas', 'Ramon'].includes(auth.user.username) || ['Jonas', 'Ramon'].includes(username);
        if (!isTech) {
          return res.status(403).json({ success: false, error: 'Apenas técnicos podem excluir registros de match scouting.' });
        }
        const hub = ensureStrategyHub(targetEvent);
        const { scoutId } = payload;
        hub.matchScouts = hub.matchScouts.filter(m => m.id !== scoutId);
      } else if (action === 'save_pick_list') {
        const isTech = auth.user.role === 'technician' || ['Jonas', 'Ramon'].includes(auth.user.username) || ['Jonas', 'Ramon'].includes(username);
        if (!isTech) {
          return res.status(403).json({ success: false, error: 'Apenas técnicos podem editar a Pick List Oficial.' });
        }
        const hub = ensureStrategyHub(targetEvent);
        hub.pickList = Array.isArray(payload) ? (payload as PickListItem[]) : [];
      } else if (action === 'upsert_tactical_play') {
        const hub = ensureStrategyHub(targetEvent);
        const play: TacticalBoardPlay = payload;
        const idx = hub.tacticalPlays.findIndex(pl => pl.id === play.id);
        if (idx >= 0) {
          hub.tacticalPlays[idx] = { ...play, updatedBy: username, updatedAt: new Date().toISOString() };
        } else {
          hub.tacticalPlays.unshift({ ...play, id: play.id || `play-${Date.now()}`, updatedBy: username, updatedAt: new Date().toISOString() });
        }
      } else if (action === 'delete_tactical_play') {
        const hub = ensureStrategyHub(targetEvent);
        const { playId } = payload;
        hub.tacticalPlays = hub.tacticalPlays.filter(pl => pl.id !== playId);
      } else if (action === 'save_ai_team_updates') {
        const isTech = auth.user.role === 'technician' || ['Jonas', 'Ramon'].includes(auth.user.username) || ['Jonas', 'Ramon'].includes(username);
        if (!isTech) {
          return res.status(403).json({ success: false, error: 'Apenas técnicos podem atualizar as regras/Team Updates da IA.' });
        }
        const hub = ensureStrategyHub(targetEvent);
        hub.aiTeamUpdates = Array.isArray(payload) ? (payload as BioBuzzAIUpdateNote[]) : [];
      } else if (action === 'save_ai_chat') {
        const hub = ensureStrategyHub(targetEvent);
        const msgs = Array.isArray(payload) ? (payload as BioBuzzAIChatMessage[]) : [];
        hub.aiChatHistory = msgs.slice(-40);
      } else if (action === 'set_live_config') {
        const isTech = auth.user.role === 'technician' || ['Jonas', 'Ramon'].includes(auth.user.username) || ['Jonas', 'Ramon'].includes(username);
        if (!isTech) {
          return res.status(403).json({ success: false, error: 'Apenas técnicos podem alterar o código do evento oficial.' });
        }
        if (typeof payload?.ftcEventCode === 'string') {
          targetEvent.ftcEventCode = payload.ftcEventCode.trim().toUpperCase() || undefined;
        }
        if (typeof payload?.ftcSeason === 'number') {
          targetEvent.ftcSeason = payload.ftcSeason;
        }
        if (typeof payload?.autoSyncEnabled === 'boolean') {
          targetEvent.autoSyncEnabled = payload.autoSyncEnabled;
        }
      } else if (action === 'sync_live_event') {
        const hub = ensureStrategyHub(targetEvent);
        let codeToSync = (payload?.eventCode || targetEvent.ftcEventCode || '').trim().toUpperCase();
        const seasonToSync = Number(payload?.season || targetEvent.ftcSeason || 2026);

        // Auto-descoberta do evento oficial da Bazinga! 73 (#21083) se nenhum código estiver vinculado
        if (!codeToSync) {
          const discovered = await discoverTeamEventsFromFtcScout(21083, seasonToSync);
          const preferred = discovered.find((e: any) => e.ongoing) || discovered.find((e: any) => !e.finished) || discovered[0];
          if (preferred?.code) {
            codeToSync = preferred.code;
            targetEvent.ftcEventCode = preferred.code;
            targetEvent.ftcSeason = seasonToSync;
          }
        }

        if (!codeToSync) {
          return res.status(200).json({ success: false, data: current, message: 'Nenhum evento oficial localizado para #21083 ainda.' });
        }

        const snapshot = await fetchLiveEventFromFtcScout(codeToSync, seasonToSync);
        if (!snapshot) {
          return res.status(200).json({ success: false, data: current, message: `Evento ${codeToSync} indisponível no FTCScout no momento.` });
        }

        targetEvent.ftcEventCode = snapshot.eventCode;
        targetEvent.ftcSeason = snapshot.season;
        if (targetEvent.autoSyncEnabled === undefined) targetEvent.autoSyncEnabled = true;

        // Atualiza status do evento automaticamente conforme status real da arena
        if (snapshot.finished) targetEvent.status = 'completed';
        else if (snapshot.ongoing || snapshot.started) targetEvent.status = 'ongoing';
        else targetEvent.status = 'upcoming';

        // Sincroniza equipes oficiais no Pit Scouting sem apagar anotações manuais dos scouts
        snapshot.rankings.forEach(rk => {
          const existingIdx = hub.teams.findIndex(t => t.teamNumber === rk.teamNumber);
          const oprObj = rk.oprTotal !== undefined ? {
            total: rk.oprTotal,
            auto: rk.oprAuto,
            teleop: rk.oprTeleop,
          } : undefined;

          if (existingIdx >= 0) {
            hub.teams[existingIdx] = {
              ...hub.teams[existingIdx],
              teamName: rk.teamName || hub.teams[existingIdx].teamName,
              cityState: rk.cityState || hub.teams[existingIdx].cityState,
              ftcScoutOpr: oprObj || hub.teams[existingIdx].ftcScoutOpr,
            };
          } else {
            hub.teams.push({
              id: `team-${rk.teamNumber}-live`,
              teamNumber: rk.teamNumber,
              teamName: rk.teamName,
              cityState: rk.cityState,
              source: 'ftcscout',
              ftcScoutOpr: oprObj,
              drivetrain: 'Mecanum',
              robotDimensionsOk: true,
              usesAprilTags: false,
              canScorePollen: true,
              canScoreNectar: true,
              canTipHive: false,
              canScoreFlowers: false,
              maxCapacity: 4,
              autoRoutineDescription: '',
              autoConsistency: 3,
              teleopRolePreference: 'scorer_hive',
              endgameParkConsistent: false,
              strengths: '',
              weaknesses: '',
              scoutedBy: 'FTCScout Auto-Sync',
              updatedAt: snapshot.lastSyncedAt,
            });
          }
        });

        hub.liveSync = snapshot;
      } else {
        return res.status(400).json({ success: false, error: `Ação desconhecida: ${action}` });
      }

      targetEvent.updatedAt = new Date().toISOString();
      current.updatedAt = new Date().toISOString();
      current.updatedBy = username;

      await saveCompetitionsData(current);
      return res.status(200).json({ success: true, data: current });
    } catch (err: any) {
      console.error('Competitions POST error:', err.message);
      return res.status(500).json({ success: false, error: 'Falha ao processar atualização da competição.' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
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

  if (type === 'competitions') {
    return handleCompetitions(req, res);
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
      const auth = authenticateRequest(req);
      if (!auth.valid || !auth.user) {
        return res.status(401).json({ success: false, error: 'Acesso não autorizado. Token ausente ou inválido.' });
      }

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
