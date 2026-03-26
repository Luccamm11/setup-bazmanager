import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('REDIS_URL is not defined in environment variables. Data persistence will fail.');
}

const redis = new Redis(redisUrl || '');

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redis;

