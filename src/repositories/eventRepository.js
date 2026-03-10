const { prisma } = require('../config/prisma');

async function listEvents({ page = 1, pageSize = 20 }) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    prisma.event.findMany({
      skip,
      take: pageSize,
      where: { isPublished: true },
      orderBy: { startTime: 'asc' },
      include: {
        venue: true,
        ticketTypes: true,
      },
    }),
    prisma.event.count({ where: { isPublished: true } }),
  ]);
  return { items, total, page, pageSize };
}

async function getEventById(id) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      venue: true,
      ticketTypes: true,
    },
  });
}

async function createEvent(data) {
  return prisma.event.create({ data, include: { venue: true, ticketTypes: true } });
}

async function updateEvent(id, data) {
  return prisma.event.update({
    where: { id },
    data,
    include: { venue: true, ticketTypes: true },
  });
}

async function deleteEvent(id) {
  return prisma.event.delete({ where: { id } });
}

async function getOrganizerEventById(id, organizerId) {
  return prisma.event.findFirst({
    where: { id, organizerId },
    include: { venue: true, ticketTypes: true },
  });
}

module.exports = {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getOrganizerEventById,
};

