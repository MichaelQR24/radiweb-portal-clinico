import { body } from 'express-validator';

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('El email debe ser una dirección válida')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];

export const createUserValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .isEmail()
    .withMessage('El email debe ser una dirección válida')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  body('role')
    .isIn(['tecnologo', 'radiologo', 'admin'])
    .withMessage('El rol debe ser: tecnologo, radiologo o admin'),
];

export const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('El email debe ser una dirección válida')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['tecnologo', 'radiologo', 'admin'])
    .withMessage('El rol debe ser: tecnologo, radiologo o admin'),
];
