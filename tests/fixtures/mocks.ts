// ─── Dados mock compartilhados pelos testes ──────────────────────────────────

export const MOCK_USER = {
  id: 'user-1',
  name: 'Admin Teste',
  email: 'admin@teste.com',
  role: 'ADMIN',
  active: true,
  avatar: null,
  createdAt: '2026-01-01T00:00:00Z',
};

// Token JWT fictício (apenas para testes com mock de API)
export const MOCK_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJ1c2VySWQiOiJ1c2VyLTEiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NDQwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.' +
  'mock_signature';

export const MOCK_STAGES = [
  { id: 'stage-1', name: 'Novo Lead',   order: 1, color: '#3DA13E', pipelineId: 'pipe-1', _count: { leads: 2 } },
  { id: 'stage-2', name: 'Qualificado', order: 2, color: '#086375', pipelineId: 'pipe-1', _count: { leads: 1 } },
  { id: 'stage-3', name: 'Proposta',    order: 3, color: '#FF7919', pipelineId: 'pipe-1', _count: { leads: 0 } },
];

export const MOCK_PIPELINE = {
  id: 'pipe-1',
  name: 'Pipeline Principal',
  order: 1,
  color: '#3DA13E',
  stages: MOCK_STAGES,
  createdAt: '2026-01-01T00:00:00Z',
};

export const MOCK_STAGE_FOR_LEAD = {
  ...MOCK_STAGES[0],
  pipeline: MOCK_PIPELINE,
};

export const MOCK_LEADS = [
  {
    id: 'lead-1',
    name: 'João Silva',
    phone: '11999990001',
    email: 'joao@teste.com',
    company: 'Teste Ltda',
    value: 5000,
    source: 'MANUAL',
    stageId: 'stage-1',
    stage: MOCK_STAGE_FOR_LEAD,
    tags: [],
    notes: '',
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
    _count: { messages: 3 },
  },
  {
    id: 'lead-2',
    name: 'Maria Santos',
    phone: '11999990002',
    email: 'maria@teste.com',
    source: 'WHATSAPP',
    stageId: 'stage-2',
    stage: { ...MOCK_STAGE_FOR_LEAD, id: 'stage-2', name: 'Qualificado' },
    tags: [],
    notes: '',
    createdAt: '2026-04-02T10:00:00Z',
    updatedAt: '2026-04-02T10:00:00Z',
    _count: { messages: 1 },
  },
];

export const MOCK_STATS = {
  totalLeads: 5,
  leadsThisMonth: 3,
  leadsThisWeek: 2,
  recentMessages: 10,
  totalValue: 15000,
  leadsBySource: [
    { source: 'MANUAL',   _count: { _all: 3 } },
    { source: 'WHATSAPP', _count: { _all: 2 } },
  ],
  leadsByStage: [
    { stageId: 'stage-1', _count: { _all: 3 } },
    { stageId: 'stage-2', _count: { _all: 2 } },
  ],
};
