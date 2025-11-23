import { Router } from 'express';
import {
  exportPageACF,
  exportProjectACF,
  exportPageGraphQL,
  exportProjectGraphQL,
  exportProjectComplete,
} from '../controllers/export.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ACF exports
router.get('/pages/:pageId/acf', exportPageACF);
router.get('/projects/:projectId/acf', exportProjectACF);

// GraphQL exports
router.get('/pages/:pageId/graphql', exportPageGraphQL);
router.get('/projects/:projectId/graphql', exportProjectGraphQL);

// Complete project export
router.get('/projects/:projectId/complete', exportProjectComplete);

export default router;
