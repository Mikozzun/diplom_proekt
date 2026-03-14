import { Server } from 'socket.io';
export interface LogEntry {
    timestamp: string;
    level: string;
    context: string;
    message: string;
}
export declare class LogsGateway {
    server: Server;
    broadcast(entry: LogEntry): void;
}
