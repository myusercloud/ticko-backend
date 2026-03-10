const PDFDocument = require('pdfkit');

function generateTicketPdf({ ticket, event, attendee, qrCodeData }) {
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);

    doc.fontSize(20).text('Ticko - Event Ticket', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`Event: ${event.name}`);
    doc.text(`Date: ${event.startTime.toISOString()}`);
    doc.text(`Venue: ${event.venue?.name || ''}`);
    doc.moveDown();

    doc.text(`Attendee: ${attendee.name} (${attendee.email})`);
    doc.text(`Ticket Code: ${ticket.uniqueCode}`);
    doc.text(`Ticket Type: ${ticket.ticketType.name}`);
    doc.moveDown();

    if (qrCodeData) {
      const base64Data = qrCodeData.replace(/^data:image\/\w+;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');
      doc.image(qrBuffer, { fit: [200, 200], align: 'center' });
    }

    doc.end();
  });
}

module.exports = { generateTicketPdf };

