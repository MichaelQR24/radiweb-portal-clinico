import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { getAuditLogs } from '../services/audit.service';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { DEFAULT_PAGE, DEFAULT_LIMIT } from '../utils/constants';

const router = Router();

router.use(authMiddleware, requireRole('admin'));

/**
 * GET /api/audit
 * Obtiene el registro de auditoría paginado. Solo administrador.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query['page'] as string ?? `${DEFAULT_PAGE}`, 10);
    const limit = parseInt(req.query['limit'] as string ?? `${DEFAULT_LIMIT}`, 10);
    const filters = {
      userId: req.query['userId'] ? parseInt(req.query['userId'] as string, 10) : undefined,
      entity: req.query['entity'] as string | undefined,
      dateFrom: req.query['dateFrom'] as string | undefined,
      dateTo: req.query['dateTo'] as string | undefined,
    };

    const result = await getAuditLogs(page, limit, filters);
    sendSuccess(res, { ...result, page, limit }, 'Log de auditoría obtenido');
  } catch {
    sendError(res, 'Error obteniendo log de auditoría', 500);
  }
});

export default router;
