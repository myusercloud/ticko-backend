const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimiter = require('./middlewares/rateLimiter');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
const { env } = require('./config/env');
const logger = require('./utils/logger');
const router = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const bodyParser = require('body-parser');
const paymentController = require('./controllers/paymentController');

const app = express();

/* ✅ Health check endpoint */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ticko-api',
    timestamp: new Date().toISOString()
  });
});

app.set('trust proxy', 1);

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL || '*',
    credentials: true,
  })
);

app.use(compression());

// Stripe webhook must receive raw body
app.post(
  '/api/webhooks/stripe',
  bodyParser.raw({ type: 'application/json' }),
  paymentController.handleStripeWebhook
);

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

app.use('/api', rateLimiter);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', router);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

