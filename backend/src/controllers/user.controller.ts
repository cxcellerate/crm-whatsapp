import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getUsers(_req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatar: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
}

export async function updateUser(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, avatar, active } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { name, avatar, active },
    select: { id: true, name: true, email: true, role: true, avatar: true, active: true },
  });

  res.json(user);
}
