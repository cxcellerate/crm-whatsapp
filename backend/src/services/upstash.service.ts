import { Client as QStashClient, Receiver } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { logger } from '../utils/logger';

// Sanitiza env vars do Upstash antes que qualquer SDK as leia diretamente
const _upstashEnvKeys = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'QSTASH_TOKEN',
  'QSTASH_CURRENT_SIGNING_KEY',
  'QSTASH_NEXT_SIGNING_KEY',
];
for (const key of _upstashEnvKeys) {
  if (process.env[key]) process.env[key] = process.env[key]!.trim();
}

// ─── Clients ─────────────────────────────────────────────────────────────────

function getQStash() {
  const token = process.env.QSTASH_TOKEN?.trim();
  if (!token) throw new Error('QSTASH_TOKEN não definido');
  return new QStashClient({ token });
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
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

// ─── Verificação de assinatura QStash ────────────────────────────────────────

/**
 * Verifica a assinatura do QStash no header 'upstash-signature'.
 * Lança erro se a assinatura for inválida.
 */
export async function verifyQStashSignature(signature: string, body: string): Promise<void> {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY?.trim();
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY?.trim();
  if (!currentKey || !nextKey) {
    logger.warn('[Upstash] QSTASH signing keys ausentes — verificação pulada');
    return;
  }
  const receiver = new Receiver({ currentSigningKey: currentKey, nextSigningKey: nextKey });
  await receiver.verify({ signature, body });
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
