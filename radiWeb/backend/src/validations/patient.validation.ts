import { body, param, query } from 'express-validator';

export const createPatientValidation = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('El nombre completo debe tener entre 2 y 150 caracteres'),
  body('dni')
    .trim()
    .matches(/^\d{8}$/)
    .withMessage('El DNI debe tener exactamente 8 dígitos'),
  body('age')
    .isInt({ min: 0, max: 150 })
    .withMessage('La edad debe ser un número entre 0 y 150'),
  body('gender')
    .isIn(['M', 'F', 'O'])
    .withMessage('El género debe ser M, F u O'),
];

export const updatePatientValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID de paciente inválido'),
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('El nombre completo debe tener entre 2 y 150 caracteres'),
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('La edad debe ser un número entre 0 y 150'),
  body('gender')
    .optional()
    .isIn(['M', 'F', 'O'])
    .withMessage('El género debe ser M, F u O'),
];

export const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100'),
  query('search').optional().trim().isLength({ max: 100 }),
];
