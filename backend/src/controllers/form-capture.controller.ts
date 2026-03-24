import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

export async function getFormCaptures(_req: AuthRequest, res: Response) {
  const forms = await prisma.formCapture.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(forms);
}

export async function createFormCapture(req: AuthRequest, res: Response) {
  const { name, stageId, assignTo } = req.body;
  const form = await prisma.formCapture.create({
    data: { name, stageId: stageId || undefined, assignTo: assignTo || undefined },
  });
  res.status(201).json(form);
}

export async function updateFormCapture(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const exists = await prisma.formCapture.findUnique({ where: { id } });
  if (!exists) throw new AppError('Formulário não encontrado', 404);

  const form = await prisma.formCapture.update({ where: { id }, data: req.body });
  res.json(form);
}

export async function deleteFormCapture(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.formCapture.delete({ where: { id } });
  res.status(204).send();
}
