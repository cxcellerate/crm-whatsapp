import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { emitEvent } from '../utils/socket';

export async function getLeads(req: AuthRequest, res: Response) {
  const { stageId, assignedTo, search } = req.query;
  const limit = Math.min(parseInt(String(req.query.limit || '100'), 10), 200);
  const offset = Math.max(parseInt(String(req.query.offset || '0'), 10), 0);

  const where = {
    ...(stageId ? { stageId: String(stageId) } : {}),
    ...(assignedTo ? { assignedTo: String(assignedTo) } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' as const } },
            { phone: { contains: String(search) } },
            { email: { contains: String(search), mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        stage: { include: { pipeline: true } },
        user: { select: { id: true, name: true, avatar: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.lead.count({ where }),
  ]);

  res.set('X-Total-Count', String(total));
  res.json(leads);
}

export async function getLead(req: AuthRequest, res: Response) {
  const lead = await prisma.lead.findUnique({
    where: { id: req.params.id },
    include: {
      stage: { include: { pipeline: true } },
      user: { select: { id: true, name: true, avatar: true } },
      messages: { orderBy: { createdAt: 'asc' }, take: 100 },
      activities: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      },
    },
  });

  if (!lead) throw new AppError('Lead não encontrado', 404);
  res.json(lead);
}

export async function createLead(req: AuthRequest, res: Response) {
  const { name, phone, email, company, value, stageId, assignedTo, source, tags, notes } = req.body;

  const lead = await prisma.lead.create({
    data: {
      name, phone, email, company, value, stageId,
      assignedTo: assignedTo || req.userId,
      source: source || 'MANUAL',
      tags: tags || [],
      notes,
    },
    include: {
      stage: { include: { pipeline: true } },
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  await prisma.activity.create({
    data: { leadId: lead.id, userId: req.userId, type: 'NOTE', content: 'Lead criado' },
  });

  emitEvent('lead:created', lead);
  res.status(201).json(lead);
}

const LEAD_UPDATE_ALLOWED_FIELDS = [
  'name', 'phone', 'email', 'company', 'value',
  'notes', 'tags', 'assignedTo', 'source',
] as const;

export async function updateLead(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const exists = await prisma.lead.findUnique({ where: { id } });
  if (!exists) throw new AppError('Lead não encontrado', 404);

  const safeData = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => (LEAD_UPDATE_ALLOWED_FIELDS as readonly string[]).includes(k))
  );

  const lead = await prisma.lead.update({
    where: { id },
    data: safeData,
    include: {
      stage: { include: { pipeline: true } },
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  emitEvent('lead:updated', lead);
  res.json(lead);
}

export async function deleteLead(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const exists = await prisma.lead.findUnique({ where: { id } });
  if (!exists) throw new AppError('Lead não encontrado', 404);

  await prisma.lead.delete({ where: { id } });
  emitEvent('lead:deleted', { id });
  res.status(204).send();
}

export async function moveLead(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { stageId } = req.body;

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw new AppError('Lead não encontrado', 404);

  const stage = await prisma.stage.findUnique({ where: { id: stageId } });
  if (!stage) throw new AppError('Etapa não encontrada', 404);

  const updated = await prisma.lead.update({
    where: { id },
    data: { stageId },
    include: {
      stage: { include: { pipeline: true } },
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  await prisma.activity.create({
    data: {
      leadId: id,
      userId: req.userId,
      type: 'STAGE_CHANGE',
      content: `Movido para etapa: ${stage.name}`,
    },
  });

  emitEvent('lead:moved', updated);
  res.json(updated);
}
