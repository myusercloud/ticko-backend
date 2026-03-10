const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const ticketController = require('../controllers/ticketController');

const router = express.Router();

router.post('/scan', authenticate, authorize(['ORGANIZER', 'ADMIN']), ticketController.validateScan, ticketController.scan);
router.get('/:code/pdf', authenticate, ticketController.getTicketPdf);

module.exports = router;

