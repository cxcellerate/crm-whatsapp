import { Client as QStashClient } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { logger } from '../utils/logger';

// ─── Clients ─────────────────────────────────────────────────────────────────

function getQStash() {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error('QSTASH_TOKEN não definido');
  return new QStashClient({ token });
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN não definidos');
  return new Redis({ url, token });
}

// ─── Deduplicação de mensagens (Redis) ───────────────────────────────────────

const MSG_TTL_SECONDS = 300; // 5 minutos

/**
 * Retorna true se o messageId já foi processado (duplicata).
 * Registra o messageId no Redis com TTL para evitar reprocessamento.
 */
export async function isMessageDuplicate(messageId: string): Promise<boolean> {
  try {
    const redis = getRedis();
    const key = `crm:msg:${messageId}`;
    // SET NX retorna 'OK' se inseriu (novo) ou null se já existia (duplicata)
    const result = await redis.set(key, '1', { nx: true, ex: MSG_TTL_SECONDS });
    if (result === null) {
      logger.warn(`[Upstash] Mensagem duplicada ignorada: ${messageId}`);
      return true;
    }
    return false;
  } catch (err) {
    // Se Redis falhar, deixa passar (melhor processar duplicado do que perder mensagem)
    logger.error(`[Upstash Redis] Erro na deduplicação: ${err}`);
    return false;
  }
}

// ─── Fila de agente (QStash) ──────────────────────────────────────────────────

export interface AgentJobPayload {
  phone: string;
  content: string;
  leadId: string;
}

/**
 * Publica job no QStash para processamento do agente em background.
 * O QStash chama /api/agent-worker após o webhook já ter retornado 200.
 */
export async function publishAgentJob(payload: AgentJobPayload): Promise<void> {
  const appUrl = process.env.APP_URL || `https://${process.env.VERCEL_URL}`;
  if (!appUrl) {
    throw new Error('APP_URL ou VERCEL_URL não definido — QStash não sabe para onde enviar o job');
  }

  const workerUrl = `${appUrl}/api/agent-worker`;
  const qstash = getQStash();

  await qstash.publishJSON({
    url: workerUrl,
    body: payload,
    retries: 2,
  });

  logger.info(`[QStash] Job publicado para agente — phone: ${payload.phone}, lead: ${payload.leadId}`);
}
