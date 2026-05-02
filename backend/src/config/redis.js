const Redis = require('ioredis');
const config = require('./env');

let redis = null;

/**
 * Get or create Redis client
 * Falls back gracefully if Redis is unavailable
 */
const getRedisClient = () => {
  if (redis) return redis;

  try {
    redis = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.log('⚠️  Redis unavailable - running without cache');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => console.log('✅ Redis connected'));
    redis.on('error', (err) => {
      if (err.code !== 'ECONNREFUSED') {
        console.error('Redis error:', err.message);
      }
    });

    redis.connect().catch(() => {
      console.log('⚠️  Redis not available - caching disabled');
      redis = null;
    });
  } catch (err) {
    console.log('⚠️  Redis initialization failed - running without cache');
    redis = null;
  }

  return redis;
};

module.exports = { getRedisClient };
