import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createComponentVersion,
  getComponentVersions,
  getComponentVersion,
  restoreComponentVersion,
  compareVersions,
} from '../controllers/component-version.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Component versions
router.post('/components/:componentId/versions', createComponentVersion);
router.get('/components/:componentId/versions', getComponentVersions);
router.get('/components/:componentId/versions/compare', compareVersions);
router.get('/components/:componentId/versions/:versionId', getComponentVersion);
router.post('/components/:componentId/versions/:versionId/restore', restoreComponentVersion);

export default router;
