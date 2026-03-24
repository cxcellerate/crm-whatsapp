import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

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
  const { name, color } = req.body;
  const pipeline = await prisma.pipeline.create({ data: { name, color } });
  res.status(201).json(pipeline);
}

export async function updatePipeline(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const pipeline = await prisma.pipeline.update({ where: { id }, data: req.body });
  res.json(pipeline);
}

export async function deletePipeline(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.pipeline.delete({ where: { id } });
  res.status(204).send();
}

export async function createStage(req: AuthRequest, res: Response) {
  const { id: pipelineId } = req.params;
  const { name, color, order } = req.body;

  const exists = await prisma.pipeline.findUnique({ where: { id: pipelineId } });
  if (!exists) throw new AppError('Pipeline não encontrada', 404);

  const stage = await prisma.stage.create({ data: { name, color, order, pipelineId } });
  res.status(201).json(stage);
}

export async function updateStage(req: AuthRequest, res: Response) {
  const { stageId } = req.params;
  const stage = await prisma.stage.update({ where: { id: stageId }, data: req.body });
  res.json(stage);
}

export async function deleteStage(req: AuthRequest, res: Response) {
  const { stageId } = req.params;
  await prisma.stage.delete({ where: { id: stageId } });
  res.status(204).send();
}
