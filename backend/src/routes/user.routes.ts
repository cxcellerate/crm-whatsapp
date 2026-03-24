import { Router } from 'express';
import { getUsers, updateUser } from '../controllers/user.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

export const userRoutes = Router();

userRoutes.use(authenticate);
userRoutes.get('/', getUsers);
userRoutes.put('/:id', updateUser);
userRoutes.delete('/:id', requireAdmin, updateUser);
