// Entry point para desenvolvimento local
// Em produção (Vercel) o entry é api/index.ts
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
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

// ─── Autenticação JWT no Socket.IO ────────────────────────────────────────────
io.use((socket: Socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    return next(new Error('Token não fornecido'));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
    (socket as any).userId = payload.userId;
    (socket as any).userRole = payload.role;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

setIO(io);

io.on('connection', (socket) => {
  const userId = (socket as any).userId as string;
  logger.info(`Socket conectado: ${socket.id} (user: ${userId})`);

  socket.on('join_lead', (leadId: string) => {
    if (typeof leadId !== 'string' || !leadId) return;
    // Todos os usuários autenticados podem ouvir qualquer lead por ora.
    // Para isolamento por equipe, adicione aqui a checagem de assignedTo.
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
