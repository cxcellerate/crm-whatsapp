# CRM WhatsApp 🚀

CRM integrado ao WhatsApp para gestão de leads, atendimento e automação de vendas.

## Funcionalidades

- **Pipeline Kanban** — visualize e gerencie leads por etapa do funil
- **Integração WhatsApp Business API** — envio e recebimento de mensagens diretamente no CRM
- **Captura de Leads** — formulários e webhooks para receber leads automaticamente
- **Dashboard de Métricas** — conversão, tempo de resposta, origem dos leads
- **Rastreamento de Campanhas** — Google Ads e Meta Ads integrados
- **Multi-vendedor** — atribua leads a vendedores e acompanhe performance
- **Histórico Completo** — todas as interações de cada lead em um só lugar

## Stack

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- Zustand (state management)
- React Query (server state)
- React Router DOM

### Backend
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- Redis (filas e cache)
- Bull (jobs assíncronos)
- JWT (autenticação)

### Integrações
- WhatsApp Business API (via Evolution API)
- Google Ads API
- Meta Ads API

## Estrutura do Projeto

```
crm-whatsapp/
├── frontend/          # React App
├── backend/           # Node.js API
├── docs/              # Documentação
└── docker-compose.yml # Ambiente local
```

## Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- Docker + Docker Compose
- PostgreSQL 15+

### Setup

```bash
# 1. Clonar o repositório
git clone https://github.com/cxcellerate/crm-whatsapp.git
cd crm-whatsapp

# 2. Subir banco de dados e Redis
docker-compose up -d

# 3. Backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev

# 4. Frontend (novo terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Variáveis de Ambiente

Ver `backend/.env.example` e `frontend/.env.example`

## Licença

MIT
