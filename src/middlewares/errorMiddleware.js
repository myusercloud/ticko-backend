const logger = require('../utils/logger');

function notFound(req, res, next) {
  res.status(404).json({ message: 'Not Found' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', { err });
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    message,
  });
}

module.exports = { notFound, errorHandler };

