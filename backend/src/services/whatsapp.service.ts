import axios from 'axios';
import { logger } from '../utils/logger';

const evolutionApi = axios.create({
  baseURL: process.env.EVOLUTION_API_URL,
  headers: { apikey: process.env.EVOLUTION_API_KEY },
});

export async function sendWhatsAppMessage(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, '');

  const response = await evolutionApi.post('/message/sendText/default', {
    number: `55${cleanPhone}`,
    options: { delay: 1200, presence: 'composing' },
    textMessage: { text: message },
  });

  logger.info(`WhatsApp enviado para ${phone}`);
  return response.data;
}

export async function sendWhatsAppTemplate(phone: string, template: string, params: string[]) {
  const cleanPhone = phone.replace(/\D/g, '');

  const response = await evolutionApi.post('/message/sendTemplate/default', {
    number: `55${cleanPhone}`,
    template: { name: template, language: { code: 'pt_BR' }, components: params },
  });

  return response.data;
}

export async function getWhatsAppStatus() {
  try {
    const response = await evolutionApi.get('/instance/connectionState/default');
    return response.data;
  } catch {
    return { state: 'disconnected' };
  }
}
