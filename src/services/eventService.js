const eventRepository = require('../repositories/eventRepository');
const { getCached, setCached, delCached } = require('../utils/cache');
const ApiError = require('../utils/ApiError');

async function listPublicEvents({ page, pageSize }) {
  const cacheKey = `events:list:${page}:${pageSize}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const result = await eventRepository.listEvents({ page, pageSize });
  await setCached(cacheKey, result, 60);
  return result;
}

async function getEvent(id) {
  const cacheKey = `events:${id}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const event = await eventRepository.getEventById(id);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }
  await setCached(cacheKey, event, 60);
  return event;
}

async function createEvent(organizerId, data) {
  const payload = {
    name: data.name,
    description: data.description,
    startTime: new Date(data.startTime),
    endTime: data.endTime ? new Date(data.endTime) : null,
    totalCapacity: data.totalCapacity,
    isPublished: data.isPublished ?? false,
    organizerId,
    venueId: data.venueId,
    ticketTypes: {
      create: (data.ticketTypes || []).map((t) => ({
        name: t.name,
        description: t.description,
        price: t.price,
        capacity: t.capacity,
      })),
    },
  };
  const event = await eventRepository.createEvent(payload);
  await delCached('events:list:*');
  return event;
}

async function updateEvent(organizerId, eventId, data, isAdmin = false) {
  const existing = isAdmin
    ? await eventRepository.getEventById(eventId)
    : await eventRepository.getOrganizerEventById(eventId, organizerId);
  if (!existing) {
    throw new ApiError(404, 'Event not found');
  }
  const payload = {
    name: data.name ?? existing.name,
    description: data.description ?? existing.description,
    startTime: data.startTime ? new Date(data.startTime) : existing.startTime,
    endTime: data.endTime ? new Date(data.endTime) : existing.endTime,
    totalCapacity: data.totalCapacity ?? existing.totalCapacity,
    isPublished: data.isPublished ?? existing.isPublished,
  };
  const updated = await eventRepository.updateEvent(eventId, payload);
  await delCached(`events:${eventId}`);
  await delCached('events:list:*');
  return updated;
}

async function deleteEvent(organizerId, eventId, isAdmin = false) {
  const existing = isAdmin
    ? await eventRepository.getEventById(eventId)
    : await eventRepository.getOrganizerEventById(eventId, organizerId);
  if (!existing) {
    throw new ApiError(404, 'Event not found');
  }
  await eventRepository.deleteEvent(eventId);
  await delCached(`events:${eventId}`);
  await delCached('events:list:*');
}

module.exports = {
  listPublicEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
};

