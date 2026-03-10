const { startTicketExpirationWorker } = require('./ticketExpirationJob');
const { startEmailWorker } = require('./emailJob');
const logger = require('../utils/logger');

startTicketExpirationWorker();
startEmailWorker();

logger.info('Workers started');

