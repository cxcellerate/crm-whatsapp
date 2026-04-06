import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export async function getUsers(_req: AuthRequest, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, avatar: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  });
  res.json(users);
}

export async function updateUser(req: AuthRequest, res: Response) {
  const { id } = req.params;

  // Apenas o próprio usuário ou um admin pode atualizar
  if (req.userRole !== 'ADMIN' && req.userId !== id) {
    throw new AppError('Acesso negado', 403);
  }

  // Não-admins não podem alterar o campo 'active'
  const { name, avatar, active } = req.body;
  const data: Record<string, unknown> = { name, avatar };
  if (req.userRole === 'ADMIN' && active !== undefined) {
    data.active = active;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, avatar: true, active: true },
  });

  res.json(user);
}

export async function deleteUser(req: AuthRequest, res: Response) {
  const { id } = req.params;

  // Impede que admin delete a própria conta
  if (req.userId === id) {
    throw new AppError('Você não pode excluir sua própria conta', 400);
  }

  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) throw new AppError('Usuário não encontrado', 404);

  await prisma.user.delete({ where: { id } });
  res.status(204).send();
}
