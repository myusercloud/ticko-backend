const { createWorker, emailQueue } = require('../config/bullmq');
const logger = require('../utils/logger');

function startEmailWorker() {
  createWorker('email', async (job) => {
    const { to, subject } = job.data;
    logger.info(`Pretend sending email to ${to} with subject "${subject}"`);
  });
}

module.exports = { startEmailWorker, emailQueue };

