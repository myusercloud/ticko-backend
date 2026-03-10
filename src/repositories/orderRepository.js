const { prisma } = require('../config/prisma');

async function attachPaymentIntent(orderId, paymentIntentId) {
  return prisma.order.update({
    where: { id: orderId },
    data: { paymentIntentId },
  });
}

async function findByPaymentIntentId(paymentIntentId) {
  return prisma.order.findUnique({
    where: { paymentIntentId },
    include: { user: true, items: true, event: { include: { venue: true } } },
  });
}

async function getOrderWithTickets(orderId) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      event: { include: { venue: true } },
      items: {
        include: {
          ticketType: true,
          tickets: true,
        },
      },
    },
  });
}

module.exports = {
  attachPaymentIntent,
  findByPaymentIntentId,
  getOrderWithTickets,
};

