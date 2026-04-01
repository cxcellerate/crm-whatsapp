import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { emitEvent, emitToRoom } from '../utils/socket';
import { isAgentEnabled } from '../services/ai-agent.service';
import { publishAgentJob, isMessageDuplicate } from '../services/upstash.service';
import { logger } from '../utils/logger';

async function processInboundMessage(phone: string, content: string, waMessageId?: string) {
  if (!phone || !content) return;

  // Deduplicação: ignora se já processamos esta mensagem (Z-API pode reenviar)
  if (waMessageId && await isMessageDuplicate(waMessageId)) return;

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

  // Publica job no QStash — o agente roda em /api/agent-worker (fora do timeout do webhook)
  try {
    const agentOn = await isAgentEnabled();
    if (agentOn) {
      await publishAgentJob({ phone, content, leadId: lead.id });
    }
  } catch (err) {
    logger.error(`[Webhook] Erro ao publicar job do agente: ${err}`);
  }
}

// ─── Evolution API ─────────────────────────────────────────────────────────────
export async function receiveWhatsApp(req: Request, res: Response) {
  const { data, event } = req.body;
  if (event !== 'messages.upsert') return res.sendStatus(200);

  const msg = data?.messages?.[0];
  if (!msg || msg.key?.fromMe) return res.sendStatus(200);

  const phone = msg.key.remoteJid?.replace('@s.whatsapp.net', '').replace(/\D/g, '');
  const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  if (!phone || !content) return res.sendStatus(200);

  // Processa ANTES de responder — garante que o job QStash é publicado antes da função encerrar
  await processInboundMessage(phone, content, msg.key.id).catch((err) =>
    logger.error(`Webhook Evolution processInboundMessage error: ${err}`)
  );
  res.sendStatus(200);
}

// ─── Z-API ─────────────────────────────────────────────────────────────────────
export async function receiveZapi(req: Request, res: Response) {
  const body = req.body;
  if (body.fromMe === true) return res.sendStatus(200);

  const type: string = body.type || '';
  if (!['ReceivedCallback'].includes(type) && !body.text) return res.sendStatus(200);

  const rawPhone = (body.phone || body.chatId || '').replace(/\D/g, '');
  const phone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
  const content = body.text?.message || body.caption || body.body || '';
  const messageId = body.messageId || body.zaapId;
  if (!phone || !content) return res.sendStatus(200);

  await processInboundMessage(phone, content, messageId).catch((err) =>
    logger.error(`Webhook Z-API processInboundMessage error: ${err}`)
  );
  res.sendStatus(200);
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
