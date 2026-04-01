import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { authRoutes } from './routes/auth.routes';
import { leadRoutes } from './routes/lead.routes';
import { messageRoutes } from './routes/message.routes';
import { pipelineRoutes } from './routes/pipeline.routes';
import { webhookRoutes } from './routes/webhook.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { userRoutes } from './routes/user.routes';
import { formCaptureRoutes } from './routes/form-capture.routes';
import { settingsRoutes } from './routes/settings.routes';
import { aiAgentRoutes } from './routes/ai-agent.routes';
import { agentWorkerRoutes } from './routes/agent-worker.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  /\.vercel\.app$/,
];

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = allowedOrigins.some((o) =>
        typeof o === 'string' ? o === origin : o.test(origin)
      );
      cb(null, allowed);
    },
    credentials: true,
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => { req.rawBody = buf.toString(); },
}));
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/form-captures', formCaptureRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai-agent', aiAgentRoutes);
app.use('/api/agent-worker', agentWorkerRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
