const { ticketExpirationQueue } = require('../config/bullmq');
const ticketRepository = require('../repositories/ticketRepository');
const { acquireLock, releaseLock } = require('../utils/lock');
const ApiError = require('../utils/ApiError');
const { prisma } = require('../config/prisma');
const { generateQrCode } = require('../utils/qr');
const { generateTicketPdf } = require('../utils/pdf');

const RESERVATION_MINUTES = 10;

async function reserveTickets({ userId, eventId, items }) {
  if (!items || !items.length) {
    throw new ApiError(400, 'No items provided');
  }

  const lockKey = `lock:event:${eventId}`;
  const lock = await acquireLock(lockKey, 5000);
  if (!lock) {
    throw new ApiError(409, 'Another reservation is in progress, please retry');
  }

  try {
    const { order, reservedUntil, totalAmount } = await ticketRepository.reserveTicketsForOrder({
      userId,
      eventId,
      items,
      reservationMinutes: RESERVATION_MINUTES,
    });

    // enqueue expiration job
    await ticketExpirationQueue.add(
      'expire',
      { orderId: order.id },
      { delay: RESERVATION_MINUTES * 60 * 1000 }
    );

    return { order, reservedUntil, totalAmount };
  } catch (err) {
    throw new ApiError(400, err.message || 'Unable to reserve tickets');
  } finally {
    await releaseLock(lock.key, lock.token);
  }
}

async function generateTicketArtifacts(orderId) {
  const order = await prisma.order.findUnique({
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
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const artifacts = [];

  for (const item of order.items) {
    for (const ticket of item.tickets) {
      const payload = JSON.stringify({
        code: ticket.uniqueCode,
        eventId: order.eventId,
      });
      const qrCodeData = await generateQrCode(payload);

      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { qrCodeData },
      });

      const pdfBuffer = await generateTicketPdf({
        ticket: { ...ticket, ticketType: item.ticketType },
        event: order.event,
        attendee: order.user,
        qrCodeData,
      });

      artifacts.push({
        ticketCode: ticket.uniqueCode,
        qrCodeData,
        pdfBuffer,
      });
    }
  }

  return artifacts;
}

async function scanTicket({ code, eventId, location }) {
  const ticket = await ticketRepository.findTicketByCode(code);
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }

  if (ticket.ticketType.eventId !== eventId) {
    throw new ApiError(400, 'Ticket does not belong to this event');
  }

  if (ticket.status === 'USED') {
    throw new ApiError(400, 'Ticket already used');
  }

  if (ticket.status !== 'SOLD' && ticket.status !== 'USED') {
    throw new ApiError(400, 'Ticket not valid for entry');
  }

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: 'USED',
      ticketScans: {
        create: {
          eventId,
          location,
        },
      },
    },
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

  return updated;
}

async function getTicketPdfByCode(code) {
  const ticket = await prisma.ticket.findUnique({
    where: { uniqueCode: code },
    include: {
      ticketType: {
        include: {
          event: { include: { venue: true } },
        },
      },
      attendee: true,
    },
  });
  if (!ticket) {
    throw new ApiError(404, 'Ticket not found');
  }
  const payload = JSON.stringify({
    code: ticket.uniqueCode,
    eventId: ticket.ticketType.eventId,
  });
  const qrCodeData = ticket.qrCodeData || (await generateQrCode(payload));

  const pdfBuffer = await generateTicketPdf({
    ticket,
    event: ticket.ticketType.event,
    attendee: ticket.attendee,
    qrCodeData,
  });
  return pdfBuffer;
}

module.exports = {
  reserveTickets,
  generateTicketArtifacts,
  scanTicket,
  getTicketPdfByCode,
};

