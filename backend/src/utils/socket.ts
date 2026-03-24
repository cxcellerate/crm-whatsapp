import type { Server } from 'socket.io';

let _io: Server | null = null;

export function setIO(io: Server) {
  _io = io;
}

export function emitEvent(event: string, data: unknown) {
  _io?.emit(event, data);
}

export function emitToRoom(room: string, event: string, data: unknown) {
  _io?.to(room).emit(event, data);
}
