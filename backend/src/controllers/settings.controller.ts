import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { getWhatsAppStatus } from '../services/whatsapp.service';

const WA_KEYS = [
  'wa_provider',
  'wa_evolution_url',
  'wa_evolution_key',
  'wa_evolution_instance',
  'wa_zapi_instance_id',
  'wa_zapi_token',
  'wa_zapi_client_token',
];

export async function getSettings(_req: AuthRequest, res: Response) {
  const settings = await prisma.setting.findMany({
    where: { key: { in: WA_KEYS } },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  // Oculta tokens sensíveis
  const safe = { ...map };
  if (safe['wa_evolution_key']) safe['wa_evolution_key'] = '••••••••';
  if (safe['wa_zapi_token']) safe['wa_zapi_token'] = '••••••••';
  if (safe['wa_zapi_client_token']) safe['wa_zapi_client_token'] = '••••••••';

  res.json(safe);
}

export async function saveSettings(req: AuthRequest, res: Response) {
  const body = req.body as Record<string, string>;

  // Filtra apenas chaves permitidas e valores não-vazios
  const entries = Object.entries(body).filter(
    ([key, val]) => WA_KEYS.includes(key) && val !== undefined && val !== '••••••••'
  );

  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  res.json({ success: true, saved: entries.map(([k]) => k) });
}

export async function whatsAppStatus(_req: Request, res: Response) {
  const status = await getWhatsAppStatus();
  res.json(status);
}

export async function testConnection(req: AuthRequest, res: Response) {
  const { provider } = req.body;

  try {
    const status = await getWhatsAppStatus();
    const connected = status.state === 'open' || status.state === 'CONNECTED';
    res.json({
      success: connected,
      provider,
      state: status.state,
      message: connected ? 'Conexão estabelecida!' : 'Não conectado. Verifique as credenciais.',
    });
  } catch (err: any) {
    res.json({ success: false, provider, message: err.message || 'Erro ao testar conexão' });
  }
}
