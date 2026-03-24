// Entry point para desenvolvimento local
// Em produção (Vercel) o entry é api/index.ts
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import { setIO } from './utils/socket';
import { logger } from './utils/logger';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

setIO(io);

io.on('connection', (socket) => {
  logger.info(`Socket conectado: ${socket.id}`);

  socket.on('join_lead', (leadId: string) => {
    socket.join(`lead:${leadId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
  logger.info(`Health: http://localhost:${PORT}/api/health`);
});
