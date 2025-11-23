import { Router } from 'express';
import {
  getPages,
  getPage,
  getPageComponents,
  createPage,
  updatePage,
  deletePage,
  addComponentToPage,
  removeComponentFromPage,
  updatePageComponent,
  reorderPageComponents,
} from '../controllers/page.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Pages CRUD
router.get('/', getPages);
router.post('/', createPage);
router.get('/:id', getPage);
router.put('/:id', updatePage);
router.delete('/:id', deletePage);

// Page components management
router.get('/:id/components', getPageComponents);
router.post('/:id/components', addComponentToPage);
router.delete('/:id/components/:componentId', removeComponentFromPage);
router.put('/:id/components/:componentId', updatePageComponent);
router.put('/:id/components/reorder', reorderPageComponents);

export default router;
