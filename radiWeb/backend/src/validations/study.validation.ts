import { body, param } from 'express-validator';

export const createStudyValidation = [
  body('patient_id')
    .isInt({ min: 1 })
    .withMessage('El ID de paciente es requerido y debe ser válido'),
  body('study_type')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El tipo de estudio es requerido (máx. 100 caracteres)'),
  body('body_area')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La región anatómica es requerida (máx. 100 caracteres)'),
  body('referring_doctor')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('El médico referente es requerido (máx. 150 caracteres)'),
  body('clinical_notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Las notas clínicas no pueden superar los 5000 caracteres'),
];

export const updateStudyStatusValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID de estudio inválido'),
  body('status')
    .isIn(['pendiente', 'enviado', 'diagnosticado', 'rechazado'])
    .withMessage('Estado inválido. Valores permitidos: pendiente, enviado, diagnosticado, rechazado'),
];

export const updateStudyValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID de estudio inválido'),
  body('study_type')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El tipo de estudio debe tener entre 2 y 100 caracteres'),
  body('body_area')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La región anatómica debe tener entre 2 y 100 caracteres'),
  body('referring_doctor')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('El médico referente debe tener entre 2 y 150 caracteres'),
  body('clinical_notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Las notas clínicas no pueden superar los 5000 caracteres'),
];

export const createDiagnosisValidation = [
  body('study_id')
    .isInt({ min: 1 })
    .withMessage('El ID de estudio es requerido'),
  body('report_text')
    .trim()
    .isLength({ min: 10 })
    .withMessage('El informe debe tener al menos 10 caracteres'),
  body('conclusion')
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage('La conclusión es requerida (máx. 500 caracteres)'),
];

export const updateDiagnosisValidation = [
  param('id').isInt({ min: 1 }).withMessage('ID de diagnóstico inválido'),
  body('report_text')
    .optional()
    .trim()
    .isLength({ min: 10 })
    .withMessage('El informe debe tener al menos 10 caracteres'),
  body('conclusion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La conclusión no puede superar los 500 caracteres'),
];
