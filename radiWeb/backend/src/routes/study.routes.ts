import { Router } from 'express';
import { getStudies, getStudyById, createStudy, updateStudyStatus, getStudyStats, updateStudy, deleteStudy } from '../controllers/study.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { createStudyValidation, updateStudyStatusValidation, updateStudyValidation } from '../validations/study.validation';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();

router.use(authMiddleware);

// IMPORTANTE: La ruta /stats/today debe ir ANTES de /:id para evitar conflictos
router.get('/stats/today', getStudyStats);
router.get('/', getStudies);
router.get('/:id', getStudyById);
router.post('/', requireRole('tecnologo'), createStudyValidation, validateRequest, createStudy);
router.put('/:id', requireRole('tecnologo', 'admin'), updateStudyValidation, validateRequest, updateStudy);
router.patch('/:id/status', requireRole('tecnologo', 'radiologo', 'admin'), updateStudyStatusValidation, validateRequest, updateStudyStatus);
router.delete('/:id', requireRole('tecnologo', 'admin'), deleteStudy);

export default router;
