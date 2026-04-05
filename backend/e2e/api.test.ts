import 'dotenv/config';

jest.setTimeout(30000);

const BASE = `http://localhost:${process.env.PORT || 3000}`;

let accessToken = '';
let userId = '';
let postId = '';
let commentId = '';

const rand = Math.random().toString(36).slice(2, 8);
const testUser = {
  username: `e2e_${rand}`,
  phoneNumber: `+1${Date.now().toString().slice(-10)}`,
  passkey: 'testpass123',
};

async function api(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { status: res.status, data };
}

describe('E2E API Tests', () => {
  describe('Health', () => {
    it('GET /health returns 200 with status ok', async () => {
      const res = await api('GET', '/health');
      expect(res.status).toBe(200);
      expect(res.data.status).toBe('ok');
    });
  });

  describe('Auth: Register', () => {
    it('POST /api/auth/register creates a new user', async () => {
      const res = await api('POST', '/api/auth/register', testUser);
      expect(res.status).toBe(201);
      userId = res.data.data.id;
      expect(userId).toBeTruthy();
    });

    it('POST /api/auth/register rejects duplicate', async () => {
      const res = await api('POST', '/api/auth/register', testUser);
      expect(res.status).toBe(409);
    });
  });

  describe('Auth: Login', () => {
    it('POST /api/auth/login returns access token', async () => {
      const res = await api('POST', '/api/auth/login', {
        username: testUser.username,
        passkey: testUser.passkey,
      });
      expect(res.status).toBe(200);
      accessToken = res.data.data.accessToken;
      expect(accessToken).toBeTruthy();
    });
  });

  describe('User: Profile', () => {
    it('GET /api/users/me returns current user', async () => {
      const res = await api('GET', '/api/users/me', undefined, accessToken);
      expect(res.status).toBe(200);
      expect(res.data.data.username).toBe(testUser.username);
    });

    it('PUT /api/users/me updates profile', async () => {
      const res = await api(
        'PUT',
        '/api/users/me',
        { username: testUser.username },
        accessToken,
      );
      expect(res.status).toBe(200);
    });

    it('GET /api/users/me/settings returns settings', async () => {
      const res = await api(
        'GET',
        '/api/users/me/settings',
        undefined,
        accessToken,
      );
      expect(res.status).toBe(200);
    });

    it('PUT /api/users/me/settings updates settings', async () => {
      const res = await api(
        'PUT',
        '/api/users/me/settings',
        { theme: 'dark' },
        accessToken,
      );
      expect(res.status).toBe(200);
    });

    it('GET /api/users/me/sessions returns sessions', async () => {
      const res = await api(
        'GET',
        '/api/users/me/sessions',
        undefined,
        accessToken,
      );
      expect(res.status).toBe(200);
    });
  });

  describe('Posts', () => {
    it('POST /api/posts creates a post', async () => {
      const res = await api(
        'POST',
        '/api/posts',
        { content: `E2E test post ${rand}` },
        accessToken,
      );
      expect(res.status).toBe(201);
      postId = res.data.data.id;
      expect(postId).toBeTruthy();
    });

    it('GET /api/posts lists posts', async () => {
      const res = await api('GET', '/api/posts');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('GET /api/posts/:id returns a single post', async () => {
      const res = await api('GET', `/api/posts/${postId}`);
      expect(res.status).toBe(200);
    });

    it('PUT /api/posts/:id updates a post', async () => {
      const res = await api(
        'PUT',
        `/api/posts/${postId}`,
        { content: `Updated ${rand}` },
        accessToken,
      );
      expect(res.status).toBe(200);
    });
  });

  describe('Comments', () => {
    it('POST /api/posts/:id/comments creates a comment', async () => {
      const res = await api(
        'POST',
        `/api/posts/${postId}/comments`,
        { content: `E2E comment ${rand}` },
        accessToken,
      );
      expect(res.status).toBe(201);
      commentId = res.data.data.id;
    });

    it('GET /api/posts/:id/comments lists comments', async () => {
      const res = await api('GET', `/api/posts/${postId}/comments`);
      expect(res.status).toBe(200);
    });

    it('PUT /api/comments/:id updates a comment', async () => {
      const res = await api(
        'PUT',
        `/api/comments/${commentId}`,
        { content: `Updated comment ${rand}` },
        accessToken,
      );
      expect(res.status).toBe(200);
    });
  });

  describe('Engagement', () => {
    it('POST /api/posts/:id/like likes a post', async () => {
      const res = await api(
        'POST',
        `/api/posts/${postId}/like`,
        undefined,
        accessToken,
      );
      expect([200, 201]).toContain(res.status);
    });

    it('POST /api/posts/:id/bookmark bookmarks a post', async () => {
      const res = await api(
        'POST',
        `/api/posts/${postId}/bookmark`,
        undefined,
        accessToken,
      );
      expect([200, 201]).toContain(res.status);
    });

    it('GET /api/bookmarks returns bookmarks', async () => {
      const res = await api('GET', '/api/bookmarks', undefined, accessToken);
      expect(res.status).toBe(200);
    });
  });

  describe('Notifications', () => {
    it('GET /api/notifications returns notifications', async () => {
      const res = await api(
        'GET',
        '/api/notifications',
        undefined,
        accessToken,
      );
      expect(res.status).toBe(200);
    });
  });

  describe('Reports', () => {
    it('POST /api/reports creates a report', async () => {
      const res = await api(
        'POST',
        '/api/reports',
        { reportType: 'spam', description: 'E2E test report' },
        accessToken,
      );
      expect(res.status).toBe(201);
    });
  });

  describe('Auth Guards', () => {
    it('GET /api/users/me without token returns 401', async () => {
      const res = await api('GET', '/api/users/me');
      expect(res.status).toBe(401);
    });

    it('POST /api/posts with bad token returns 401', async () => {
      const res = await api(
        'POST',
        '/api/posts',
        { content: 'x' },
        'bad-token',
      );
      expect(res.status).toBe(401);
    });
  });

  describe('Cleanup', () => {
    it('DELETE comment', async () => {
      if (!commentId) return;
      const res = await api(
        'DELETE',
        `/api/comments/${commentId}`,
        undefined,
        accessToken,
      );
      expect([200, 204]).toContain(res.status);
    });

    it('DELETE post', async () => {
      const res = await api(
        'DELETE',
        `/api/posts/${postId}`,
        undefined,
        accessToken,
      );
      expect([200, 204]).toContain(res.status);
    });

    it('DELETE account', async () => {
      const res = await api('DELETE', '/api/users/me', undefined, accessToken);
      expect([200, 204]).toContain(res.status);
    });
  });
});
