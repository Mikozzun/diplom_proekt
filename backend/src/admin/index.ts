import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Adapter, Database, Resource } from '@adminjs/sql';
import Connect from 'connect-pg-simple';
import session from 'express-session';
import express, { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pg from 'pg';
import { env } from '../config/env';
import { prisma } from '../config/database';

AdminJS.registerAdapter({ Database, Resource });

// Direct pg pool for adminjs_sessions queries (separate from Prisma)
const sessionPool = new pg.Pool({
  connectionString: env.directUrl,
  max: 2,
  ssl: { rejectUnauthorized: false },
});

const destroyOtherAdminSessions = async (keepSid?: string): Promise<number> => {
  const where = keepSid ? `WHERE sid != $1` : '';
  const params = keepSid ? [keepSid] : [];
  const result = await sessionPool.query(
    `DELETE FROM adminjs_sessions ${where}`,
    params,
  );
  return result.rowCount ?? 0;
};

const countActiveSessions = async (excludeSid?: string): Promise<number> => {
  const where = excludeSid
    ? `WHERE sid != $1 AND expire > NOW()`
    : `WHERE expire > NOW()`;
  const params = excludeSid ? [excludeSid] : [];
  const result = await sessionPool.query(
    `SELECT COUNT(*)::int AS cnt FROM adminjs_sessions ${where}`,
    params,
  );
  return result.rows[0]?.cnt ?? 0;
};

const verifyCredentials = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { username: email },
  });
  if (!user) return null;

  const adminRecord = await prisma.admin.findUnique({
    where: { userId: user.id },
  });
  if (!adminRecord) return null;

  const valid = await bcrypt.compare(password, user.passkey || '');
  if (!valid) return null;

  return { email: user.username, id: user.id.toString() };
};

// In-memory store for pending takeover credentials (2-min TTL)
const pendingTakeovers = new Map<
  string,
  { email: string; password: string; expires: number }
>();

// Cleanup expired entries every 60s
setInterval(() => {
  const now = Date.now();
  for (const [id, data] of pendingTakeovers) {
    if (now > data.expires) pendingTakeovers.delete(id);
  }
}, 60_000).unref();

const authenticate = async (
  email: string,
  password: string,
  context?: { req: express.Request; res: express.Response },
) => {
  console.log('[AdminJS Auth] Login attempt:', { username: email });
  const result = await verifyCredentials(email, password);
  if (!result) {
    console.log('[AdminJS Auth] Credentials invalid for:', email);
    return null;
  }

  if (context?.req && context?.res) {
    const { req, res } = context;

    // If force-login cookie is set, skip session check
    if (req.cookies?.adminForceLogin) {
      res.clearCookie('adminForceLogin', { path: '/admin' });
      await destroyOtherAdminSessions(req.sessionID);
      console.log('[AdminJS Auth] Force login successful for:', result.email);
      return result;
    }

    // Check for other active sessions
    const others = await countActiveSessions(req.sessionID);
    if (others > 0) {
      const takeoverId = crypto.randomUUID();
      pendingTakeovers.set(takeoverId, {
        email,
        password,
        expires: Date.now() + 120_000,
      });
      res.cookie('adminTakeoverId', takeoverId, {
        maxAge: 120_000,
        httpOnly: true,
        sameSite: 'lax',
        path: '/admin',
        secure: env.nodeEnv === 'production',
      });
      console.log(
        '[AdminJS Auth] Other sessions detected, takeover pending for:',
        result.email,
      );
      return null;
    }
  }

  console.log('[AdminJS Auth] Login successful for:', result.email);
  return result;
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

  sessionStore.on('error', (err: Error) => {
    console.error('[AdminJS Session Store] Error:', err);
  });

  console.log('[AdminJS] Session store created, table: adminjs_sessions');

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
      resave: true,
      saveUninitialized: false,
      secret: env.sessionSecret,
      cookie: {
        httpOnly: true,
        secure: env.nodeEnv === 'production',
        sameSite: 'lax' as const,
        maxAge: 24 * 60 * 60 * 1000,
      },
      name: 'adminjs',
    },
  );

  // Single-session enforcement router (mounted BEFORE adminRouter)
  const guardRouter = Router();

  // Intercept GET /login — redirect to confirmation if takeover pending
  guardRouter.get('/login', (req, res, next) => {
    const takeoverId = req.cookies?.adminTakeoverId;
    if (takeoverId && pendingTakeovers.has(takeoverId)) {
      res.clearCookie('adminTakeoverId', { path: '/admin' });
      return res.redirect(
        `/admin/confirm-takeover?id=${encodeURIComponent(takeoverId)}`,
      );
    }
    next();
  });

  // Serve the "kick other session?" confirmation page
  guardRouter.get('/confirm-takeover', (req, res) => {
    const takeoverId = req.query.id as string;
    if (!takeoverId || !pendingTakeovers.has(takeoverId)) {
      return res.redirect('/admin/login');
    }
    res.status(200).send(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Active Session Detected</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:system-ui,-apple-system,sans-serif;background:#1e1e2e;color:#cdd6f4;
    display:flex;align-items:center;justify-content:center;min-height:100vh}
  .card{background:#313244;border-radius:12px;padding:2.5rem;max-width:420px;width:90%;
    text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.3)}
  h2{margin-bottom:.75rem;color:#f38ba8;font-size:1.4rem}
  p{margin-bottom:1.5rem;line-height:1.5;color:#a6adc8;font-size:.95rem}
  form{display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap}
  button{padding:.7rem 1.5rem;border:none;border-radius:8px;font-size:.95rem;
    cursor:pointer;font-weight:600;transition:transform .1s}
  button:active{transform:scale(.97)}
  .yes{background:#f38ba8;color:#1e1e2e}
  .no{background:#45475a;color:#cdd6f4}
</style></head><body>
<div class="card">
  <h2>Another admin session is active</h2>
  <p>Only one admin session can be active at a time. Do you want to end the other session and continue here?</p>
  <form method="POST" action="/admin/force-login">
    <input type="hidden" name="takeoverId" value="${takeoverId}">
    <button type="submit" class="yes">Yes, take over</button>
    <a href="/admin/login"><button type="button" class="no">Cancel</button></a>
  </form>
</div>
</body></html>`);
  });

  // Force login — destroy sessions, set cookie, auto-submit to AdminJS login
  guardRouter.post(
    '/force-login',
    express.urlencoded({ extended: false }),
    async (req, res) => {
      try {
        const takeoverId = req.body.takeoverId;
        const pending = pendingTakeovers.get(takeoverId);
        if (!pending || Date.now() > pending.expires) {
          if (takeoverId) pendingTakeovers.delete(takeoverId);
          return res.redirect('/admin/login');
        }

        const user = await verifyCredentials(pending.email, pending.password);
        if (!user) {
          pendingTakeovers.delete(takeoverId);
          return res.redirect('/admin/login');
        }

        const destroyed = await destroyOtherAdminSessions();
        console.log(
          `[AdminJS Guard] Destroyed ${destroyed} sessions for takeover by ${user.email}`,
        );

        // Set cookie so authenticate() skips session check on next login
        res.cookie('adminForceLogin', '1', {
          maxAge: 30_000,
          httpOnly: true,
          sameSite: 'lax',
          path: '/admin',
          secure: env.nodeEnv === 'production',
        });

        const { email, password } = pending;
        pendingTakeovers.delete(takeoverId);

        // Auto-submit login form directly to AdminJS (no guard interception)
        res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><script>
const f=document.createElement('form');
f.method='POST';f.action='/admin/login';
const e=document.createElement('input');e.name='email';e.value=${JSON.stringify(email)};f.appendChild(e);
const p=document.createElement('input');p.name='password';p.value=${JSON.stringify(password)};f.appendChild(p);
document.body.appendChild(f);f.submit();
</script></head><body></body></html>`);
      } catch (err) {
        console.error('[AdminJS Guard] Force login error:', err);
        res.redirect('/admin/login');
      }
    },
  );

  if (env.nodeEnv !== 'production') {
    admin.watch();
  }

  return { admin, adminRouter, guardRouter };
};
