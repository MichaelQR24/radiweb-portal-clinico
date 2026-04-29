import { Router } from 'express';
import { uploadImages, getImagesByStudy, deleteImage } from '../controllers/image.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { uploadMiddleware } from '../middlewares/upload.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/upload', requireRole('tecnologo'), uploadMiddleware.array('files', 10), uploadImages);
router.get('/:studyId', getImagesByStudy);
router.delete('/:id', requireRole('admin'), deleteImage);

export default router;
