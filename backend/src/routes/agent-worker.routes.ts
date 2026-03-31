import { Router } from 'express';
import { agentWorkerHandler } from '../controllers/agent-worker.controller';

const router = Router();

router.post('/', agentWorkerHandler);

export const agentWorkerRoutes = router;
