import { Router } from 'express';
import { createDiagnosis, getDiagnosisByStudy, updateDiagnosis } from '../controllers/diagnosis.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { createDiagnosisValidation, updateDiagnosisValidation } from '../validations/study.validation';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', requireRole('radiologo'), createDiagnosisValidation, validateRequest, createDiagnosis);
router.get('/:studyId', getDiagnosisByStudy);
router.put('/:id', requireRole('radiologo'), updateDiagnosisValidation, validateRequest, updateDiagnosis);

export default router;
