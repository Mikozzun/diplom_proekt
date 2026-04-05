import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Adapter, Database, Resource } from '@adminjs/sql';
import Connect from 'connect-pg-simple';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { prisma } from '../config/database';

AdminJS.registerAdapter({ Database, Resource });

const authenticate = async (email: string, password: string) => {
  console.log('[AdminJS Auth] Login attempt:', { username: email });

  const user = await prisma.user.findUnique({
    where: { username: email },
  });
  if (!user) {
    console.log('[AdminJS Auth] User not found:', email);
    return null;
  }
  console.log('[AdminJS Auth] User found:', {
    id: user.id,
    username: user.username,
    hasPasskey: !!user.passkey,
    passkeyLength: user.passkey?.length ?? 0,
  });

  const adminRecord = await prisma.admin.findUnique({
    where: { userId: user.id },
  });
  if (!adminRecord) {
    console.log('[AdminJS Auth] No admin record for userId:', user.id);
    return null;
  }
  console.log('[AdminJS Auth] Admin record found:', {
    adminId: adminRecord.id,
  });

  const valid = await bcrypt.compare(password, user.passkey || '');
  console.log('[AdminJS Auth] Password valid:', valid);
  if (!valid) return null;

  console.log('[AdminJS Auth] Login successful for:', user.username);
  return { email: user.username, id: user.id.toString() };
};

export const setupAdminJS = async () => {
  const dbUrl = new URL(env.directUrl);
  const dbName = dbUrl.pathname.slice(1);

  const db = await new Adapter('postgresql', {
    connectionString: env.directUrl,
    database: dbName,
    schema: 'public',
  }).init();

  const admin = new AdminJS({
    rootPath: '/admin',
    locale: {
      language: 'en',
      translations: {
        en: {
          components: {
            Login: {
              properties: {
                email: 'Username',
                password: 'Password',
              },
            },
          },
        },
      },
    },
    resources: [
      {
        resource: db.table('users'),
        options: {
          navigation: { name: 'Users', icon: 'User' },
          properties: {
            passkey: { isVisible: { list: false, show: false } },
          },
        },
      },
      {
        resource: db.table('admins'),
        options: { navigation: { name: 'Users', icon: 'User' } },
      },
      {
        resource: db.table('roles'),
        options: { navigation: { name: 'Users', icon: 'User' } },
      },
      {
        resource: db.table('user_roles'),
        options: { navigation: { name: 'Users', icon: 'User' } },
      },
      {
        resource: db.table('user_settings'),
        options: { navigation: { name: 'Users', icon: 'User' } },
      },
      {
        resource: db.table('user_activity_log'),
        options: { navigation: { name: 'Users', icon: 'User' } },
      },
      {
        resource: db.table('sessions'),
        options: { navigation: { name: 'Users', icon: 'User' } },
      },
      {
        resource: db.table('passkey_credentials'),
        options: {
          navigation: { name: 'Users', icon: 'User' },
          properties: {
            public_key: { isVisible: { list: false } },
          },
        },
      },
      {
        resource: db.table('posts'),
        options: { navigation: { name: 'Content', icon: 'Document' } },
      },
      {
        resource: db.table('comments'),
        options: { navigation: { name: 'Content', icon: 'Document' } },
      },
      {
        resource: db.table('likes'),
        options: { navigation: { name: 'Content', icon: 'Document' } },
      },
      {
        resource: db.table('bookmarks'),
        options: { navigation: { name: 'Content', icon: 'Document' } },
      },
      {
        resource: db.table('reactions'),
        options: { navigation: { name: 'Content', icon: 'Document' } },
      },
      {
        resource: db.table('polls'),
        options: { navigation: { name: 'Content', icon: 'Document' } },
      },
      {
        resource: db.table('poll_responses'),
        options: { navigation: { name: 'Content', icon: 'Document' } },
      },
      {
        resource: db.table('reports'),
        options: { navigation: { name: 'Moderation', icon: 'Warning' } },
      },
      {
        resource: db.table('moderation_queue'),
        options: {
          navigation: { name: 'Moderation', icon: 'Warning' },
          properties: {
            status: {
              availableValues: [
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ],
            },
          },
        },
      },
      {
        resource: db.table('notifications'),
        options: { navigation: { name: 'System', icon: 'Settings' } },
      },
      {
        resource: db.table('storage'),
        options: { navigation: { name: 'System', icon: 'Settings' } },
      },
      {
        resource: db.table('daily_metrics'),
        options: { navigation: { name: 'Analytics', icon: 'Activity' } },
      },
      {
        resource: db.table('user_post_randomization'),
        options: { navigation: { name: 'System', icon: 'Settings' } },
      },
    ],
  });

  const ConnectSession = Connect(session);
  const sessionStore = new ConnectSession({
    conObject: {
      connectionString: env.directUrl,
      ssl: { rejectUnauthorized: false },
    },
    tableName: 'adminjs_sessions',
    createTableIfMissing: true,
  });

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: 'adminjs',
      cookiePassword: env.sessionSecret,
    },
    null,
    {
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      secret: env.sessionSecret,
      cookie: {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
      },
      name: 'adminjs',
    },
  );

  if (env.nodeEnv !== 'production') {
    admin.watch();
  }

  return { admin, adminRouter };
};
