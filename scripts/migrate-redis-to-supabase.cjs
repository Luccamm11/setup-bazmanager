const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');

// Load environment variables from .env if present
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const val = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  });
}

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

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!isDryRun && (!supabaseUrl || !supabaseKey)) {
    console.error('❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) are required for live migration.');
    process.exit(1);
  }

  const redis = new Redis(redisUrl);

  try {
    console.log('📡 Connecting to Redis and scanning target keys...');

    // Discover all active members from registry
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
      console.log('👉 Review the verification hashes above. When ready, run the migration with actual Supabase credentials.');
      await redis.quit();
      return;
    }

    // LIVE MIGRATION MODE
    console.log('\n🚀 Starting Live Write to Supabase...');
    // Upsert into Supabase key_value_store via REST API
    let migratedCount = 0;
    for (const item of summaryTable) {
      if (item.Status !== 'EXISTS') continue;

      const payload = {
        key: item.Key,
        value: item.ParsedValue,
        updated_at: new Date().toISOString(),
      };

      const res = await fetch(`${supabaseUrl}/rest/v1/key_value_store`, {
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
        console.error(`❌ Failed to migrate key ${item.Key}:`, errText);
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
