const QRCode = require('qrcode');

async function generateQrCode(data) {
  // returns data URL string
  return QRCode.toDataURL(data);
}

module.exports = { generateQrCode };

