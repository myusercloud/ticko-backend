const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get(
  '/events/:eventId/stats',
  authenticate,
  authorize(['ORGANIZER', 'ADMIN']),
  dashboardController.getEventStats
);

module.exports = router;

