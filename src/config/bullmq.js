const { Queue, Worker } = require('bullmq');
const { env } = require('./env');
const logger = require('../utils/logger');
const Redis = require('ioredis');

const connection = new Redis(env.REDIS_URL);

const ticketExpirationQueue = new Queue('ticket-expiration', { connection });
const emailQueue = new Queue('email', { connection });

const createWorker = (queueName, processor) =>
  new Worker(queueName, processor, {
    connection,
    autorun: true,
  }).on('failed', (job, err) => {
    logger.error(`Job ${job.id} on ${queueName} failed`, { err });
  });

module.exports = {
  ticketExpirationQueue,
  emailQueue,
  createWorker,
};

