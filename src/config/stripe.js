const Stripe = require('stripe');
const { env } = require('./env');

const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2023-10-16',
});

module.exports = { stripe };

