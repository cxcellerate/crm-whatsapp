import { Router } from 'express';
import { login, register, me } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, loginRules, registerRules } from '../middleware/validate.middleware';

export const authRoutes = Router();

authRoutes.post('/login', validate(loginRules), login);
authRoutes.post('/register', validate(registerRules), register);
authRoutes.get('/me', authenticate, me);
