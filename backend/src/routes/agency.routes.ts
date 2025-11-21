import { Router } from 'express';
import { getAgency, updateAgency } from '../controllers/agency.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getAgency);
router.put('/', updateAgency);

export default router;
