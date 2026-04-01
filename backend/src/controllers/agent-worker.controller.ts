import { Request, Response } from 'express';
import { processAgentMessage } from '../services/ai-agent.service';
import { verifyAgentWorkerToken, acquireProcessingLock, releaseProcessingLock } from '../services/upstash.service';
import { logger } from '../utils/logger';

export async function agentWorkerHandler(req: Request, res: Response) {
  // Verifica token de autenticação simples
  if (!verifyAgentWorkerToken(req.headers['authorization'] as string | undefined)) {
    logger.error('[Agent Worker] Token inválido');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { phone, content, leadId } = req.body as {
    phone: string;
    content: string;
    leadId: string;
  };

  if (!phone || !content || !leadId) {
    return res.status(400).json({ error: 'phone, content e leadId são obrigatórios' });
  }

  // Lock por phone — evita dois jobs rodando ao mesmo tempo para o mesmo lead
  const locked = await acquireProcessingLock(phone);
  if (!locked) {
    logger.warn(`[Agent Worker] Job concorrente ignorado para phone: ${phone}`);
    // Retorna 200 para QStash não retentar (o outro job já está processando)
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    await processAgentMessage(phone, content, leadId);
    logger.info(`[Agent Worker] Agente concluído para phone: ${phone}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error(`[Agent Worker] Erro ao executar agente: ${err}`);
    return res.status(500).json({ error: String(err) });
  } finally {
    await releaseProcessingLock(phone);
  }
}
