import { Client as QStashClient } from '@upstash/qstash';
import { Redis } from '@upstash/redis';
import { logger } from '../utils/logger';

// Sanitiza env vars do Upstash antes que qualquer SDK as leia diretamente
const _upstashEnvKeys = [
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'QSTASH_TOKEN',
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

const MSG_TTL_SECONDS = 300;

export async function isMessageDuplicate(messageId: string): Promise<boolean> {
  try {
    const redis = getRedis();
    const key = `crm:msg:${messageId}`;
    const result = await redis.set(key, '1', { nx: true, ex: MSG_TTL_SECONDS });
    if (result === null) {
      logger.warn(`[Upstash] Mensagem duplicada ignorada: ${messageId}`);
      return true;
    }
    return false;
  } catch (err) {
    logger.error(`[Upstash Redis] Erro na deduplicação: ${err}`);
    return false;
  }
}

// ─── Lock de processamento por phone (evita jobs concorrentes) ───────────────

const LOCK_TTL_SECONDS = 350;

export async function acquireProcessingLock(phone: string): Promise<boolean> {
  try {
    const redis = getRedis();
    const result = await redis.set(`crm:lock:${phone}`, '1', { nx: true, ex: LOCK_TTL_SECONDS });
    return result !== null;
  } catch {
    return true; // Redis indisponível → deixa processar (não bloqueia)
  }
}

export async function releaseProcessingLock(phone: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(`crm:lock:${phone}`);
  } catch {
    // Ignora — lock expira sozinho em 120s
  }
}

// ─── Autenticação do agent-worker por token simples ──────────────────────────

/**
 * Verifica se o header Authorization corresponde ao AGENT_WORKER_SECRET.
 * Substitui a verificação de assinatura QStash (que dependia de rawBody frágil).
 */
export function verifyAgentWorkerToken(authHeader: string | undefined): boolean {
  const secret = process.env.AGENT_WORKER_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('[Agent Worker] AGENT_WORKER_SECRET não definido em produção — acesso negado');
      return false;
    }
    logger.warn('[Agent Worker] AGENT_WORKER_SECRET não definido — acesso liberado (apenas em dev)');
    return true;
  }
  return authHeader === `Bearer ${secret}`;
}

// ─── Fila de agente (QStash) ──────────────────────────────────────────────────

export interface AgentJobPayload {
  phone: string;
  content: string;
  leadId: string;
  waMessageId?: string;
}

export async function publishAgentJob(payload: AgentJobPayload): Promise<void> {
  const appUrl = process.env.APP_URL || `https://${process.env.VERCEL_URL}`;
  if (!appUrl) {
    throw new Error('APP_URL ou VERCEL_URL não definido');
  }

  const secret = process.env.AGENT_WORKER_SECRET?.trim();
  const workerUrl = `${appUrl}/api/agent-worker`;
  const qstash = getQStash();

  await qstash.publishJSON({
    url: workerUrl,
    body: payload,
    retries: 5,
    deduplicationId: payload.waMessageId ? `agent:${payload.waMessageId}` : undefined,
    headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
  });

  logger.info(`[QStash] Job publicado — phone: ${payload.phone}, lead: ${payload.leadId}`);
}
