import { Router } from 'express';
import {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  moveLead,
} from '../controllers/lead.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, createLeadRules } from '../middleware/validate.middleware';

export const leadRoutes = Router();

leadRoutes.use(authenticate);
leadRoutes.get('/', getLeads);
leadRoutes.get('/:id', getLead);
leadRoutes.post('/', validate(createLeadRules), createLead);
leadRoutes.put('/:id', updateLead);
leadRoutes.delete('/:id', deleteLead);
leadRoutes.patch('/:id/move', moveLead);
