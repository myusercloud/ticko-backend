const Redis = require('ioredis');
const { env } = require('./env');
const logger = require('../utils/logger');

const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => logger.info('Connected to Redis'));
redis.on('error', (err) => logger.error('Redis error', { err }));

module.exports = { redis };

