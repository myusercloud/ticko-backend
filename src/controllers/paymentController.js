const paymentService = require('../services/paymentService');

async function createPaymentIntent(req, res, next) {
  try {
    const { eventId, items } = req.body;
    const result = await paymentService.createPaymentForReservation({
      userId: req.user.id,
      eventId,
      items,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function handleStripeWebhook(req, res, next) {
  const sig = req.headers['stripe-signature'];
  try {
    await paymentService.handleStripeWebhook(req.body, sig);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPaymentIntent,
  handleStripeWebhook,
};

