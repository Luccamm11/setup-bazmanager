const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');

// Helper to load env vars from .env files (ignoring Vercel CLI placeholders)
function loadEnvFile(fileName) {
  const envPath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(envPath)) return;
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const varName = key.trim();
      const val = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (val && val !== '[SENSITIVE]' && (!process.env[varName] || process.env[varName] === '[SENSITIVE]')) {
        process.env[varName] = val;
      }
    }
  });
}

loadEnvFile('.env');
loadEnvFile('.env.local');

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

// Deterministic canonical JSON stringifier (sorts object keys recursively)
function canonicalJson(obj) {
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

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function verifyIntegrity() {
  console.log('====================================================');
  console.log(' 🔍 BazManager Redis <-> Supabase Integrity Verifier');
  console.log('====================================================\n');

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('❌ ERROR: REDIS_URL environment variable is missing.');
    process.exit(1);
  }

  let rawUrl = (process.env.SUPABASE_URL || '').trim();
  let rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

  if (rawUrl === '[SENSITIVE]') rawUrl = '';
  if (rawKey === '[SENSITIVE]') rawKey = '';

  if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    rawUrl = `https://${rawUrl}`;
  }

  const supabaseUrl = rawUrl;
  const supabaseKey = rawKey;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required.');
    console.error('👉 Pass them via environment variables: SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/verify-supabase-migration.cjs');
    process.exit(1);
  }

  const redis = new Redis(redisUrl);

  try {
    console.log('📡 Fetching key list from Redis...');
    let memberUsernames = [...FALLBACK_MEMBERS];
    try {
      const rawMembers = await redis.get('levelup_members_registry');
      if (rawMembers) {
        const parsed = JSON.parse(rawMembers);
        if (Array.isArray(parsed)) {
          const names = parsed.map(m => m.username).filter(Boolean);
          memberUsernames = Array.from(new Set([...FALLBACK_MEMBERS, ...names]));
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not parse member registry, using default fallback list.');
    }

    const allKeysSet = new Set(FIXED_KEYS);
    for (const member of memberUsernames) {
      allKeysSet.add(`levelup_user_${member}`);
      allKeysSet.add(`levelup_notifications_${member}`);
    }

    const allKeys = Array.from(allKeysSet);

    console.log('📡 Fetching all rows from Supabase key_value_store...');
    const targetEndpoint = `${supabaseUrl}/rest/v1/key_value_store?select=key,value`;
    const res = await fetch(targetEndpoint, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ Failed to read from Supabase: ${res.status} ${res.statusText}`, errText);
      await redis.quit();
      process.exit(1);
    }

    const supabaseRows = await res.json();
    const supabaseMap = new Map();
    for (const row of supabaseRows) {
      supabaseMap.set(row.key, row.value);
    }

    console.log(`📦 Keys in Supabase table: ${supabaseRows.length}`);
    console.log(`🔍 Comparing data integrity for all active Redis keys...\n`);

    const results = [];
    let matchCount = 0;
    let mismatchCount = 0;
    let missingInSupabaseCount = 0;

    for (const key of allKeys) {
      const rawRedisVal = await redis.get(key);
      if (rawRedisVal === null || rawRedisVal === undefined) {
        continue; // Key not in Redis
      }

      let parsedRedis;
      try {
        parsedRedis = JSON.parse(rawRedisVal);
      } catch {
        parsedRedis = rawRedisVal;
      }

      const hasSupabase = supabaseMap.has(key);
      if (!hasSupabase) {
        missingInSupabaseCount++;
        mismatchCount++;
        const redisCanon = canonicalJson(parsedRedis);
        const rHash = sha256(redisCanon);
        results.push({
          key,
          status: 'MISSING IN SUPABASE',
          redisHash: rHash,
          supabaseHash: 'N/A',
          match: false,
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
        results.push({
          key,
          status: 'MATCH',
          redisHash: redisHash.substring(0, 16) + '...',
          supabaseHash: supabaseHash.substring(0, 16) + '...',
          fullRedisHash: redisHash,
          fullSupabaseHash: supabaseHash,
          match: true,
        });
      } else {
        mismatchCount++;
        results.push({
          key,
          status: 'MISMATCH',
          redisHash: redisHash,
          supabaseHash: supabaseHash,
          fullRedisHash: redisHash,
          fullSupabaseHash: supabaseHash,
          match: false,
        });
      }
    }

    console.log('------------------------------------------------------------------------------------------------------------------------');
    console.log(`| ${'KEY NAME'.padEnd(36)} | ${'REDIS SHA-256'.padEnd(20)} | ${'SUPABASE SHA-256'.padEnd(20)} | ${'INTEGRITY STATUS'.padEnd(16)} |`);
    console.log('------------------------------------------------------------------------------------------------------------------------');

    for (const r of results) {
      const statusLabel = r.match ? '✅ MATCH' : `❌ ${r.status}`;
      console.log(`| ${r.key.padEnd(36)} | ${r.redisHash.padEnd(20)} | ${r.supabaseHash.padEnd(20)} | ${statusLabel.padEnd(16)} |`);
    }
    console.log('------------------------------------------------------------------------------------------------------------------------\n');

    console.log('📊 VERIFICATION SUMMARY:');
    console.log(`   - Total Redis Keys Checked: ${results.length}`);
    console.log(`   - Perfect Matches (100%):   ${matchCount}`);
    console.log(`   - Mismatches / Missing:     ${mismatchCount}`);

    if (mismatchCount > 0) {
      console.log('\n❌ MISMATCH DETAILS:');
      for (const r of results) {
        if (!r.match) {
          console.log(`   • Key: ${r.key}`);
          console.log(`     - Redis Hash:    ${r.fullRedisHash}`);
          console.log(`     - Supabase Hash: ${r.fullSupabaseHash}`);
        }
      }
      console.log('\n⚠️ ATTENTION: Do not switch USE_SUPABASE to true until mismatches are resolved.');
    } else {
      console.log('\n🎉 100% INTEGRITY CONFIRMED!');
      console.log('🔒 Every single key in Supabase matches the Redis source data exactly.');
      console.log('✅ It is safe to set USE_SUPABASE="true" in production.');
    }

    await redis.quit();
  } catch (error) {
    console.error('❌ Verification script error:', error);
    await redis.quit();
    process.exit(1);
  }
}

verifyIntegrity();
