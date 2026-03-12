const app = require('./app');
const { env } = require('./config/env');
const logger = require('./utils/logger');

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server listening on port ${PORT}`);
});