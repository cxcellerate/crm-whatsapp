import { Request, Response } from 'express';
import { processAgentMessage } from '../services/ai-agent.service';
import { verifyQStashSignature } from '../services/upstash.service';
import { logger } from '../utils/logger';

export async function agentWorkerHandler(req: Request, res: Response) {
  // Verifica assinatura do QStash
  try {
    const signature = req.headers['upstash-signature'] as string;
    const bodyStr = JSON.stringify(req.body);
    await verifyQStashSignature(signature, bodyStr);
  } catch (err) {
    logger.error(`[Agent Worker] Assinatura QStash inválida: ${err}`);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { phone, content, leadId } = req.body as {
    phone: string;
    content: string;
    leadId: string;
  };

  if (!phone || !content || !leadId) {
    return res.status(400).json({ error: 'phone, content e leadId são obrigatórios' });
  }

  try {
    await processAgentMessage(phone, content, leadId);
    logger.info(`[Agent Worker] Agente concluído para phone: ${phone}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error(`[Agent Worker] Erro ao executar agente: ${err}`);
    return res.status(500).json({ error: String(err) });
  }
}
