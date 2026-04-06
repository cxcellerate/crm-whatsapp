import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../utils/prisma';
import { emitEvent, emitToRoom } from '../utils/socket';
import { sendWhatsAppMessage } from './whatsapp.service';
import { logger } from '../utils/logger';

// ─── Tool definitions ────────────────────────────────────────────────────────

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'send_message',
    description: 'Envia uma mensagem de texto para o cliente via WhatsApp. Use esta tool para TODA resposta ao cliente — nunca responda com texto direto.',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Texto da mensagem a enviar ao cliente' },
      },
      required: ['message'],
    },
  },
  {
    name: 'update_lead',
    description:
      'Atualiza os dados do lead no CRM com informações extraídas da conversa. Chame assim que extrair qualquer dado — não espere o fim da conversa.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome completo do cliente' },
        email: { type: 'string', description: 'Email do cliente' },
        company: { type: 'string', description: 'Empresa onde o cliente trabalha' },
        value: { type: 'number', description: 'Valor/orçamento estimado em reais' },
        notes: { type: 'string', description: 'Produto/serviço de interesse e observações' },
      },
    },
  },
  {
    name: 'move_to_stage',
    description:
      'Move o lead para outra etapa do pipeline quando qualificado. Use quando o lead demonstrar interesse claro.',
    input_schema: {
      type: 'object',
      properties: {
        stage_name: { type: 'string', description: 'Nome (parcial) da etapa de destino' },
      },
      required: ['stage_name'],
    },
  },
  {
    name: 'finish_conversation',
    description:
      'Encerra a sessão de qualificação. Use quando: tiver nome + 2 dados coletados, atingir o limite de turnos, ou o cliente quiser parar.',
    input_schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          enum: ['qualified', 'max_turns', 'user_opt_out'],
          description: 'Motivo do encerramento',
        },
        summary: { type: 'string', description: 'Resumo breve da qualificação' },
      },
      required: ['reason'],
    },
  },
];

// ─── Config (com cache de 60s para reduzir queries no DB) ────────────────────

type AgentConfig = { enabled: boolean; apiKey: string; maxTurns: number; companyName: string; instructions: string };
let _configCache: { data: AgentConfig; at: number } | null = null;
let _stagesCache: { data: string[]; at: number } | null = null;
const CONFIG_CACHE_TTL = 60_000;

async function getAgentConfig(): Promise<AgentConfig> {
  if (_configCache && Date.now() - _configCache.at < CONFIG_CACHE_TTL) return _configCache.data;
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: ['ai_agent_enabled', 'ai_agent_api_key', 'ai_agent_max_turns', 'ai_agent_company_name', 'ai_agent_instructions'] },
    },
  });
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const data: AgentConfig = {
    enabled: map['ai_agent_enabled'] === 'true',
    apiKey: map['ai_agent_api_key'] || process.env.ANTHROPIC_API_KEY || '',
    maxTurns: parseInt(map['ai_agent_max_turns'] || '8', 10),
    companyName: map['ai_agent_company_name'] || 'nossa empresa',
    instructions: map['ai_agent_instructions'] || '',
  };
  _configCache = { data, at: Date.now() };
  return data;
}

async function getStageNames(): Promise<string[]> {
  if (_stagesCache && Date.now() - _stagesCache.at < CONFIG_CACHE_TTL) return _stagesCache.data;
  const stages = await prisma.stage.findMany({ select: { name: true }, orderBy: { order: 'asc' } });
  const data = stages.map((s) => s.name);
  _stagesCache = { data, at: Date.now() };
  return data;
}

function buildSystemPrompt(companyName: string, maxTurns: number, stages: string[], instructions: string): string {
  const stageList = stages.length > 0 ? stages.join(', ') : 'Novo Lead, Qualificado, Proposta';
  const customBlock = instructions.trim()
    ? `\n\nINSTRUÇÕES ESPECÍFICAS DA EMPRESA (seguir com prioridade):\n${instructions.trim()}`
    : '';
  return `Você é um agente de pré-atendimento da empresa "${companyName}". Seu papel é qualificar leads que chegam via WhatsApp de forma natural, amigável e eficiente.${customBlock}

OBJETIVO: Coletar ao longo da conversa:
- Nome completo
- Email de contato
- Empresa (se contexto B2B)
- Produto ou serviço de interesse
- Orçamento estimado (quando relevante)

REGRAS DE COMPORTAMENTO:
1. Seja natural e breve — máximo 2 frases por resposta
2. Pergunte apenas uma coisa por vez
3. Não repita perguntas sobre dados já fornecidos
4. Se o cliente recusar um dado, aceite e avance
5. Após ${maxTurns} trocas OU com nome + 2 outros dados → finalize

REGRAS OBRIGATÓRIAS DE TOOLS:
- Toda resposta ao cliente: use "send_message" (NUNCA escreva texto direto)
- Ao extrair qualquer dado: use "update_lead" imediatamente
- Lead com interesse claro: use "move_to_stage" com etapa adequada
- Para encerrar: use "finish_conversation"
- Você pode chamar múltiplas tools em uma única resposta

ETAPAS DO PIPELINE DISPONÍVEIS: ${stageList}

FLUXO TÍPICO:
1. Recebe mensagem → send_message (responde) → update_lead (se extraiu dados)
2. Lead qualificado → move_to_stage → finish_conversation(reason: "qualified")
3. Cliente não quer → send_message (educado) → finish_conversation(reason: "user_opt_out")`;
}

// ─── Tool context ─────────────────────────────────────────────────────────────

interface ToolContext {
  phone: string;
  leadId: string;
  sessionId: string;
}

// ─── Tool handlers ────────────────────────────────────────────────────────────

async function handleSendMessage(ctx: ToolContext, input: { message: string }): Promise<string> {
  const { phone, leadId, sessionId } = ctx;

  // Persiste na sessão do agente
  await prisma.aiAgentMessage.create({
    data: { sessionId, role: 'assistant', content: input.message },
  });

  // Envia via WhatsApp
  const waResult = await sendWhatsAppMessage(phone, input.message).catch(() => null);

  // Persiste como mensagem do lead
  const outbound = await prisma.message.create({
    data: {
      leadId,
      content: input.message,
      direction: 'OUTBOUND',
      status: waResult ? 'SENT' : 'FAILED',
      waMessageId: (waResult as any)?.key?.id,
    },
  });

  emitToRoom(`lead:${leadId}`, 'message:new', outbound);
  logger.info(`[AI Agent SDK] Mensagem enviada para ${phone}`);
  return 'message_sent';
}

async function handleUpdateLead(ctx: ToolContext, input: Record<string, any>): Promise<string> {
  const updateData: Record<string, any> = {};
  if (input.name) updateData.name = input.name;
  if (input.email) updateData.email = input.email;
  if (input.company) updateData.company = input.company;
  if (typeof input.value === 'number') updateData.value = input.value;
  if (input.notes) updateData.notes = input.notes;

  if (Object.keys(updateData).length === 0) return 'no_updates';

  const lead = await prisma.lead.update({ where: { id: ctx.leadId }, data: updateData });

  // Atualiza extractedData da sessão
  const session = await prisma.aiAgentSession.findUnique({ where: { id: ctx.sessionId } });
  if (session) {
    const prev = (session.extractedData as Record<string, any>) || {};
    await prisma.aiAgentSession.update({
      where: { id: ctx.sessionId },
      data: { extractedData: { ...prev, ...updateData } },
    });
  }

  emitEvent('lead:updated', lead);
  logger.info(`[AI Agent SDK] Lead ${ctx.leadId} atualizado: ${Object.keys(updateData).join(', ')}`);
  return `updated: ${Object.keys(updateData).join(', ')}`;
}

async function handleMoveToStage(ctx: ToolContext, input: { stage_name: string }): Promise<string> {
  const stage = await prisma.stage.findFirst({
    where: { name: { contains: input.stage_name, mode: 'insensitive' } },
  });

  if (!stage) {
    logger.warn(`[AI Agent SDK] Etapa não encontrada: ${input.stage_name}`);
    return `stage_not_found: ${input.stage_name}`;
  }

  const lead = await prisma.lead.update({
    where: { id: ctx.leadId },
    data: { stageId: stage.id },
  });

  await prisma.activity.create({
    data: {
      leadId: ctx.leadId,
      type: 'STAGE_CHANGE',
      content: `🤖 Agente SDK moveu o lead para: ${stage.name}`,
    },
  });

  emitEvent('lead:updated', lead);
  logger.info(`[AI Agent SDK] Lead ${ctx.leadId} movido para etapa: ${stage.name}`);
  return `moved_to: ${stage.name}`;
}

async function handleFinishConversation(
  ctx: ToolContext,
  input: { reason: string; summary?: string }
): Promise<string> {
  const session = await prisma.aiAgentSession.findUnique({
    where: { id: ctx.sessionId },
  });

  const data = (session?.extractedData as Record<string, any>) || {};
  const dataSummary = [
    data.name && `Nome: ${data.name}`,
    data.email && `Email: ${data.email}`,
    data.company && `Empresa: ${data.company}`,
    data.notes && `Interesse: ${data.notes}`,
    data.value && `Valor: R$ ${data.value}`,
  ]
    .filter(Boolean)
    .join(' | ');

  const activityContent = [
    `🤖 Agente SDK finalizou qualificação (${input.reason}).`,
    input.summary && `Resumo: ${input.summary}`,
    dataSummary && `Dados: ${dataSummary}`,
  ]
    .filter(Boolean)
    .join(' ');

  await prisma.activity.create({
    data: { leadId: ctx.leadId, type: 'NOTE', content: activityContent },
  });

  await prisma.aiAgentSession.update({
    where: { id: ctx.sessionId },
    data: { status: 'COMPLETED' },
  });

  logger.info(`[AI Agent SDK] Sessão ${ctx.sessionId} encerrada. Motivo: ${input.reason}`);
  return 'conversation_finished';
}

// ─── Agentic loop ────────────────────────────────────────────────────────────

export async function isAgentEnabled(): Promise<boolean> {
  const config = await getAgentConfig();
  return config.enabled;
}

export async function processAgentMessage(phone: string, userMessage: string, leadId: string): Promise<void> {
  const config = await getAgentConfig();
  if (!config.enabled) {
    logger.warn('[AI Agent SDK] Agente desabilitado (ai_agent_enabled != true nas settings).');
    return;
  }
  if (!config.apiKey) {
    logger.warn('[AI Agent SDK] API key não configurada (ai_agent_api_key ausente nas settings e ANTHROPIC_API_KEY não definida).');
    return;
  }

  // Busca ou cria sessão
  let session = await prisma.aiAgentSession.findUnique({ where: { phone } });

  // Sessão encerrada → cria nova para reiniciar o atendimento
  if (session?.status === 'COMPLETED' || session?.status === 'ABANDONED') {
    await prisma.aiAgentSession.delete({ where: { id: session.id } });
    session = null;
  }

  if (!session) {
    session = await prisma.aiAgentSession.create({ data: { phone, leadId } });
  } else if (!session.leadId) {
    session = await prisma.aiAgentSession.update({ where: { id: session.id }, data: { leadId } });
  }

  const ctx: ToolContext = { phone, leadId, sessionId: session.id };

  // Persiste mensagem do usuário
  await prisma.aiAgentMessage.create({
    data: { sessionId: session.id, role: 'user', content: userMessage },
  });

  // Carrega histórico — últimas 20 mensagens para evitar contexto gigante
  const history = await prisma.aiAgentMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  }).then((msgs) => msgs.reverse());

  const stageNames = await getStageNames();

  const anthropic = new Anthropic({ apiKey: config.apiKey });
  const systemPrompt = buildSystemPrompt(config.companyName, config.maxTurns, stageNames, config.instructions);

  // Monta histórico de mensagens (simples user/assistant pairs)
  const currentMessages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  let sessionCompleted = false;
  const MAX_TOOL_ITERATIONS = 5;
  let toolIterations = 0;

  // ── Agentic loop ──────────────────────────────────────────────────────────
  while (!sessionCompleted && toolIterations < MAX_TOOL_ITERATIONS) {
    toolIterations++;

    let response: Anthropic.Message;
    try {
      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        tools: AGENT_TOOLS,
        messages: currentMessages,
      });
    } catch (err) {
      logger.error(`[AI Agent SDK] Erro ao chamar Claude (iteração ${toolIterations}): ${err}`);
      if (toolIterations === 1) {
        await handleSendMessage(ctx, { message: 'Desculpe, tive um problema técnico no momento. Em breve um de nossos atendentes entrará em contato.' }).catch(() => null);
      }
      break;
    }

    // Adiciona resposta ao array de mensagens para próximas chamadas dentro do loop
    currentMessages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      // Claude decidiu parar sem mais tool calls
      break;
    }

    if (response.stop_reason !== 'tool_use') break;

    // Processa todas as tool calls desta resposta
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;

      const { name, id, input } = block;
      let result = 'ok';

      try {
        switch (name) {
          case 'send_message':
            result = await handleSendMessage(ctx, input as { message: string });
            break;
          case 'update_lead':
            result = await handleUpdateLead(ctx, input as Record<string, any>);
            break;
          case 'move_to_stage':
            result = await handleMoveToStage(ctx, input as { stage_name: string });
            break;
          case 'finish_conversation':
            result = await handleFinishConversation(ctx, input as { reason: string; summary?: string });
            sessionCompleted = true;
            break;
          default:
            result = `unknown_tool: ${name}`;
        }
      } catch (err) {
        logger.error(`[AI Agent SDK] Erro ao executar tool "${name}": ${err}`);
        result = `error: ${err}`;
      }

      toolResults.push({ type: 'tool_result', tool_use_id: id, content: result });
    }

    if (toolResults.length > 0) {
      currentMessages.push({ role: 'user', content: toolResults });
    }
  }

  // Se esgotou MAX_TOOL_ITERATIONS sem chamar finish_conversation, força encerramento.
  // Isso evita que a sessão fique ACTIVE para sempre quando o modelo falha em chamar a tool.
  if (!sessionCompleted && toolIterations >= MAX_TOOL_ITERATIONS) {
    logger.warn(`[AI Agent SDK] MAX_TOOL_ITERATIONS atingido sem finish_conversation para ${phone} — forçando encerramento`);
    await handleFinishConversation(ctx, { reason: 'max_turns', summary: 'Limite de iterações atingido automaticamente.' }).catch(() => null);
    sessionCompleted = true;
  }

  // Atualiza turn count e status final
  const newTurnCount = session.turnCount + 1;
  const shouldComplete = sessionCompleted || newTurnCount >= config.maxTurns;

  await prisma.aiAgentSession.update({
    where: { id: session.id },
    data: {
      turnCount: newTurnCount,
      ...(shouldComplete && !sessionCompleted ? { status: 'COMPLETED' } : {}),
    },
  });

  // Encerra por max_turns se necessário
  if (!sessionCompleted && newTurnCount >= config.maxTurns) {
    await handleFinishConversation(ctx, { reason: 'max_turns', summary: 'Limite de turnos atingido.' });
  }
}

// ─── Session management (para o controller/frontend) ─────────────────────────

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
