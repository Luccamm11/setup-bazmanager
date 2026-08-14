const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');

// Helper to load env vars from .env file (ignoring [SENSITIVE] placeholders from Vercel CLI .env.local)
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
      // Ignore Vercel CLI placeholder string "[SENSITIVE]"
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

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function runMigration() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('====================================================');
  console.log(` 🚀 BazManager Redis -> Supabase Migration Script`);
  console.log(` 🔍 Mode: ${isDryRun ? 'DRY-RUN (READ-ONLY / VERIFICATION)' : 'LIVE MIGRATION'}`);
  console.log('====================================================\n');

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('❌ ERROR: REDIS_URL environment variable is missing.');
    process.exit(1);
  }

  let rawUrl = (process.env.SUPABASE_URL || '').trim();
  let rawKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

  // Guard against placeholder strings from Vercel CLI generated .env.local
  if (rawUrl === '[SENSITIVE]') rawUrl = '';
  if (rawKey === '[SENSITIVE]') rawKey = '';

  if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    rawUrl = `https://${rawUrl}`;
  }

  const supabaseUrl = rawUrl; // Intact real URL for fetch
  const supabaseKey = rawKey; // Intact real Key for fetch

  if (!isDryRun && (!supabaseUrl || !supabaseKey)) {
    console.error('❌ ERROR: Real SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for live migration.');
    console.error('👉 Pass them via environment variables or set them in .env (e.g., SUPABASE_URL=https://xyz.supabase.co SUPABASE_SERVICE_ROLE_KEY=ey...).');
    process.exit(1);
  }

  if (!isDryRun) {
    try {
      new URL(supabaseUrl);
    } catch (e) {
      console.error(`❌ ERROR: Invalid SUPABASE_URL string: "${supabaseUrl}". Must be a valid URL (e.g. https://xyz.supabase.co).`);
      process.exit(1);
    }
  }

  // Create a SEPARATE variable purely for display logging
  const urlForDisplay = supabaseUrl ? supabaseUrl.replace(/https?:\/\/[^/]+/, 'https://***') : '(not set)';

  const redis = new Redis(redisUrl);

  try {
    console.log('📡 Connecting to Redis and scanning target keys...');

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
      console.warn('⚠️ Could not parse member registry, using default member list.');
    }

    const allKeysSet = new Set(FIXED_KEYS);
    for (const member of memberUsernames) {
      allKeysSet.add(`levelup_user_${member}`);
      allKeysSet.add(`levelup_notifications_${member}`);
    }

    const allKeys = Array.from(allKeysSet);
    console.log(`📋 Found ${allKeys.length} total key patterns to check.\n`);

    const summaryTable = [];
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
        let parsedValue = null;
        try {
          parsedValue = JSON.parse(rawValue);
          isValidJson = true;
        } catch {
          parsedValue = rawValue;
        }

        summaryTable.push({
          Key: key,
          Status: 'EXISTS',
          SizeBytes: bytes,
          SHA256: hash.substring(0, 16) + '...',
          FullSHA256: hash,
          ValidJSON: isValidJson ? 'YES' : 'NO',
          RawValue: rawValue,
          ParsedValue: parsedValue,
        });
      } else {
        summaryTable.push({
          Key: key,
          Status: 'EMPTY / NOT SET',
          SizeBytes: 0,
          SHA256: '-',
          FullSHA256: '-',
          ValidJSON: '-',
          RawValue: null,
          ParsedValue: null,
        });
      }
    }

    console.log('---------------------------------------------------------------------------------------------');
    console.log(`| ${'KEY NAME'.padEnd(38)} | ${'STATUS'.padEnd(14)} | ${'SIZE (BYTES)'.padEnd(12)} | ${'SHA-256 (PREFIX)'.padEnd(18)} |`);
    console.log('---------------------------------------------------------------------------------------------');

    for (const item of summaryTable) {
      if (item.Status === 'EXISTS') {
        console.log(`| ${item.Key.padEnd(38)} | ${item.Status.padEnd(14)} | ${String(item.SizeBytes).padEnd(12)} | ${item.SHA256.padEnd(18)} |`);
      }
    }
    console.log('---------------------------------------------------------------------------------------------\n');

    console.log(`📊 SUMMARY STATISTICS:`);
    console.log(`   - Keys Evaluated: ${allKeys.length}`);
    console.log(`   - Active Keys Found: ${foundKeysCount}`);
    console.log(`   - Total Payload Size: ${totalBytes} bytes (${(totalBytes / 1024).toFixed(2)} KB)`);

    if (isDryRun) {
      console.log('\n✅ DRY-RUN COMPLETED SUCCESSFULLY!');
      console.log('🔒 Security Guarantee: Zero writes were executed to Redis or Supabase.');
      await redis.quit();
      return;
    }

    // LIVE MIGRATION MODE
    const targetEndpoint = `${supabaseUrl}/rest/v1/key_value_store`;
    console.log(`\n🚀 Starting Live Write to Supabase (${urlForDisplay}/rest/v1/key_value_store)...`);

    let migratedCount = 0;
    for (const item of summaryTable) {
      if (item.Status !== 'EXISTS') continue;

      const payload = {
        key: item.Key,
        value: item.ParsedValue,
        updated_at: new Date().toISOString(),
      };

      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`❌ Failed to migrate key ${item.Key}: ${res.status} ${res.statusText}`, errText);
      } else {
        migratedCount++;
        console.log(`  ✓ Migrated key: ${item.Key}`);
      }
    }

    console.log(`\n🎉 Live migration complete! ${migratedCount}/${foundKeysCount} keys saved to Supabase.`);
    await redis.quit();

  } catch (error) {
    console.error('❌ Migration error:', error);
    await redis.quit();
    process.exit(1);
  }
}

runMigration();
