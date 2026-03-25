import { Router } from 'express';
import { getSessions, getSession, deleteSession, getConfig, saveConfig } from '../controllers/ai-agent.controller';
import { authenticate } from '../middleware/auth.middleware';

export const aiAgentRoutes = Router();

aiAgentRoutes.use(authenticate);
aiAgentRoutes.get('/sessions', getSessions);
aiAgentRoutes.get('/sessions/:id', getSession);
aiAgentRoutes.delete('/sessions/:id', deleteSession);
aiAgentRoutes.get('/config', getConfig);
aiAgentRoutes.post('/config', saveConfig);
