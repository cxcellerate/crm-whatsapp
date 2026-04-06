import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendWhatsAppMessage } from '../services/whatsapp.service';
import { emitEvent, emitToRoom } from '../utils/socket';

export async function getMessages(req: AuthRequest, res: Response) {
  const { leadId } = req.params;

  const messages = await prisma.message.findMany({
    where: { leadId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'asc' },
  });

  res.json(messages);
}

const VALID_MESSAGE_TYPES = ['TEXT', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT'] as const;
type MessageType = typeof VALID_MESSAGE_TYPES[number];

export async function sendMessage(req: AuthRequest, res: Response) {
  const { leadId } = req.params;
  const { content, type = 'TEXT' } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new AppError('Conteúdo da mensagem é obrigatório', 400);
  }
  if (content.length > 4096) {
    throw new AppError('Mensagem deve ter no máximo 4096 caracteres', 400);
  }

  const safeType: MessageType = VALID_MESSAGE_TYPES.includes(type) ? type : 'TEXT';

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new AppError('Lead não encontrado', 404);

  let waMessageId: string | undefined;
  try {
    const waResult = await sendWhatsAppMessage(lead.phone, content);
    waMessageId = waResult?.key?.id;
  } catch {
    // Salva mesmo se WhatsApp falhar
  }

  const message = await prisma.message.create({
    data: {
      leadId,
      userId: req.userId,
      content: content.trim(),
      type: safeType,
      direction: 'OUTBOUND',
      status: waMessageId ? 'SENT' : 'FAILED',
      waMessageId,
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  await prisma.activity.create({
    data: {
      leadId,
      userId: req.userId,
      type: 'MESSAGE_SENT',
      content: `Mensagem: ${content.substring(0, 60)}`,
    },
  });

  emitToRoom(`lead:${leadId}`, 'message:new', message);
  res.status(201).json(message);
}
