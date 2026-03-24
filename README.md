# CRM WhatsApp

CRM integrado ao WhatsApp para gestão de leads, atendimento e automação de vendas.

## Deploy no Vercel (Produção)

### 1. Banco de dados — Neon (PostgreSQL gratuito e serverless)

1. Acesse [neon.tech](https://neon.tech) → crie uma conta grátis
2. Crie um novo projeto
3. Copie a **Connection string** (ex: `postgresql://user:pass@host.neon.tech/neondb?sslmode=require`)

### 2. Deploy no Vercel

```bash
# Opção A: via GitHub (recomendado)
# 1. Acesse vercel.com → "New Project"
# 2. Importe o repo: github.com/cxcellerate/crm-whatsapp
# 3. Configure as variáveis de ambiente (ver abaixo)
# 4. Clique em Deploy

# Opção B: via CLI
npm i -g vercel
vercel login
vercel --prod
```

### 3. Variáveis de ambiente no Vercel

Configure em **Settings → Environment Variables**:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | String do Neon (postgresql://...) |
| `JWT_SECRET` | String aleatória longa (ex: `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `EVOLUTION_API_URL` | URL da sua instância Evolution API |
| `EVOLUTION_API_KEY` | Chave da Evolution API |

### 4. Rodar migration após o deploy

```bash
# No terminal local, com o DATABASE_URL do Neon no .env:
cd backend
npx prisma migrate deploy
npm run seed
```

---

## Desenvolvimento Local

### Pré-requisitos
- Node.js 18+
- Docker (para PostgreSQL e Redis)

### Setup

```bash
# 1. Clonar
git clone https://github.com/cxcellerate/crm-whatsapp.git
cd crm-whatsapp

# 2. Subir banco e Redis
docker-compose up -d

# 3. Backend
cd backend
cp .env.example .env    # edite as variáveis
npm install
npx prisma migrate dev
npm run seed            # cria dados de exemplo
npm run dev             # http://localhost:3001

# 4. Frontend (novo terminal)
cd frontend
npm install
npm run dev             # http://localhost:5173
```

### Credenciais do seed
- Admin: `admin@crmwhatsapp.com` / `admin123`
- Vendedor: `vendedor@crmwhatsapp.com` / `seller123`

---

## Arquitetura

```
crm-whatsapp/
├── api/
│   └── index.ts          # Vercel Serverless Function (entry de produção)
├── backend/
│   └── src/
│       ├── app.ts         # Express app (sem listen — compartilhado)
│       ├── server.ts      # Dev local (adiciona listen + Socket.io)
│       ├── controllers/   # Lógica de negócio
│       ├── routes/        # Definição de rotas
│       ├── middleware/     # Auth, erros
│       ├── services/      # WhatsApp, integrações
│       └── utils/         # Prisma, logger, socket
├── frontend/
│   └── src/
│       ├── pages/         # Dashboard, Kanban, Leads, etc.
│       ├── components/    # UI, layout, kanban, leads, whatsapp
│       ├── hooks/         # useLeads, usePipelines, useSocket
│       ├── store/         # Zustand (auth, notificações)
│       └── services/      # API client (axios)
├── vercel.json            # Config de deploy
└── docker-compose.yml     # Dev local (PostgreSQL + Redis)
```

## Stack

**Frontend:** React 18 + TypeScript + Vite + TailwindCSS + Zustand + React Query + dnd-kit + Recharts

**Backend:** Node.js + Express + TypeScript + Prisma + PostgreSQL

**Integrações:** WhatsApp Business (Evolution API) · Google Ads · Meta Ads

**Deploy:** Vercel (frontend estático + API serverless) + Neon (PostgreSQL)
