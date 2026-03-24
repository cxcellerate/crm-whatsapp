import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { emitEvent, emitToRoom } from '../utils/socket';
import { logger } from '../utils/logger';

// Cria ou encontra lead pelo telefone e salva mensagem recebida
async function processInboundMessage(phone: string, content: string, waMessageId?: string) {
  if (!phone || !content) return;

  let lead = await prisma.lead.findFirst({ where: { phone } });

  if (!lead) {
    const firstStage = await prisma.stage.findFirst({ orderBy: { order: 'asc' } });
    if (!firstStage) return;

    lead = await prisma.lead.create({
      data: {
        name: `WhatsApp ${phone}`,
        phone,
        source: 'WHATSAPP',
        stageId: firstStage.id,
      },
    });
    emitEvent('lead:created', lead);
  }

  const message = await prisma.message.create({
    data: {
      leadId: lead.id,
      content,
      direction: 'INBOUND',
      status: 'DELIVERED',
      waMessageId,
    },
  });

  emitToRoom(`lead:${lead.id}`, 'message:new', message);
  emitEvent('whatsapp:message', { lead, message });
}

// ─── Evolution API ─────────────────────────────────────────────────────────────
export async function receiveWhatsApp(req: Request, res: Response) {
  try {
    const { data, event } = req.body;
    if (event !== 'messages.upsert') return res.sendStatus(200);

    const msg = data?.messages?.[0];
    if (!msg || msg.key?.fromMe) return res.sendStatus(200);

    const phone = msg.key.remoteJid?.replace('@s.whatsapp.net', '').replace(/\D/g, '');
    const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    await processInboundMessage(phone, content, msg.key.id);
    res.sendStatus(200);
  } catch (err) {
    logger.error(`Webhook Evolution error: ${err}`);
    res.sendStatus(500);
  }
}

// ─── Z-API ─────────────────────────────────────────────────────────────────────
export async function receiveZapi(req: Request, res: Response) {
  try {
    const body = req.body;

    // Z-API envia vários tipos de callback — processar apenas mensagens recebidas
    if (body.fromMe === true) return res.sendStatus(200);

    // Tipos que têm mensagem de texto
    const type: string = body.type || '';
    if (!['ReceivedCallback', 'MessageStatusCallback'].includes(type) && !body.text) {
      return res.sendStatus(200);
    }

    const phone = (body.phone || body.chatId || '').replace(/\D/g, '').replace(/^55/, '');
    const fullPhone = `55${phone}`;
    const content = body.text?.message || body.caption || body.body || '';
    const messageId = body.messageId || body.zaapId;

    await processInboundMessage(fullPhone, content, messageId);
    res.sendStatus(200);
  } catch (err) {
    logger.error(`Webhook Z-API error: ${err}`);
    res.sendStatus(500);
  }
}

// ─── Formulário externo ────────────────────────────────────────────────────────
export async function captureFormLead(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const { name, phone, email, utmSource, utmMedium, utmCampaign } = req.body;

    const form = await prisma.formCapture.findUnique({ where: { token, active: true } });
    if (!form) return res.status(404).json({ error: 'Formulário não encontrado' });

    const stageId =
      form.stageId ||
      (await prisma.stage.findFirst({ orderBy: { order: 'asc' } }))?.id;
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

    emitEvent('lead:created', lead);
    res.status(201).json({ success: true, leadId: lead.id });
  } catch (err) {
    logger.error(`Webhook Form error: ${err}`);
    res.status(500).json({ error: 'Erro ao capturar lead' });
  }
}
