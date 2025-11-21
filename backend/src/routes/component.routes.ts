import { Router } from 'express';
import {
  getComponents,
  getComponent,
  createComponent,
  updateComponent,
  deleteComponent,
} from '../controllers/component.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getComponents);
router.post('/', createComponent);
router.get('/:id', getComponent);
router.put('/:id', updateComponent);
router.delete('/:id', deleteComponent);

export default router;
