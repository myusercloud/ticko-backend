const { createWorker } = require('../config/bullmq');
const ticketRepository = require('../repositories/ticketRepository');
const { prisma } = require('../config/prisma');

function startTicketExpirationWorker() {
  createWorker('ticket-expiration', async (job) => {
    const { orderId } = job.data;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== 'PENDING') {
      return;
    }
    await ticketRepository.releaseReservedTicketsForOrder(orderId);
  });
}

module.exports = { startTicketExpirationWorker };

