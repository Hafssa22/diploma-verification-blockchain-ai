const request = require('supertest');
const app = require('../../src/app');
 
// ─── Mock External Services ───────────────────────────────────────────────────
jest.mock('../../src/services/blockchainService', () => ({
  ajouterDiplome: jest.fn().mockResolvedValue({
    transactionHash: '0xabc123',
    blockNumber: 42,
    gasUsed: '50000',
    status: 'success',
  }),
  verifierDiplome: jest.fn().mockResolvedValue(true),
  getDiplome: jest.fn().mockResolvedValue({
    studentId: 'STU001',
    studentName: 'Ahmed Benali',
    cin: 'AB123456',
    degree: 'Master',
    university: 'Université Mohammed V',
    graduationDate: '2024-06-15',
    isValid: true,
  }),
  testConnection: jest.fn().mockResolvedValue({
    connected: true,
    networkName: 'ganache',
    chainId: '1337',
    latestBlock: 10,
  }),
}));
 
jest.mock('../../src/services/aiService', () => ({
  analyzeDiploma: jest.fn().mockResolvedValue({
    status: 'valid',
    score: 0.95,
    details: [],
    aiAvailable: true,
  }),
  checkAIHealth: jest.fn().mockResolvedValue(true),
}));
 
// ─── Test Data (avec CIN) ─────────────────────────────────────────────────────
const validDiploma = {
  studentName: 'Ahmed Benali',
  studentId:   'STU001',
  cin:         'AB123456',
  degree:      'Master',
  major:       'Informatique',
  university:  'Université Mohammed V',
  graduationDate: '2024-06-15',
  honors:      'Très Bien',
};
 
const VALID_HASH = '0x' + 'a'.repeat(64);
 
// ─── Tests ────────────────────────────────────────────────────────────────────
 
describe('Health Check', () => {
  test('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('running');
  });
});
 
describe('POST /api/diplomas/add', () => {
  test('should add a valid diploma and return hash + QR code', async () => {
    const res = await request(app)
      .post('/api/diplomas/add')
      .send(validDiploma);
 
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.diplomaHash).toBeDefined();
    expect(res.body.data.emissionId).toBeDefined();
    expect(res.body.data.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(res.body.data.verificationUrl).toBeDefined();
    expect(res.body.data.transaction.transactionHash).toBe('0xabc123');
  });
 
  test('should fail when CIN is missing', async () => {
    const { cin, ...withoutCin } = validDiploma;
    const res = await request(app)
      .post('/api/diplomas/add')
      .send(withoutCin);
 
    expect(res.statusCode).toBe(422);
    expect(res.body.errors.some(e => e.field === 'cin')).toBe(true);
  });
 
  test('should fail with invalid CIN format', async () => {
    const res = await request(app)
      .post('/api/diplomas/add')
      .send({ ...validDiploma, cin: '12345678' }); // pas de lettres
 
    expect(res.statusCode).toBe(422);
    expect(res.body.errors.some(e => e.field === 'cin')).toBe(true);
  });
 
  test('should fail with missing required fields', async () => {
    const res = await request(app)
      .post('/api/diplomas/add')
      .send({ studentName: 'Ahmed' });
 
    expect(res.statusCode).toBe(422);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });
 
  test('should reject invalid graduation date', async () => {
    const res = await request(app)
      .post('/api/diplomas/add')
      .send({ ...validDiploma, graduationDate: 'not-a-date' });
 
    expect(res.statusCode).toBe(422);
    expect(res.body.errors.some(e => e.field === 'graduationDate')).toBe(true);
  });
 
  test('should reject invalid degree type', async () => {
    const res = await request(app)
      .post('/api/diplomas/add')
      .send({ ...validDiploma, degree: 'FakeDegree' });
 
    expect(res.statusCode).toBe(422);
  });
});
 
describe('GET /api/diplomas/verify/:hash', () => {
  test('should verify a valid hash', async () => {
    const res = await request(app)
      .get(`/api/diplomas/verify/${VALID_HASH}`);
 
    expect(res.statusCode).toBe(200);
    expect(res.body.verified).toBe(true);
    expect(res.body.data.diploma.studentName).toBe('Ahmed Benali');
  });
 
  test('should return 404 for hash not on blockchain', async () => {
    const blockchainService = require('../../src/services/blockchainService');
    blockchainService.verifierDiplome.mockResolvedValueOnce(false);
 
    const res = await request(app)
      .get(`/api/diplomas/verify/${VALID_HASH}`);
 
    expect(res.statusCode).toBe(404);
    expect(res.body.verified).toBe(false);
  });
 
  test('should reject malformed hash', async () => {
    const res = await request(app)
      .get('/api/diplomas/verify/not-a-hash');
 
    expect(res.statusCode).toBe(422);
  });
});
 
describe('POST /api/diplomas/verify-data', () => {
  test('should verify diploma by raw data including CIN', async () => {
    const res = await request(app)
      .post('/api/diplomas/verify-data')
      .send(validDiploma);
 
    expect(res.statusCode).toBe(200);
    expect(res.body.verified).toBe(true);
  });
});
 
describe('GET /api/diplomas/:hash/qrcode', () => {
  test('should return base64 QR code', async () => {
    const res = await request(app)
      .get(`/api/diplomas/${VALID_HASH}/qrcode`);
 
    expect(res.statusCode).toBe(200);
    expect(res.body.data.qrCode).toMatch(/^data:image\/png;base64,/);
  });
 
  test('should return SVG when format=svg', async () => {
    const res = await request(app)
      .get(`/api/diplomas/${VALID_HASH}/qrcode?format=svg`);
 
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('svg');
  });
});
 
describe('GET /api/diplomas/status', () => {
  test('should return system status', async () => {
    const res = await request(app).get('/api/diplomas/status');
    expect(res.statusCode).toBe(200);
    expect(res.body.status.api).toBe('online');
    expect(res.body.status.blockchain.connected).toBe(true);
  });
});
 
describe('Hash Utility avec CIN', () => {
  const { generateDiplomaHash, verifyHash } = require('../../src/utils/hashGenerator');
 
  test('hash doit être un objet avec hash + emissionId', () => {
    const result = generateDiplomaHash(validDiploma);
    expect(result.hash).toBeDefined();
    expect(result.emissionId).toBeDefined();
    expect(result.emissionTimestamp).toBeDefined();
  });
 
  test('hash doit commencer par 0x', () => {
    const result = generateDiplomaHash(validDiploma);
    expect(result.hash.startsWith('0x')).toBe(true);
  });
 
  test('meme données + meme emissionId = meme hash', () => {
    const result1 = generateDiplomaHash(validDiploma);
    const result2 = generateDiplomaHash({
      ...validDiploma,
      emissionId: result1.emissionId,
      emissionTimestamp: result1.emissionTimestamp,
    });
    expect(result1.hash).toBe(result2.hash);
  });
 
  test('CIN différent = hash différent', () => {
    const result1 = generateDiplomaHash({ ...validDiploma, emissionId: 'fixed', emissionTimestamp: '1000' });
    const result2 = generateDiplomaHash({ ...validDiploma, cin: 'ZZ999999', emissionId: 'fixed', emissionTimestamp: '1000' });
    expect(result1.hash).not.toBe(result2.hash);
  });
 
  test('nom falsifié = hash différent', () => {
    const result1 = generateDiplomaHash({ ...validDiploma, emissionId: 'fixed', emissionTimestamp: '1000' });
    const result2 = generateDiplomaHash({ ...validDiploma, studentName: 'Hacker', emissionId: 'fixed', emissionTimestamp: '1000' });
    expect(result1.hash).not.toBe(result2.hash);
  });
 
  test('verifyHash retourne true pour données correctes', () => {
    const result = generateDiplomaHash(validDiploma);
    const isValid = verifyHash(validDiploma, result.hash, result.emissionId, result.emissionTimestamp);
    expect(isValid).toBe(true);
  });
 
  test('verifyHash retourne false si CIN falsifié', () => {
    const result = generateDiplomaHash(validDiploma);
    const isValid = verifyHash(
      { ...validDiploma, cin: 'ZZ000000' },
      result.hash,
      result.emissionId,
      result.emissionTimestamp
    );
    expect(isValid).toBe(false);
  });
});