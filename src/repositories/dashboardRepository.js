const { prisma } = require('../config/prisma');

async function getEventStats(eventId) {
  const [soldTickets, revenueAgg, attendance, scans] = await Promise.all([
    prisma.ticket.count({
      where: {
        ticketType: { eventId },
        status: { in: ['SOLD', 'USED'] },
      },
    }),
    prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        order: {
          eventId,
        },
        status: 'SUCCEEDED',
      },
    }),
    prisma.ticketScan.count({
      where: { eventId },
    }),
    prisma.ticketScan.groupBy({
      by: ['eventId'],
      _count: { id: true },
      where: { eventId },
    }),
  ]);

  return {
    totalTicketsSold: soldTickets,
    totalRevenue: revenueAgg._sum.amount || 0,
    attendanceCount: attendance,
    scanStats: scans,
  };
}

module.exports = { getEventStats };

