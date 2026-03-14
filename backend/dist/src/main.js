"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nestjs/core");
const app_module_js_1 = require("./app.module.js");
const express_session_1 = __importDefault(require("express-session"));
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const prisma_session_store_js_1 = require("./auth/prisma-session-store.js");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_js_1.AppModule);
    const adapter = new adapter_pg_1.PrismaPg({ connectionString: process.env.DATABASE_URL });
    const prisma = new client_1.PrismaClient({ adapter });
    await prisma.$connect();
    app.use((0, express_session_1.default)({
        store: new prisma_session_store_js_1.PrismaSessionStore(prisma),
        secret: process.env.SESSION_SECRET || 'change-me-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        },
    }));
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    });
    const { LogsGateway } = await import('./logs/logs.gateway.js');
    const { WebSocketLogger } = await import('./logs/websocket-logger.js');
    const logsGateway = app.get(LogsGateway);
    app.useLogger(new WebSocketLogger(logsGateway));
    const port = process.env.PORT ?? 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Server running on http://0.0.0.0:${port}`);
    console.log(`Live logs dashboard: http://0.0.0.0:${port}/logs`);
}
void bootstrap();
//# sourceMappingURL=main.js.map