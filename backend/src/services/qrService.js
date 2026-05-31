const QRCode = require('qrcode');
require('dotenv').config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Generate a QR code as a base64 data URL (embeddable in <img src="...">)
 * @param {string} diplomaHash - The diploma hash to encode
 * @param {Object} options - QR code options
 * @returns {Promise<string>} Base64 data URL
 */
async function generateQRCodeBase64(diplomaHash, options = {}) {
  const verificationUrl = buildVerificationUrl(diplomaHash);

  const qrOptions = {
    errorCorrectionLevel: 'H', // High - can reconstruct 30% of data if damaged
    type: 'image/png',
    quality: 0.92,
    margin: 2,
    color: {
      dark: options.darkColor || '#1a1a2e',   // QR dots color
      light: options.lightColor || '#ffffff', // Background color
    },
    width: options.width || 300,
  };

  try {
    const dataUrl = await QRCode.toDataURL(verificationUrl, qrOptions);
    console.log(`[QR] Generated QR code for hash: ${diplomaHash.substring(0, 12)}...`);
    return dataUrl;
  } catch (error) {
    console.error('[QR] Error generating QR code:', error.message);
    throw new Error(`QR code generation failed: ${error.message}`);
  }
}

/**
 * Generate a QR code as an SVG string
 * @param {string} diplomaHash
 * @returns {Promise<string>} SVG string
 */
async function generateQRCodeSVG(diplomaHash) {
  const verificationUrl = buildVerificationUrl(diplomaHash);

  try {
    const svg = await QRCode.toString(verificationUrl, {
      type: 'svg',
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#1a1a2e',
        light: '#ffffff',
      },
    });
    return svg;
  } catch (error) {
    throw new Error(`SVG QR code generation failed: ${error.message}`);
  }
}

/**
 * Generate a QR code as a Buffer (for saving to file or sending as binary)
 * @param {string} diplomaHash
 * @returns {Promise<Buffer>}
 */
async function generateQRCodeBuffer(diplomaHash) {
  const verificationUrl = buildVerificationUrl(diplomaHash);

  try {
    const buffer = await QRCode.toBuffer(verificationUrl, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
    });
    return buffer;
  } catch (error) {
    throw new Error(`QR buffer generation failed: ${error.message}`);
  }
}

/**
 * Build the verification URL that the QR code will point to
 * @param {string} diplomaHash
 * @returns {string} Full URL
 */
function buildVerificationUrl(diplomaHash) {
  return `${FRONTEND_URL}/verify/${diplomaHash}`;
}

module.exports = {
  generateQRCodeBase64,
  generateQRCodeSVG,
  generateQRCodeBuffer,
  buildVerificationUrl,
};
