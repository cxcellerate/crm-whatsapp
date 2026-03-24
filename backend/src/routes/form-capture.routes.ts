import { Router } from 'express';
import {
  getFormCaptures,
  createFormCapture,
  updateFormCapture,
  deleteFormCapture,
} from '../controllers/form-capture.controller';
import { authenticate } from '../middleware/auth.middleware';

export const formCaptureRoutes = Router();

formCaptureRoutes.use(authenticate);
formCaptureRoutes.get('/', getFormCaptures);
formCaptureRoutes.post('/', createFormCapture);
formCaptureRoutes.patch('/:id', updateFormCapture);
formCaptureRoutes.delete('/:id', deleteFormCapture);
