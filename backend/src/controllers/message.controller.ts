import { Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/error.middleware';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendWhatsAppMessage } from '../services/whatsapp.service';
import { io } from '../server';

export async function getMessages(req: AuthRequest, res: Response) {
  const { leadId } = req.params;

  const messages = await prisma.message.findMany({
    where: { leadId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'asc' },
  });

  res.json(messages);
}

export async function sendMessage(req: AuthRequest, res: Response) {
  const { leadId } = req.params;
  const { content, type = 'TEXT' } = req.body;

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new AppError('Lead não encontrado', 404);

  // Envia via WhatsApp
  let waMessageId: string | undefined;
  try {
    const waResult = await sendWhatsAppMessage(lead.phone, content);
    waMessageId = waResult.key?.id;
  } catch (err) {
    // Salva a mensagem mesmo se WhatsApp falhar
  }

  const message = await prisma.message.create({
    data: {
      leadId,
      userId: req.userId,
      content,
      type: type as any,
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
      content: `Mensagem enviada: ${content.substring(0, 50)}...`,
    },
  });

  io.to(`lead:${leadId}`).emit('message:new', message);
  res.status(201).json(message);
}
