import { Router } from 'express';
import { receiveWhatsApp, receiveZapi, captureFormLead } from '../controllers/webhook.controller';

export const webhookRoutes = Router();

// Evolution API
webhookRoutes.post('/whatsapp', receiveWhatsApp);

// Z-API
webhookRoutes.post('/zapi', receiveZapi);

// Captura de lead via formulário externo
webhookRoutes.post('/form/:token', captureFormLead);
