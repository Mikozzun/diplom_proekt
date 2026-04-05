import 'dotenv/config';
import pg from 'pg';
import http from 'node:https';

jest.setTimeout(30000);

const { Pool } = pg;

function httpsGet(
  url: string,
  headers?: Record<string, string>,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers, agent: false }, (res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      res.on('end', () => {
        res.destroy();
        resolve({ status: res.statusCode ?? 0, body });
      });
    });
    req.on('error', reject);
  });
}

let pool: pg.Pool;

beforeAll(() => {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
});

afterAll(async () => {
  await pool.end();
});

describe('Supabase DB Connectivity', () => {
  it('DATABASE_URL is set', () => {
    expect(process.env.DATABASE_URL).toBeTruthy();
  });

  it('responds to SELECT NOW()', async () => {
    const { rows } = await pool.query('SELECT NOW()');
    expect(rows).toHaveLength(1);
    expect(rows[0].now).toBeDefined();
  });

  it('schema has tables', async () => {
    const { rows } = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );
    expect(rows.length).toBeGreaterThan(0);
  });

  it.each(['users', 'posts', 'comments', 'roles', 'sessions'])(
    'table "%s" exists',
    async (name) => {
      const { rows } = await pool.query(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = $1",
        [name],
      );
      expect(rows).toHaveLength(1);
    },
  );

  it('users table is queryable', async () => {
    const { rows } = await pool.query('SELECT count(*)::int AS cnt FROM users');
    expect(rows[0].cnt).toBeGreaterThanOrEqual(0);
  });

  it('roles table is queryable', async () => {
    const { rows } = await pool.query('SELECT count(*)::int AS cnt FROM roles');
    expect(rows[0].cnt).toBeGreaterThanOrEqual(0);
  });
});

describe('Clerk Auth Connectivity', () => {
  it('CLERK_SECRET_KEY is set', () => {
    expect(process.env.CLERK_SECRET_KEY).toBeTruthy();
  });

  it('CLERK_PUBLISHABLE_KEY is set', () => {
    expect(process.env.CLERK_PUBLISHABLE_KEY).toBeTruthy();
  });

  it('Clerk API responds to GET /v1/users', async () => {
    const res = await httpsGet('https://api.clerk.com/v1/users?limit=1', {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    });
    expect(res.status).toBe(200);
    const data = JSON.parse(res.body);
    expect(Array.isArray(data)).toBe(true);
  });

  it('Clerk JWKS endpoint is reachable', async () => {
    const frontendApi = process.env.CLERK_FRONTEND_API;
    if (!frontendApi) return;

    const res = await httpsGet(`${frontendApi}/.well-known/jwks.json`);
    expect(res.status).toBe(200);
    const jwks = JSON.parse(res.body) as { keys?: unknown[] };
    expect(jwks.keys).toBeDefined();
    expect(jwks.keys!.length).toBeGreaterThan(0);
  });
});
