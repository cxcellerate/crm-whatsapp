// Vercel Serverless Function com maxDuration 300s para o agente de IA
// Usa o mesmo Express app — Prisma e demais módulos ficam no contexto correto
import app from '../backend/src/app';

export default app;
