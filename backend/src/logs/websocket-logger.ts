import { LoggerService as NestLoggerService } from '@nestjs/common';
import { LogsGateway } from './logs.gateway.js';

export class WebSocketLogger implements NestLoggerService {
  constructor(private readonly gateway: LogsGateway) {}

  log(message: string, context?: string) {
    this.emit('LOG', message, context);
    process.stdout.write(`[Nest] LOG   [${context ?? ''}] ${message}\n`);
  }

  error(message: string, trace?: string, context?: string) {
    this.emit('ERROR', message, context);
    process.stderr.write(
      `[Nest] ERROR [${context ?? ''}] ${message}\n${trace ?? ''}\n`,
    );
  }

  warn(message: string, context?: string) {
    this.emit('WARN', message, context);
    process.stdout.write(`[Nest] WARN  [${context ?? ''}] ${message}\n`);
  }

  debug(message: string, context?: string) {
    this.emit('DEBUG', message, context);
    process.stdout.write(`[Nest] DEBUG [${context ?? ''}] ${message}\n`);
  }

  verbose(message: string, context?: string) {
    this.emit('VERBOSE', message, context);
    process.stdout.write(`[Nest] VERBOSE [${context ?? ''}] ${message}\n`);
  }

  private emit(level: string, message: string, context?: string) {
    this.gateway.broadcast({
      timestamp: new Date().toISOString(),
      level,
      context: context ?? '',
      message: typeof message === 'string' ? message : JSON.stringify(message),
    });
  }
}
