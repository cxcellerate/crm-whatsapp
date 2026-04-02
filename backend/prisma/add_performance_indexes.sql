-- Índices de performance — rodar uma vez no banco de produção
-- Comando: psql $DATABASE_URL -f prisma/add_performance_indexes.sql

CREATE INDEX CONCURRENTLY IF NOT EXISTS "leads_stageId_idx"   ON leads ("stageId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "leads_assignedTo_idx" ON leads ("assignedTo");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "leads_source_idx"     ON leads (source);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "leads_createdAt_idx"  ON leads ("createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "messages_leadId_idx"    ON messages ("leadId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "messages_createdAt_idx" ON messages ("createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "activities_leadId_idx" ON activities ("leadId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ai_agent_messages_sessionId_idx" ON ai_agent_messages ("sessionId");
