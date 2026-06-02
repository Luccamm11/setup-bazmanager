import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually parse .env to get REDIS_URL
let redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  try {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('REDIS_URL=')) {
          redisUrl = line.split('REDIS_URL=')[1].trim().replace(/['"]/g, '');
          break;
        }
      }
    }
  } catch (err) {
    console.error('Failed to read .env file:', err);
  }
}

if (!redisUrl) {
  console.error("REDIS_URL not found in process.env or .env file!");
  process.exit(1);
}

const redis = new Redis(redisUrl);

async function main() {
  const key = 'levelup_user_Lucca';
  const data = await redis.get(key);
  if (!data) {
    console.error("No data found in Redis for user Lucca");
    process.exit(1);
  }
  
  const parsed = JSON.parse(data);
  console.log("Current user state loaded. initialLevelsSet is:", parsed.user.initialLevelsSet);
  
  // Set initialLevelsSet to false to allow setting the initial level again
  parsed.user.initialLevelsSet = false;
  
  // Save updated state back to Redis
  await redis.set(key, JSON.stringify(parsed));
  console.log("SUCCESS: Lucca's initial levels setup has been unlocked! The + and - buttons will now be visible again to Jonas.");
  
  redis.disconnect();
}

main().catch(console.error);
