"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketLogger = void 0;
class WebSocketLogger {
    gateway;
    constructor(gateway) {
        this.gateway = gateway;
    }
    log(message, context) {
        this.emit('LOG', message, context);
        process.stdout.write(`[Nest] LOG   [${context ?? ''}] ${message}\n`);
    }
    error(message, trace, context) {
        this.emit('ERROR', message, context);
        process.stderr.write(`[Nest] ERROR [${context ?? ''}] ${message}\n${trace ?? ''}\n`);
    }
    warn(message, context) {
        this.emit('WARN', message, context);
        process.stdout.write(`[Nest] WARN  [${context ?? ''}] ${message}\n`);
    }
    debug(message, context) {
        this.emit('DEBUG', message, context);
        process.stdout.write(`[Nest] DEBUG [${context ?? ''}] ${message}\n`);
    }
    verbose(message, context) {
        this.emit('VERBOSE', message, context);
        process.stdout.write(`[Nest] VERBOSE [${context ?? ''}] ${message}\n`);
    }
    emit(level, message, context) {
        this.gateway.broadcast({
            timestamp: new Date().toISOString(),
            level,
            context: context ?? '',
            message: typeof message === 'string' ? message : JSON.stringify(message),
        });
    }
}
exports.WebSocketLogger = WebSocketLogger;
//# sourceMappingURL=websocket-logger.js.map