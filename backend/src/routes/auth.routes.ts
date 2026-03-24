import { Router } from 'express';
import { login, register, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/register', register);
authRoutes.get('/me', authenticate, me);
