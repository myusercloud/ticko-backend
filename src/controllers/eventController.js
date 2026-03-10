const { z } = require('zod');
const eventService = require('../services/eventService');
const validateRequest = require('../middlewares/validateRequest');

const listEventsSchema = z.object({
  query: z.object({
    page: z.string().transform((v) => parseInt(v, 10)).optional(),
    pageSize: z.string().transform((v) => parseInt(v, 10)).optional(),
  }),
});

const createEventSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    startTime: z.string(),
    endTime: z.string().optional(),
    totalCapacity: z.number().int().positive(),
    isPublished: z.boolean().optional(),
    venueId: z.string(),
    ticketTypes: z
      .array(
        z.object({
          name: z.string().min(1),
          description: z.string().optional(),
          price: z.number().positive(),
          capacity: z.number().int().positive(),
        })
      )
      .min(1),
  }),
});

async function listEvents(req, res, next) {
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize, 10) : 20;
    const result = await eventService.listPublicEvents({ page, pageSize });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getEvent(req, res, next) {
  try {
    const event = await eventService.getEvent(req.params.id);
    res.json(event);
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const event = await eventService.createEvent(req.user.id, req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const event = await eventService.updateEvent(req.user.id, req.params.id, req.body, isAdmin);
    res.json(event);
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    await eventService.deleteEvent(req.user.id, req.params.id, isAdmin);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  validateCreateEvent: validateRequest(createEventSchema),
  validateListEvents: validateRequest(listEventsSchema),
};

