const { redis } = require('../config/redis');

async function getCached(key) {
  const value = await redis.get(key);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function setCached(key, value, ttlSeconds = 60) {
  const serialized = JSON.stringify(value);
  if (ttlSeconds > 0) {
    await redis.set(key, serialized, 'EX', ttlSeconds);
  } else {
    await redis.set(key, serialized);
  }
}

async function delCached(patternOrKey) {
  if (!patternOrKey.includes('*')) {
    await redis.del(patternOrKey);
    return;
  }
  const keys = await redis.keys(patternOrKey);
  if (keys.length) {
    await redis.del(keys);
  }
}

module.exports = { getCached, setCached, delCached };

