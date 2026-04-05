import app from '../src/app';

// AdminJS requires a persistent process — skip on Vercel serverless
if (!process.env.VERCEL) {
  import('../src/admin/index').then(({ setupAdminJS }) => {
    setupAdminJS()
      .then(({ admin, adminRouter }) => {
        app.use(admin.options.rootPath, adminRouter);
        console.log(`AdminJS panel ready at ${admin.options.rootPath}`);
      })
      .catch((err) => console.error('AdminJS setup failed:', err));
  });
}

export default app;
