import { Router } from 'express';
import { getSettings, saveSettings, whatsAppStatus, testConnection } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';

export const settingsRoutes = Router();

settingsRoutes.use(authenticate);
settingsRoutes.get('/', getSettings);
settingsRoutes.post('/', saveSettings);
settingsRoutes.get('/whatsapp/status', whatsAppStatus);
settingsRoutes.post('/whatsapp/test', testConnection);
