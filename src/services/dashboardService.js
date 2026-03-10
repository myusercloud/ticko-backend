const dashboardRepository = require('../repositories/dashboardRepository');
const ApiError = require('../utils/ApiError');
const { prisma } = require('../config/prisma');

async function getOrganizerEventStats(organizerId, eventId, isAdmin = false) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }
  if (!isAdmin && event.organizerId !== organizerId) {
    throw new ApiError(403, 'Forbidden');
  }
  const stats = await dashboardRepository.getEventStats(eventId);
  return { eventId, ...stats };
}

module.exports = {
  getOrganizerEventStats,
};

