import app from './app';
import { env } from './config/env';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

const start = async () => {
  try {
    const { setupAdminJS } = await import('./admin/index');
    const { admin, adminRouter } = await setupAdminJS();
    app.use(admin.options.rootPath, adminRouter);
    console.log(`AdminJS panel ready at ${admin.options.rootPath}`);
  } catch (err) {
    console.error('AdminJS setup failed:', err);
  }

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`Server running on port ${env.port} [${env.nodeEnv}]`);
  });
};

start();
