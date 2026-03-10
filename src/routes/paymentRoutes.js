const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/intent', authenticate, paymentController.createPaymentIntent);

module.exports = router;

