const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const eventController = require('../controllers/eventController');

const router = express.Router();

router.get('/', eventController.listEvents);
router.get('/:id', eventController.getEvent);

router.post(
  '/',
  authenticate,
  authorize(['ORGANIZER', 'ADMIN']),
  eventController.validateCreateEvent,
  eventController.createEvent
);

router.put(
  '/:id',
  authenticate,
  authorize(['ORGANIZER', 'ADMIN']),
  eventController.updateEvent
);

router.delete(
  '/:id',
  authenticate,
  authorize(['ORGANIZER', 'ADMIN']),
  eventController.deleteEvent
);

module.exports = router;

