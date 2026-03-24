import { Router } from 'express';
import { getMessages, sendMessage } from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

export const messageRoutes = Router();

messageRoutes.use(authenticate);
messageRoutes.get('/:leadId', getMessages);
messageRoutes.post('/:leadId/send', sendMessage);
