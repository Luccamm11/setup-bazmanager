import Redis from 'ioredis';

async function testConnection() {
    // Manually parse .env because we don't have dotenv installed
    // Or just use the hardcoded URL for this quick test if we can read it
    const redisUrl = "redis://default:jzE5CPln5lB0CJjbeMEgBguxuiLooUjn@redis-14625.crce278.sa-east-1-2.ec2.cloud.redislabs.com:14625";

    const redis = new Redis(redisUrl);

    try {
        console.log('Connecting to Redis...');
        const res = await redis.ping();
        console.log('Ping response:', res);
        await redis.quit();
        console.log('Disconnected.');
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
}

testConnection();
