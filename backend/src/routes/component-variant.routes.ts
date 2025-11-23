import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createComponentVariant,
  getComponentVariants,
  getComponentVariant,
  updateComponentVariant,
  deleteComponentVariant,
  duplicateComponentVariant,
} from '../controllers/component-variant.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Component variants
router.post('/components/:componentId/variants', createComponentVariant);
router.get('/components/:componentId/variants', getComponentVariants);
router.get('/components/:componentId/variants/:variantId', getComponentVariant);
router.put('/components/:componentId/variants/:variantId', updateComponentVariant);
router.delete('/components/:componentId/variants/:variantId', deleteComponentVariant);
router.post('/components/:componentId/variants/:variantId/duplicate', duplicateComponentVariant);

export default router;
