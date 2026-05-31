const { generateDiplomaHash, verifyHash } = require('../utils/hashGenerator');
const blockchainService = require('../services/blockchainService');
const qrService = require('../services/qrService');
const aiService = require('../services/aiService');

async function addDiploma(req, res, next) {
  try {
    const { studentName, studentId, cin, degree, major, university, graduationDate, honors } = req.body;

    const diplomaData = { studentName, studentId, cin, degree, major, university, graduationDate, honors: honors || '' };

    // ── Générer le hash enrichi avec CIN ───────────────────────────────────
    const hashResult = generateDiplomaHash(diplomaData);
    const diplomaHash = hashResult.hash;
    const { emissionId, emissionTimestamp } = hashResult;

    console.log(`[Controller] Hash généré: ${diplomaHash.substring(0, 16)}...`);
    console.log(`[Controller] CIN: ${cin} | EmissionID: ${emissionId}`);

    // ── Analyse IA ─────────────────────────────────────────────────────────
    const aiResult = await aiService.analyzeDiploma(diplomaData);

    if (aiResult.status === 'fraudulent') {
      return res.status(400).json({
        success: false,
        message: 'Diplôme signalé comme frauduleux par l\'analyse IA',
        aiAnalysis: aiResult,
      });
    }

    // ── Stocker sur la blockchain ──────────────────────────────────────────
    const txReceipt = await blockchainService.ajouterDiplome(diplomaHash, diplomaData);

    // ── Générer QR Code ────────────────────────────────────────────────────
    const qrCodeBase64 = await qrService.generateQRCodeBase64(diplomaHash);

    res.status(201).json({
      success: true,
      message: 'Diplôme ajouté avec succès sur la blockchain',
      data: {
        diplomaHash,
        emissionId,        // ← à stocker côté université pour revérification
        emissionTimestamp,
        qrCode: qrCodeBase64,
        verificationUrl: qrService.buildVerificationUrl(diplomaHash),
        transaction: txReceipt,
        aiAnalysis: aiResult,
        diploma: { studentName, studentId, cin, degree, major, university, graduationDate, honors: honors || '' },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function verifyDiploma(req, res, next) {
  try {
    const { hash } = req.params;
    const cleanHash = hash.startsWith('0x') ? hash : `0x${hash}`;

    const isValid = await blockchainService.verifierDiplome(cleanHash);

    if (!isValid) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Diplôme introuvable sur la blockchain — possiblement faux ou falsifié',
        hash: cleanHash,
      });
    }

    const diplomaData = await blockchainService.getDiplome(cleanHash);
    const aiResult = await aiService.analyzeDiploma(diplomaData);
    const qrCodeBase64 = await qrService.generateQRCodeBase64(cleanHash);

    res.status(200).json({
      success: true,
      verified: true,
      message: 'Diplôme vérifié avec succès sur la blockchain',
      data: {
        hash: cleanHash,
        diploma: diplomaData,
        qrCode: qrCodeBase64,
        aiAnalysis: aiResult,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function verifyDiplomaByData(req, res, next) {
  try {
    const { studentName, studentId, cin, degree, major, university, graduationDate, honors, emissionId, emissionTimestamp } = req.body;

    const diplomaData = { studentName, studentId, cin, degree, major, university, graduationDate, honors: honors || '' };

    const hashResult = generateDiplomaHash({ ...diplomaData, emissionId, emissionTimestamp });
    const computedHash = hashResult.hash;

    const isValid = await blockchainService.verifierDiplome(computedHash);

    if (!isValid) {
      return res.status(200).json({
        success: true,
        verified: false,
        message: 'Les données ne correspondent à aucun diplôme enregistré — possiblement falsifié',
        computedHash,
      });
    }

    const aiResult = await aiService.analyzeDiploma(diplomaData);

    res.status(200).json({
      success: true,
      verified: true,
      message: 'Les données correspondent au diplôme enregistré sur la blockchain',
      data: { computedHash, diploma: diplomaData, aiAnalysis: aiResult, verifiedAt: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
}

async function getDiplomaQRCode(req, res, next) {
  try {
    const { hash } = req.params;
    const { format = 'base64' } = req.query;
    const cleanHash = hash.startsWith('0x') ? hash : `0x${hash}`;

    const isValid = await blockchainService.verifierDiplome(cleanHash);
    if (!isValid) {
      return res.status(404).json({ success: false, message: 'Diplôme introuvable' });
    }

    if (format === 'svg') {
      const svg = await qrService.generateQRCodeSVG(cleanHash);
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(svg);
    }

    if (format === 'image') {
      const buffer = await qrService.generateQRCodeBuffer(cleanHash);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="diploma-qr.png"`);
      return res.send(buffer);
    }

    const qrCode = await qrService.generateQRCodeBase64(cleanHash);
    res.status(200).json({
      success: true,
      data: { hash: cleanHash, qrCode, verificationUrl: qrService.buildVerificationUrl(cleanHash) },
    });
  } catch (error) {
    next(error);
  }
}

async function getDiploma(req, res, next) {
  try {
    const { hash } = req.params;
    const cleanHash = hash.startsWith('0x') ? hash : `0x${hash}`;

    const isValid = await blockchainService.verifierDiplome(cleanHash);
    if (!isValid) {
      return res.status(404).json({ success: false, message: 'Diplôme introuvable' });
    }

    const diplomaData = await blockchainService.getDiplome(cleanHash);
    res.status(200).json({ success: true, data: { hash: cleanHash, diploma: diplomaData } });
  } catch (error) {
    next(error);
  }
}

async function getSystemStatus(req, res, next) {
  try {
    const [blockchainStatus, aiAvailable] = await Promise.all([
      blockchainService.testConnection(),
      aiService.checkAIHealth(),
    ]);

    res.status(200).json({
      success: true,
      status: {
        api: 'online',
        blockchain: blockchainStatus,
        ai: { available: aiAvailable, url: process.env.AI_SERVICE_URL || 'http://localhost:5000' },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { addDiploma, verifyDiploma, verifyDiplomaByData, getDiplomaQRCode, getDiploma, getSystemStatus };