import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../utils/prisma';
import { emitEvent, emitToRoom } from '../utils/socket';
import { sendWhatsAppMessage } from './whatsapp.service';
import { logger } from '../utils/logger';

interface ExtractedData {
  name?: string;
  email?: string;
  company?: string;
  interest?: string;
  estimatedValue?: number;
  notes?: string;
}

interface AgentResponse {
  reply: string;
  extracted: ExtractedData;
  isComplete: boolean;
}

async function getAgentConfig() {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ['ai_agent_enabled', 'ai_agent_api_key', 'ai_agent_max_turns', 'ai_agent_company_name'],
      },
    },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return {
    enabled: map['ai_agent_enabled'] === 'true',
    apiKey: map['ai_agent_api_key'] || process.env.ANTHROPIC_API_KEY || '',
    maxTurns: parseInt(map['ai_agent_max_turns'] || '8', 10),
    companyName: map['ai_agent_company_name'] || 'nossa empresa',
  };
}

function buildSystemPrompt(companyName: string, maxTurns: number): string {
  return `Você é um assistente de pré-atendimento de "${companyName}". Seu objetivo é qualificar leads de forma natural e amigável via WhatsApp.

Colete estas informações ao longo da conversa — uma ou duas por mensagem, nunca todas de uma vez:
- Nome completo do cliente
- Email de contato
- Empresa onde trabalha (se aplicável)
- Produto ou serviço de interesse
- Valor/orçamento estimado (se aplicável)

Regras importantes:
1. Seja natural, breve e conversacional. Máximo 2 frases por resposta.
2. Nunca pergunte mais de uma coisa por vez.
3. Se o cliente já forneceu alguma informação, não peça novamente.
4. Se o cliente não quiser fornecer algum dado, aceite e siga em frente.
5. Após ${maxTurns} trocas ou quando tiver nome + 2 outros campos, encerre graciosamente.
6. Se o cliente demonstrar que não quer conversar ("não obrigado", "tchau", etc.), encerre com cortesia.

IMPORTANTE: Responda SEMPRE com JSON válido neste formato exato, sem texto fora do JSON:
{
  "reply": "sua mensagem para o cliente aqui",
  "extracted": {
    "name": null,
    "email": null,
    "company": null,
    "interest": null,
    "estimatedValue": null,
    "notes": null
  },
  "isComplete": false
}

- "reply": o texto que será enviado ao cliente
- "extracted": todos os campos coletados ATÉ AGORA (inclua os de turnos anteriores, não apenas o atual)
- "isComplete": true apenas quando encerrar a qualificação`;
}

export async function isAgentEnabled(): Promise<boolean> {
  const config = await getAgentConfig();
  return config.enabled;
}

export async function processAgentMessage(
  phone: string,
  userMessage: string,
  leadId: string
): Promise<string | null> {
  const config = await getAgentConfig();
  if (!config.enabled || !config.apiKey) return null;

  // Busca ou cria sessão
  let session = await prisma.aiAgentSession.findUnique({ where: { phone } });

  if (session?.status === 'COMPLETED' || session?.status === 'ABANDONED') {
    return null; // agente não interfere em sessões encerradas
  }

  if (!session) {
    session = await prisma.aiAgentSession.create({
      data: { phone, leadId },
    });
  } else if (!session.leadId) {
    session = await prisma.aiAgentSession.update({
      where: { id: session.id },
      data: { leadId },
    });
  }

  // Carrega histórico
  const history = await prisma.aiAgentMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'asc' },
  });

  const messages: { role: 'user' | 'assistant'; content: string }[] = history.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  messages.push({ role: 'user', content: userMessage });

  // Chama Claude
  const anthropic = new Anthropic({ apiKey: config.apiKey });
  let parsed: AgentResponse;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: buildSystemPrompt(config.companyName, config.maxTurns),
      messages,
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    parsed = JSON.parse(raw);
  } catch (err) {
    logger.error(`[AI Agent] Erro ao chamar Claude ou fazer parse: ${err}`);
    return null; // fallback silencioso — vendedor humano assume
  }

  const { reply, extracted, isComplete } = parsed;

  // Persiste mensagens
  await prisma.aiAgentMessage.createMany({
    data: [
      { sessionId: session.id, role: 'user', content: userMessage },
      { sessionId: session.id, role: 'assistant', content: reply },
    ],
  });

  // Atualiza dados extraídos (merge com o que já tinha)
  const prev = (session.extractedData as ExtractedData) || {};
  const merged: ExtractedData = {};
  for (const key of ['name', 'email', 'company', 'interest', 'estimatedValue', 'notes'] as const) {
    (merged as any)[key] = (extracted as any)[key] ?? (prev as any)[key] ?? null;
  }
  // Remove nulos
  const clean = Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== null));

  const newTurnCount = session.turnCount + 1;
  const shouldComplete = isComplete || newTurnCount >= config.maxTurns;

  await prisma.aiAgentSession.update({
    where: { id: session.id },
    data: {
      extractedData: clean,
      turnCount: newTurnCount,
      status: shouldComplete ? 'COMPLETED' : 'ACTIVE',
    },
  });

  if (shouldComplete) {
    await finalizeSession(session.id, leadId, clean);
  }

  return reply;
}

async function finalizeSession(sessionId: string, leadId: string, data: ExtractedData) {
  try {
    const updateData: Record<string, any> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.company) updateData.company = data.company;
    if (data.estimatedValue) updateData.value = data.estimatedValue;
    if (data.notes) updateData.notes = data.notes;

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    // Gera resumo para atividade
    const summary = [
      data.name && `Nome: ${data.name}`,
      data.email && `Email: ${data.email}`,
      data.company && `Empresa: ${data.company}`,
      data.interest && `Interesse: ${data.interest}`,
      data.estimatedValue && `Valor estimado: R$ ${data.estimatedValue}`,
      data.notes && `Obs: ${data.notes}`,
    ]
      .filter(Boolean)
      .join(' | ');

    await prisma.activity.create({
      data: {
        leadId,
        type: 'NOTE',
        content: `🤖 Agente de IA qualificou o lead: ${summary || 'sem dados extraídos'}`,
      },
    });

    emitEvent('lead:updated', lead);
    logger.info(`[AI Agent] Sessão ${sessionId} finalizada. Lead ${leadId} atualizado.`);
  } catch (err) {
    logger.error(`[AI Agent] Erro ao finalizar sessão: ${err}`);
  }
}

export async function getAgentSessions(page = 1, limit = 20) {
  const [sessions, total] = await Promise.all([
    prisma.aiAgentSession.findMany({
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lead: { select: { id: true, name: true, phone: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.aiAgentSession.count(),
  ]);
  return { sessions, total, page, pages: Math.ceil(total / limit) };
}

export async function getAgentSession(id: string) {
  return prisma.aiAgentSession.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, name: true, phone: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
}

export async function abandonSession(id: string) {
  return prisma.aiAgentSession.update({
    where: { id },
    data: { status: 'ABANDONED' },
  });
}
