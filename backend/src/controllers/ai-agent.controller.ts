import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prisma';
import { getAgentSessions, getAgentSession, abandonSession } from '../services/ai-agent.service';

const AI_KEYS = ['ai_agent_enabled', 'ai_agent_api_key', 'ai_agent_max_turns', 'ai_agent_company_name'];

export async function getSessions(req: AuthRequest, res: Response) {
  const page = parseInt(String(req.query.page || '1'));
  const result = await getAgentSessions(page);
  res.json(result);
}

export async function getSession(req: AuthRequest, res: Response) {
  const session = await getAgentSession(req.params.id);
  if (!session) throw new AppError('Sessão não encontrada', 404);
  res.json(session);
}

export async function deleteSession(req: AuthRequest, res: Response) {
  await abandonSession(req.params.id);
  res.json({ success: true });
}

export async function getConfig(_req: AuthRequest, res: Response) {
  const settings = await prisma.setting.findMany({ where: { key: { in: AI_KEYS } } });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  if (map['ai_agent_api_key']) map['ai_agent_api_key'] = '••••••••';
  res.json(map);
}

export async function saveConfig(req: AuthRequest, res: Response) {
  const body = req.body as Record<string, string>;
  const entries = Object.entries(body).filter(
    ([key, val]) => AI_KEYS.includes(key) && val !== undefined && val !== '••••••••'
  );
  for (const [key, value] of entries) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  res.json({ success: true });
}
