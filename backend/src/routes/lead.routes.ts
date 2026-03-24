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

export const leadRoutes = Router();

leadRoutes.use(authenticate);
leadRoutes.get('/', getLeads);
leadRoutes.get('/:id', getLead);
leadRoutes.post('/', createLead);
leadRoutes.put('/:id', updateLead);
leadRoutes.delete('/:id', deleteLead);
leadRoutes.patch('/:id/move', moveLead);
