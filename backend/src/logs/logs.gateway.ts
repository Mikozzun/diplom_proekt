import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

export interface LogEntry {
  timestamp: string;
  level: string;
  context: string;
  message: string;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class LogsGateway {
  @WebSocketServer()
  server!: Server;

  broadcast(entry: LogEntry) {
    this.server?.emit('log', entry);
  }
}
