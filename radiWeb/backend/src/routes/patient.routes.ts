import { Router } from 'express';
import { getPatients, getPatientById, createPatient, updatePatient } from '../controllers/patient.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { createPatientValidation, updatePatientValidation, paginationValidation } from '../validations/patient.validation';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', paginationValidation, validateRequest, getPatients);
router.get('/:id', getPatientById);
router.post('/', requireRole('tecnologo', 'admin'), createPatientValidation, validateRequest, createPatient);
router.put('/:id', requireRole('tecnologo', 'admin'), updatePatientValidation, validateRequest, updatePatient);

export default router;
