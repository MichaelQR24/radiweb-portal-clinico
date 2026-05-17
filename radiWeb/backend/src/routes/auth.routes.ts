import { Router } from 'express';
import { login, logout, getMe, refreshToken } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { loginValidation } from '../validations/auth.validation';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();

router.post('/login', loginValidation, validateRequest, login);
router.post('/logout', authMiddleware, logout);
router.post('/refresh', refreshToken);
router.get('/me', authMiddleware, getMe);

export default router;
