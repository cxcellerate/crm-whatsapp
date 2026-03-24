import { Router } from 'express';
import { receiveWhatsApp, captureFormLead } from '../controllers/webhook.controller';

export const webhookRoutes = Router();

// Webhook do WhatsApp (Evolution API)
webhookRoutes.post('/whatsapp', receiveWhatsApp);

// Captura de lead via formulário externo
webhookRoutes.post('/form/:token', captureFormLead);
