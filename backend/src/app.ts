import express from 'express';
import path from 'node:path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { router } from './routes';

const app = express();

// Trust Fly.io reverse proxy so secure cookies work behind TLS termination
app.set('trust proxy', 1);

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// Skip helmet for AdminJS and auth-ui paths (they serve their own frontend assets)
const helmetMiddleware = helmet();
app.use((req, res, next) => {
  if (req.path.startsWith('/admin') || req.path.startsWith('/auth'))
    return next();
  helmetMiddleware(req, res, next);
});
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);
// Skip body parsing for AdminJS and Better Auth (they handle their own parsing)
const jsonParser = express.json({ limit: '10mb' });
const urlencodedParser = express.urlencoded({ extended: true });
app.use((req, res, next) => {
  if (req.path.startsWith('/admin') || req.path.startsWith('/api/auth'))
    return next();
  jsonParser(req, res, (err) => {
    if (err) return next(err);
    urlencodedParser(req, res, next);
  });
});
app.use(cookieParser());
app.use(apiLimiter);

// Better Auth API handler — must be before other /api routes
app.all('/api/auth/*', toNodeHandler(auth));

// Serve Better Auth UI static build
const authUiDist = path.resolve('public', 'auth');
app.use('/auth', express.static(authUiDist));
app.get('/auth/*', (_req, res) => {
  res.sendFile(path.join(authUiDist, 'index.html'));
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', router);

app.use(errorHandler);

export default app;
