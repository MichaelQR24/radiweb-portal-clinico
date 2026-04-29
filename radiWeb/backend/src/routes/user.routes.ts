import { Router } from 'express';
import { getUsers, createUser, updateUser, toggleUserStatus } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { createUserValidation, updateUserValidation } from '../validations/auth.validation';
import { paginationValidation } from '../validations/patient.validation';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/', paginationValidation, validateRequest, getUsers);
router.post('/', createUserValidation, validateRequest, createUser);
router.put('/:id', updateUserValidation, validateRequest, updateUser);
router.patch('/:id/toggle', toggleUserStatus);

export default router;
