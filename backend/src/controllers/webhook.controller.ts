import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { emitEvent, emitToRoom } from '../utils/socket';
import { isAgentEnabled, processAgentMessage } from '../services/ai-agent.service';
import { logger } from '../utils/logger';

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

  // Salva mensagem recebida
  const inboundMessage = await prisma.message.create({
    data: {
      leadId: lead.id,
      content,
      direction: 'INBOUND',
      status: 'DELIVERED',
      waMessageId,
    },
  });

  emitToRoom(`lead:${lead.id}`, 'message:new', inboundMessage);
  emitEvent('whatsapp:message', { lead, message: inboundMessage });

  // Agente SDK de IA responde automaticamente (se ativado)
  // O agente gerencia envio, persistência e eventos internamente via tool_use
  try {
    const agentOn = await isAgentEnabled();
    if (agentOn) {
      await processAgentMessage(phone, content, lead.id);
    }
  } catch (err) {
    logger.error(`[Webhook] Erro no agente de IA: ${err}`);
  }
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

    res.sendStatus(200); // responde imediatamente ao WhatsApp
    await processInboundMessage(phone, content, msg.key.id);
  } catch (err) {
    logger.error(`Webhook Evolution error: ${err}`);
    res.sendStatus(500);
  }
}

// ─── Z-API ─────────────────────────────────────────────────────────────────────
export async function receiveZapi(req: Request, res: Response) {
  try {
    const body = req.body;
    if (body.fromMe === true) return res.sendStatus(200);

    const type: string = body.type || '';
    if (!['ReceivedCallback'].includes(type) && !body.text) return res.sendStatus(200);

    const rawPhone = (body.phone || body.chatId || '').replace(/\D/g, '');
    const phone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    const content = body.text?.message || body.caption || body.body || '';
    const messageId = body.messageId || body.zaapId;

    res.sendStatus(200); // responde imediatamente
    await processInboundMessage(phone, content, messageId);
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
      data: { name, phone, email, stageId, assignedTo: form.assignTo || undefined, source: 'FORM', utmSource, utmMedium, utmCampaign },
    });

    emitEvent('lead:created', lead);
    res.status(201).json({ success: true, leadId: lead.id });
  } catch (err) {
    logger.error(`Webhook Form error: ${err}`);
    res.status(500).json({ error: 'Erro ao capturar lead' });
  }
}
