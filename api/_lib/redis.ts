import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

let redisClient: Redis | null = null;

if (redisUrl) {
  redisClient = new Redis(redisUrl, {
    connectTimeout: 10000,
    maxRetriesPerRequest: 2,
    lazyConnect: true,
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err.message);
  });
}

function getNormalizedSupabaseConfig() {
  let supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    supabaseUrl = `https://${supabaseUrl}`;
  }
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY env vars.');
  }

  return { supabaseUrl, supabaseKey };
}

async function supabaseGet(key: string): Promise<string | null> {
  const { supabaseUrl, supabaseKey } = getNormalizedSupabaseConfig();

  const res = await fetch(
    `${supabaseUrl}/rest/v1/key_value_store?key=eq.${encodeURIComponent(key)}&select=value`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Supabase GET error for key ${key}:`, errText);
    return null;
  }

  const rows: { value: any }[] = await res.json();
  if (!rows || rows.length === 0) return null;

  const val = rows[0].value;
  return typeof val === 'string' ? val : JSON.stringify(val);
}

async function supabaseSet(key: string, value: string): Promise<'OK'> {
  const { supabaseUrl, supabaseKey } = getNormalizedSupabaseConfig();

  let parsedValue: any;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    parsedValue = value;
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/key_value_store`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      key,
      value: parsedValue,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Supabase SET error for key ${key}:`, errText);
    throw new Error(`Supabase SET failed: ${errText}`);
  }

  return 'OK';
}

const dbWrapper = {
  get: async (key: string): Promise<string | null> => {
    if (process.env.USE_SUPABASE === 'true') {
      return supabaseGet(key);
    }
    if (!redisClient) {
      throw new Error('REDIS_URL not configured and USE_SUPABASE is not true.');
    }
    return redisClient.get(key);
  },

  set: async (key: string, value: string): Promise<'OK'> => {
    if (process.env.USE_SUPABASE === 'true') {
      return supabaseSet(key, value);
    }
    if (!redisClient) {
      throw new Error('REDIS_URL not configured and USE_SUPABASE is not true.');
    }
    return redisClient.set(key, value);
  },
};

export default dbWrapper;
