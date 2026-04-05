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
    const { admin, adminRouter } = await setupAdminJS();
    app.use(admin.options.rootPath, adminRouter);
    console.log(`[AdminJS] Panel ready at ${admin.options.rootPath}`);
  } catch (err) {
    console.error('[AdminJS] Setup failed:', err);
  }
};;

start();
