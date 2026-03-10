const { stripe } = require('../config/stripe');
const { env } = require('../config/env');
const ticketService = require('./ticketService');
const ticketRepository = require('../repositories/ticketRepository');
const orderRepository = require('../repositories/orderRepository');
const ApiError = require('../utils/ApiError');
const { prisma } = require('../config/prisma');

async function createPaymentForReservation({ userId, eventId, items }) {
  const { order, totalAmount } = await ticketService.reserveTickets({
    userId,
    eventId,
    items,
  });

  const amountInCents = Math.round(Number(totalAmount) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    metadata: {
      orderId: order.id,
      userId,
      eventId,
    },
  });

  await orderRepository.attachPaymentIntent(order.id, paymentIntent.id);

  return { orderId: order.id, clientSecret: paymentIntent.client_secret };
}

async function handleStripeWebhook(rawBody, sig) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new ApiError(400, `Webhook Error: ${err.message}`);
  }

  const data = event.data.object;

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntentId = data.id;
    const order = await orderRepository.findByPaymentIntentId(paymentIntentId);
    if (!order) return;

    await prisma.payment.create({
      data: {
        stripePaymentId: paymentIntentId,
        amount: data.amount_received / 100,
        currency: data.currency,
        status: 'SUCCEEDED',
        orderId: order.id,
        rawPayload: data,
      },
    });

    await ticketRepository.markTicketsSoldForOrder(order.id, order.userId);
    // generate QR + PDFs and queue email in background
    await ticketService.generateTicketArtifacts(order.id);
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntentId = data.id;
    const order = await orderRepository.findByPaymentIntentId(paymentIntentId);
    if (!order) return;

    await prisma.payment.create({
      data: {
        stripePaymentId: paymentIntentId,
        amount: data.amount / 100,
        currency: data.currency,
        status: 'FAILED',
        orderId: order.id,
        rawPayload: data,
      },
    });

    await ticketRepository.releaseReservedTicketsForOrder(order.id);
  }

  if (event.type === 'payment_intent.canceled') {
    const paymentIntentId = data.id;
    const order = await orderRepository.findByPaymentIntentId(paymentIntentId);
    if (!order) return;

    await prisma.payment.create({
      data: {
        stripePaymentId: paymentIntentId,
        amount: data.amount / 100,
        currency: data.currency,
        status: 'CANCELED',
        orderId: order.id,
        rawPayload: data,
      },
    });

    await ticketRepository.releaseReservedTicketsForOrder(order.id);
  }
}

module.exports = {
  createPaymentForReservation,
  handleStripeWebhook,
};

