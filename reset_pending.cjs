const Redis = require('ioredis');

const redisUrl = "redis://default:jzE5CPln5lB0CJjbeMEgBguxuiLooUjn@redis-14625.crce278.sa-east-1-2.ec2.cloud.redislabs.com:14625";
const redis = new Redis(redisUrl);

async function main() {
  console.log("Connecting to Redis...");
  try {
    const keys = await redis.keys("levelup_user_*");
    console.log(`Found ${keys.length} user keys in Redis.`);
    
    for (const key of keys) {
      const username = key.replace("levelup_user_", "");
      // Skip technicians
      if (username === "Jonas" || username === "Ramon") {
        console.log(`Skipping technician: ${username}`);
        continue;
      }
      
      const rawData = await redis.get(key);
      if (rawData) {
        const data = JSON.parse(rawData);
        if (data.user) {
          data.user.initialLevelsSet = false;
          // Also reset stats to default 1s
          if (data.user.stats) {
            for (const realm in data.user.stats) {
              data.user.stats[realm] = 1;
            }
          }
          data.user.level_overall = 1;
          data.user.rank = "e_rank";
          
          await redis.set(key, JSON.stringify(data));
          console.log(`Reset ${username} to pending (initialLevelsSet = false, stats = 1).`);
        }
      }
    }
    console.log("All members have been set to pending successfully!");
  } catch (error) {
    console.error("Error resetting members in Redis:", error);
  } finally {
    redis.disconnect();
  }
}

main();
