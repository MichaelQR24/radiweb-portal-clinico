import { Router } from 'express';
import { login, logout, getMe, refreshToken } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { loginValidation } from '../validations/auth.validation';
import { validateRequest } from '../middlewares/validation.middleware';
import rateLimit from 'express-rate-limit';

// Limitador de intentos de login (configurado laxo para desarrollo)
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 1000, // 1000 intentos permitidos
  message: { success: false, message: 'Demasiados intentos de inicio de sesión. Intente nuevamente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/login', loginLimiter, loginValidation, validateRequest, login);
router.post('/logout', authMiddleware, logout);
router.post('/refresh', refreshToken);
router.get('/me', authMiddleware, getMe);

export default router;
