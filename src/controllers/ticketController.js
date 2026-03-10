const { z } = require('zod');
const ticketService = require('../services/ticketService');
const validateRequest = require('../middlewares/validateRequest');

const reserveSchema = z.object({
  body: z.object({
    eventId: z.string(),
    items: z
      .array(
        z.object({
          ticketTypeId: z.string(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1),
  }),
});

const scanSchema = z.object({
  body: z.object({
    code: z.string().min(1),
    eventId: z.string().min(1),
    location: z.string().optional(),
  }),
});

async function scan(req, res, next) {
  try {
    const ticket = await ticketService.scanTicket(req.body);
    res.json(ticket);
  } catch (err) {
    next(err);
  }
}

async function getTicketPdf(req, res, next) {
  try {
    const buffer = await ticketService.getTicketPdfByCode(req.params.code);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${req.params.code}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  scan,
  getTicketPdf,
  validateScan: validateRequest(scanSchema),
};

