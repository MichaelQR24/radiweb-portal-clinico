import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getMyNotifications, markAsRead } from '../controllers/notification.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * GET /api/notifications
 * Devuelve las notificaciones no leídas del usuario logueado.
 */
router.get('/', getMyNotifications);

/**
 * PATCH /api/notifications/:id/read
 * Marca una notificación específica como leída.
 */
router.patch('/:id/read', markAsRead);

export default router;
