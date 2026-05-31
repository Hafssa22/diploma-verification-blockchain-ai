const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

function generateDiplomaHash(diplomaData) {

  // ── Données du diplôme normalisées ─────────────────────────────────────
  const normalized = {
    studentName:    diplomaData.studentName.trim().toLowerCase(),
    studentId:      diplomaData.studentId.trim().toLowerCase(),
    cin:            diplomaData.cin.trim().toUpperCase(),         // ← CIN ajouté
    degree:         diplomaData.degree.trim().toLowerCase(),
    major:          diplomaData.major.trim().toLowerCase(),
    university:     diplomaData.university.trim().toLowerCase(),
    graduationDate: diplomaData.graduationDate.trim(),
    honors:         (diplomaData.honors || '').trim().toLowerCase(),
  };

  const diplomaString = JSON.stringify(
    Object.keys(normalized).sort().reduce((acc, key) => {
      acc[key] = normalized[key];
      return acc;
    }, {})
  );

  // ── Couche 1 : Hash des données + CIN ─────────────────────────────────
  const layer1 = crypto
    .createHash('sha256')
    .update(diplomaString)
    .digest('hex');

  // ── Couche 2 : UUID unique d'émission + timestamp ──────────────────────
  const emissionId = diplomaData.emissionId || uuidv4();
  const emissionTimestamp = diplomaData.emissionTimestamp || Date.now().toString();

  const layer2 = crypto
    .createHash('sha256')
    .update(`${emissionId}:${emissionTimestamp}`)
    .digest('hex');

  // ── Couche 3 : HMAC signé avec le secret université ───────────────────
  const secret = process.env.HASH_SECRET || 'default_secret';

  const layer3 = crypto
    .createHmac('sha256', secret)
    .update(`${diplomaData.cin.trim().toUpperCase()}:${layer1}:${layer2}`)
    .digest('hex');

  // ── Hash final ─────────────────────────────────────────────────────────
  const finalHash = crypto
    .createHash('sha256')
    .update(`${layer1}${layer2}${layer3}`)
    .digest('hex');

  return {
    hash: `0x${finalHash}`,
    emissionId,
    emissionTimestamp,
  };
}

function verifyHash(diplomaData, storedHash, emissionId, emissionTimestamp) {
  const result = generateDiplomaHash({
    ...diplomaData,
    emissionId,
    emissionTimestamp,
  });
  return result.hash === storedHash;
}

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = { generateDiplomaHash, verifyHash, sha256 };