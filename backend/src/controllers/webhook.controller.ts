import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { io } from '../server';
import { logger } from '../utils/logger';

export async function receiveWhatsApp(req: Request, res: Response) {
  try {
    const { data, event } = req.body;

    if (event !== 'messages.upsert') return res.sendStatus(200);

    const msg = data?.messages?.[0];
    if (!msg || msg.key?.fromMe) return res.sendStatus(200);

    const phone = msg.key.remoteJid?.replace('@s.whatsapp.net', '');
    if (!phone) return res.sendStatus(200);

    const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    // Busca lead pelo telefone
    let lead = await prisma.lead.findFirst({ where: { phone } });

    // Se não existe, cria automaticamente
    if (!lead) {
      const firstStage = await prisma.stage.findFirst({ orderBy: { order: 'asc' } });
      if (firstStage) {
        lead = await prisma.lead.create({
          data: {
            name: `Lead WhatsApp ${phone}`,
            phone,
            source: 'WHATSAPP',
            stageId: firstStage.id,
          },
        });
        io.emit('lead:created', lead);
      }
    }

    if (lead) {
      const message = await prisma.message.create({
        data: {
          leadId: lead.id,
          content,
          direction: 'INBOUND',
          status: 'DELIVERED',
          waMessageId: msg.key.id,
        },
      });
      io.to(`lead:${lead.id}`).emit('message:new', message);
      io.emit('whatsapp:message', { lead, message });
    }

    res.sendStatus(200);
  } catch (err) {
    logger.error(`Webhook WhatsApp error: ${err}`);
    res.sendStatus(500);
  }
}

export async function captureFormLead(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { name, phone, email, utmSource, utmMedium, utmCampaign } = req.body;

    const form = await prisma.formCapture.findUnique({ where: { token, active: true } });
    if (!form) return res.status(404).json({ error: 'Formulário não encontrado' });

    const stageId = form.stageId || (await prisma.stage.findFirst({ orderBy: { order: 'asc' } }))?.id;
    if (!stageId) return res.status(400).json({ error: 'Nenhuma etapa configurada' });

    const lead = await prisma.lead.create({
      data: {
        name, phone, email,
        stageId,
        assignedTo: form.assignTo || undefined,
        source: 'FORM',
        utmSource, utmMedium, utmCampaign,
      },
    });

    io.emit('lead:created', lead);
    res.status(201).json({ success: true, leadId: lead.id });
  } catch (err) {
    logger.error(`Webhook Form error: ${err}`);
    res.status(500).json({ error: 'Erro ao capturar lead' });
  }
}
