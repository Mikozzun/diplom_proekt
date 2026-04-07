import app from './app';
import { env } from './config/env';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const start = async () => {
  // Start server first so health checks pass while AdminJS initializes
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });

  try {
    console.log('[AdminJS] Starting setup...');
    const { setupAdminJS } = await import('./admin/index');
    console.log('[AdminJS] Module imported, initializing...');
    const { admin, adminRouter, guardRouter } = await setupAdminJS();

    // Debug middleware: log cookie/proxy state on admin requests
    app.use(admin.options.rootPath, (req, res, next) => {
      if (req.path === '/login' || req.path === '/') {
        console.log(`[AdminJS Request] ${req.method} ${req.path}`, {
          cookieHeader: req.headers.cookie
            ? req.headers.cookie.replace(/=.*/g, '=...')
            : 'missing',
          proto: req.protocol,
          secure: req.secure,
          xForwardedProto: req.headers['x-forwarded-proto'],
        });
      }
      next();
    });

    // Mount guard BEFORE adminRouter to intercept login
    app.use(admin.options.rootPath, guardRouter);
    app.use(admin.options.rootPath, adminRouter);
    console.log(`[AdminJS] Panel ready at ${admin.options.rootPath}`);
  } catch (err) {
    console.error('[AdminJS] Setup failed:', err);
  }
};;

start();
