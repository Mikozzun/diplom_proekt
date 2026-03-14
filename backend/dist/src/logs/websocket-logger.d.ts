import { LoggerService as NestLoggerService } from '@nestjs/common';
import { LogsGateway } from './logs.gateway.js';
export declare class WebSocketLogger implements NestLoggerService {
    private readonly gateway;
    constructor(gateway: LogsGateway);
    log(message: string, context?: string): void;
    error(message: string, trace?: string, context?: string): void;
    warn(message: string, context?: string): void;
    debug(message: string, context?: string): void;
    verbose(message: string, context?: string): void;
    private emit;
}
