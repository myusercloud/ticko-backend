const { prisma } = require('../config/prisma');

async function reserveTicketsForOrder({ userId, eventId, items, reservationMinutes }) {
  const now = new Date();
  const reservedUntil = new Date(now.getTime() + reservationMinutes * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    let totalAmount = 0;
    const createdItems = [];

    for (const item of items) {
      const ticketType = await tx.ticketType.findFirst({
        where: { id: item.ticketTypeId, eventId },
      });
      if (!ticketType) {
        throw new Error('Invalid ticket type');
      }

      const tickets = await tx.ticket.findMany({
        where: { ticketTypeId: ticketType.id, status: 'AVAILABLE' },
        take: item.quantity,
        orderBy: { createdAt: 'asc' },
      });

      if (tickets.length < item.quantity) {
        throw new Error('Not enough tickets available');
      }

      const unitPrice = ticketType.price;
      const totalPrice = unitPrice.mul(item.quantity);
      totalAmount += Number(totalPrice);

      createdItems.push({
        ticketType,
        tickets,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });
    }

    const order = await tx.order.create({
      data: {
        userId,
        eventId,
        totalAmount,
        status: 'PENDING',
        items: {
          create: createdItems.map((i) => ({
            ticketTypeId: i.ticketType.id,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
          })),
        },
      },
      include: { items: true },
    });

    for (const created of createdItems) {
      const orderItem = order.items.find((oi) => oi.ticketTypeId === created.ticketType.id);
      const ticketIds = created.tickets.map((t) => t.id);
      await tx.ticket.updateMany({
        where: { id: { in: ticketIds } },
        data: {
          status: 'RESERVED',
          reservedUntil,
          orderItemId: orderItem.id,
        },
      });
    }

    return { order, reservedUntil, totalAmount };
  });
}

async function releaseReservedTicketsForOrder(orderId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    const orderItemIds = order.items.map((i) => i.id);
    await tx.ticket.updateMany({
      where: {
        orderItemId: { in: orderItemIds },
        status: 'RESERVED',
      },
      data: {
        status: 'AVAILABLE',
        reservedUntil: null,
        orderItemId: null,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });
  });
}

async function markTicketsSoldForOrder(orderId, userId) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;

    const orderItemIds = order.items.map((i) => i.id);

    await tx.ticket.updateMany({
      where: {
        orderItemId: { in: orderItemIds },
        status: 'RESERVED',
      },
      data: {
        status: 'SOLD',
        attendeeId: userId,
      },
    });

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
    });
  });
}

async function findTicketByCode(code) {
  return prisma.ticket.findUnique({
    where: { uniqueCode: code },
    include: {
      ticketType: {
        include: {
          event: true,
        },
      },
      attendee: true,
      ticketScans: true,
    },
  });
}

module.exports = {
  reserveTicketsForOrder,
  releaseReservedTicketsForOrder,
  markTicketsSoldForOrder,
  findTicketByCode,
};

