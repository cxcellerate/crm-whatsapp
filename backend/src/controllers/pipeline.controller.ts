import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

function validateName(name: unknown, field = 'Nome'): string {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new AppError(`${field} é obrigatório`, 400);
  }
  if (name.trim().length > 100) {
    throw new AppError(`${field} deve ter no máximo 100 caracteres`, 400);
  }
  return name.trim();
}

export async function getPipelines(_req: AuthRequest, res: Response) {
  const pipelines = await prisma.pipeline.findMany({
    include: {
      stages: {
        include: { _count: { select: { leads: true } } },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });
  res.json(pipelines);
}

export async function createPipeline(req: AuthRequest, res: Response) {
  const name = validateName(req.body.name, 'Nome do pipeline');
  const { color } = req.body;
  const pipeline = await prisma.pipeline.create({ data: { name, color } });
  res.status(201).json(pipeline);
}

export async function updatePipeline(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { name, color, order } = req.body;
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = validateName(name, 'Nome do pipeline');
  if (color !== undefined) data.color = color;
  if (order !== undefined) data.order = order;
  const pipeline = await prisma.pipeline.update({ where: { id }, data });
  res.json(pipeline);
}

export async function deletePipeline(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.pipeline.delete({ where: { id } });
  res.status(204).send();
}

export async function createStage(req: AuthRequest, res: Response) {
  const { id: pipelineId } = req.params;
  const name = validateName(req.body.name, 'Nome da etapa');
  const { color, order } = req.body;

  const exists = await prisma.pipeline.findUnique({ where: { id: pipelineId } });
  if (!exists) throw new AppError('Pipeline não encontrada', 404);

  const stage = await prisma.stage.create({ data: { name, color, order, pipelineId } });
  res.status(201).json(stage);
}

export async function updateStage(req: AuthRequest, res: Response) {
  const { stageId } = req.params;
  const { name, color, order } = req.body;
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = validateName(name, 'Nome da etapa');
  if (color !== undefined) data.color = color;
  if (order !== undefined) data.order = order;
  const stage = await prisma.stage.update({ where: { id: stageId }, data });
  res.json(stage);
}

export async function deleteStage(req: AuthRequest, res: Response) {
  const { stageId } = req.params;
  await prisma.stage.delete({ where: { id: stageId } });
  res.status(204).send();
}
