import { Router } from 'express';
import { getLogs, getAdminLogs, searchLogs } from '../controllers/logController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.get('/search', authenticateToken, searchLogs);
router.get('/', authenticateToken, getLogs);
router.get('/admin', authenticateToken, getAdminLogs);

export default router;
