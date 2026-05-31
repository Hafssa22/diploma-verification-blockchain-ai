const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const diplomaController = require('../controllers/diplomaController');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const diplomaDataValidators = [
  body('studentName')
    .trim().notEmpty().withMessage('Student name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),

  body('studentId')
    .trim().notEmpty().withMessage('Student ID is required')
    .isAlphanumeric().withMessage('Student ID must be alphanumeric'),

  // ── CIN Marocain : 1-2 lettres + 5-6 chiffres (ex: AB123456, A123456) ──
  body('cin')
    .trim().notEmpty().withMessage('CIN is required')
    .matches(/^[A-Za-z]{1,2}[0-9]{5,6}$/).withMessage('Invalid CIN format (ex: AB123456)'),

  body('degree')
    .trim().notEmpty().withMessage('Degree is required')
    .isIn(['Licence', 'Master', 'Doctorat', 'Ingénieur', 'BTS', 'DUT', 'Baccalauréat', 'Bachelor', 'MBA', 'PhD'])
    .withMessage('Invalid degree type'),

  body('major')
    .trim().notEmpty().withMessage('Major is required')
    .isLength({ max: 100 }).withMessage('Major must be under 100 characters'),

  body('university')
    .trim().notEmpty().withMessage('University is required')
    .isLength({ min: 3, max: 150 }).withMessage('University must be 3-150 characters'),

  body('graduationDate')
    .notEmpty().withMessage('Graduation date is required')
    .isISO8601().withMessage('Date must be YYYY-MM-DD')
    .custom((value) => {
      const date = new Date(value);
      if (date < new Date('1900-01-01') || date > new Date(new Date().setFullYear(new Date().getFullYear() + 1))) {
        throw new Error('Graduation date must be between 1900 and next year');
      }
      return true;
    }),

  body('honors')
    .optional().trim()
    .isIn(['', 'Passable', 'Assez Bien', 'Bien', 'Très Bien', 'Félicitations'])
    .withMessage('Invalid honors value'),
];

const hashParamValidator = [
  param('hash')
    .notEmpty().withMessage('Hash is required')
    .matches(/^(0x)?[a-fA-F0-9]{64}$/).withMessage('Invalid hash format'),
];

// ── Routes ─────────────────────────────────────────────────────────────────────

router.get('/status', diplomaController.getSystemStatus);

router.post('/add', [...diplomaDataValidators], validate, diplomaController.addDiploma);

router.get('/verify/:hash', [...hashParamValidator], validate, diplomaController.verifyDiploma);

router.post('/verify-data', [...diplomaDataValidators], validate, diplomaController.verifyDiplomaByData);

router.get('/:hash/qrcode',
  [...hashParamValidator],
  query('format').optional().isIn(['base64', 'svg', 'image']),
  validate,
  diplomaController.getDiplomaQRCode
);

router.get('/:hash', [...hashParamValidator], validate, diplomaController.getDiploma);

module.exports = router;