import axios from 'axios';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export type WhatsAppProvider = 'evolution' | 'zapi';

interface WhatsAppConfig {
  provider: WhatsAppProvider;
  // Evolution API
  evolutionUrl?: string;
  evolutionKey?: string;
  evolutionInstance?: string;
  // Z-API
  zapiInstanceId?: string;
  zapiToken?: string;
  zapiClientToken?: string; // Security token para webhook Z-API
}

// Lê config do banco de dados
export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          'wa_provider',
          'wa_evolution_url',
          'wa_evolution_key',
          'wa_evolution_instance',
          'wa_zapi_instance_id',
          'wa_zapi_token',
          'wa_zapi_client_token',
        ],
      },
    },
  });

  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return {
    provider: (map['wa_provider'] as WhatsAppProvider) || 'evolution',
    evolutionUrl: map['wa_evolution_url'] || process.env.EVOLUTION_API_URL,
    evolutionKey: map['wa_evolution_key'] || process.env.EVOLUTION_API_KEY,
    evolutionInstance: map['wa_evolution_instance'] || 'default',
    zapiInstanceId: map['wa_zapi_instance_id'],
    zapiToken: map['wa_zapi_token'],
    zapiClientToken: map['wa_zapi_client_token'],
  };
}

// ─── Evolution API ────────────────────────────────────────────────────────────

async function sendEvolution(phone: string, message: string, config: WhatsAppConfig) {
  const instance = config.evolutionInstance || 'default';
  const api = axios.create({
    baseURL: config.evolutionUrl,
    headers: { apikey: config.evolutionKey },
  });

  const cleanPhone = phone.replace(/\D/g, '');
  const numberWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const response = await api.post(`/message/sendText/${instance}`, {
    number: numberWithCountry,
    options: { delay: 1200, presence: 'composing' },
    textMessage: { text: message },
  });

  return { key: { id: response.data?.key?.id } };
}

async function getEvolutionStatus(config: WhatsAppConfig) {
  try {
    const instance = config.evolutionInstance || 'default';
    const api = axios.create({
      baseURL: config.evolutionUrl,
      headers: { apikey: config.evolutionKey },
    });
    const res = await api.get(`/instance/connectionState/${instance}`);
    return { provider: 'evolution', state: res.data?.instance?.state || 'unknown' };
  } catch {
    return { provider: 'evolution', state: 'disconnected' };
  }
}

// ─── Z-API ────────────────────────────────────────────────────────────────────

async function sendZapi(phone: string, message: string, config: WhatsAppConfig) {
  if (!config.zapiInstanceId || !config.zapiToken) {
    throw new Error('Z-API não configurada');
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const numberWithCountry = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const api = axios.create({
    baseURL: `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiToken}`,
    headers: {
      'Client-Token': config.zapiClientToken || '',
      'Content-Type': 'application/json',
    },
  });

  const response = await api.post('/send-text', {
    phone: numberWithCountry,
    message,
  });

  return { key: { id: response.data?.zaapId || response.data?.messageId } };
}

async function getZapiStatus(config: WhatsAppConfig) {
  if (!config.zapiInstanceId || !config.zapiToken) {
    return { provider: 'zapi', state: 'not_configured' };
  }
  try {
    const api = axios.create({
      baseURL: `https://api.z-api.io/instances/${config.zapiInstanceId}/token/${config.zapiToken}`,
      headers: { 'Client-Token': config.zapiClientToken || '' },
    });
    const res = await api.get('/status');
    const connected = res.data?.connected === true || res.data?.value === 'CONNECTED';
    return { provider: 'zapi', state: connected ? 'open' : 'disconnected' };
  } catch {
    return { provider: 'zapi', state: 'disconnected' };
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

export async function sendWhatsAppMessage(phone: string, message: string) {
  const config = await getWhatsAppConfig();
  logger.info(`[WhatsApp] Enviando via ${config.provider} para ${phone}`);

  if (config.provider === 'zapi') {
    return sendZapi(phone, message, config);
  }
  return sendEvolution(phone, message, config);
}

export async function getWhatsAppStatus() {
  const config = await getWhatsAppConfig();
  if (config.provider === 'zapi') return getZapiStatus(config);
  return getEvolutionStatus(config);
}
