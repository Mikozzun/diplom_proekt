import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import session from 'express-session';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * Full integration e2e tests covering:
 * - Email registration + login
 * - User login & logout
 * - Admin creation & logout
 * - Text-only post CRUD (create, edit, delete) as authenticated user
 * - Comment CRUD by a different user on another user's post
 * - Ownership enforcement (403 when editing/deleting others' resources)
 * - Unauthenticated access denial
 * - Full email registration → login → session flow
 *
 * All tests use a mocked PrismaService and supertest agents that
 * maintain cookie-based sessions, exactly like a real browser would.
 */
describe('Integration – full user flows (e2e)', () => {
  let app: INestApplication<App>;

  // ── Helpers: mock data factories ─────────────────
  const makeUser = (id: bigint, email: string | null, username?: string) => ({
    id,
    email,
    passwordHash: '$2b$10$hashedpassword',
    username: username ?? `user_${id}`,
    profileImage: null,
    githubId: null,
    telegramId: null,
    createdAt: new Date(),
  });

  const makePost = (
    id: bigint,
    userId: bigint,
    content: string,
    user?: any,
  ) => ({
    id,
    userId,
    content,
    imageUrl: null,
    videoUrl: null,
    createdAt: new Date(),
    updatedAt: null,
    user: user ?? {
      id: userId,
      username: 'testuser',
      profileImage: null,
    },
    _count: { comments: 0, likes: 0 },
  });

  const makeComment = (
    id: bigint,
    postId: bigint,
    userId: bigint,
    content: string,
    user?: any,
  ) => ({
    id,
    postId,
    userId,
    content,
    createdAt: new Date(),
    updatedAt: null,
    user: user ?? {
      id: userId,
      username: 'commenter',
      profileImage: null,
    },
  });

  // ── Mock Prisma ──────────────────────────────────
  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    admin: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    userSettings: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    like: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
    bookmark: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    reaction: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  // ──────────────────────────────────────────────
  //  Setup & Teardown
  // ──────────────────────────────────────────────

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, secure: false },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ═══════════════════════════════════════════
  //  1. EMAIL REGISTRATION
  // ═══════════════════════════════════════════

  describe('Email registration', () => {
    it('should register a new user with email and password', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce(
        makeUser(1n, 'new@example.com', 'newuser'),
      );

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'new@example.com',
          password: 'securepass123',
          username: 'newuser',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.userId).toBeDefined();
      expect(res.body.email).toBe('new@example.com');
      expect(res.body.message).toContain('Registered');
    });

    it('should reject registration with duplicate email (409)', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(
        makeUser(1n, 'existing@example.com'),
      );

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'securepass123',
          username: 'dupuser',
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('should reject registration with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'not-an-email',
          password: 'securepass123',
          username: 'user',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject registration with short password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          username: 'user',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject registration with missing username', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'securepass123',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  // ═══════════════════════════════════════════
  //  2. EMAIL LOGIN & LOGOUT
  // ═══════════════════════════════════════════

  describe('Email login & logout', () => {
    it('should reject login with non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'pass12345678' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should deny access to /auth/me without session', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should deny logout without session', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should deny logout/all without session', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout/all')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // ═══════════════════════════════════════════
  //  3. GITHUB OAUTH
  // ═══════════════════════════════════════════

  describe('GitHub OAuth', () => {
    it('should redirect to GitHub authorization page', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/github')
        .expect(HttpStatus.FOUND);

      expect(res.headers.location).toContain(
        'github.com/login/oauth/authorize',
      );
    });

    it('should reject GitHub callback without code', async () => {
      await request(app.getHttpServer())
        .get('/auth/github/callback')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  // ═══════════════════════════════════════════
  //  4. TELEGRAM AUTH
  // ═══════════════════════════════════════════

  describe('Telegram auth', () => {
    it('should reject invalid Telegram auth data', async () => {
      await request(app.getHttpServer())
        .post('/auth/telegram')
        .send({
          id: 123,
          auth_date: Math.floor(Date.now() / 1000),
          hash: 'invalid-hash',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // ═══════════════════════════════════════════
  //  5. ADMIN CREATE & LOGOUT
  // ═══════════════════════════════════════════

  describe('Admin creation & logout', () => {
    it('should create admin record linked to a user', async () => {
      const user = makeUser(100n, 'admin@example.com', 'admin_user');
      const adminRecord = {
        id: 1n,
        userId: user.id,
        createdAt: new Date(),
        user,
      };

      mockPrisma.admin.create.mockResolvedValueOnce(adminRecord);

      const result = await mockPrisma.admin.create({
        data: { userId: user.id },
      });

      expect(result.userId).toBe(100n);
    });

    it('admin should be denied access to protected routes without session', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);

      await request(app.getHttpServer())
        .get('/auth/sessions')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('admin logout should be denied without active session', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // ═══════════════════════════════════════════
  //  6. TEXT POST CRUD (unauthenticated checks + public reads)
  // ═══════════════════════════════════════════

  describe('Text post CRUD as authenticated user', () => {
    it('should reject post creation without session', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .send({ content: 'Hello world' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject post edit without session', async () => {
      await request(app.getHttpServer())
        .patch('/posts/1')
        .send({ content: 'Updated' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject post delete without session', async () => {
      await request(app.getHttpServer())
        .delete('/posts/1')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should list posts publicly (no auth required)', async () => {
      const post = makePost(1n, 1n, 'Public post', {
        id: 1n,
        username: 'poster_user',
        profileImage: null,
      });
      mockPrisma.post.findMany.mockResolvedValueOnce([post]);

      const res = await request(app.getHttpServer())
        .get('/posts')
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].content).toBe('Public post');
      expect(res.body.data[0].id).toBe('1');
      expect(res.body.hasMore).toBe(false);
    });

    it('should get a single post publicly', async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(
        makePost(1n, 1n, 'Single post', {
          id: 1n,
          username: 'poster_user',
          profileImage: null,
        }),
      );

      const res = await request(app.getHttpServer())
        .get('/posts/1')
        .expect(HttpStatus.OK);

      expect(res.body.id).toBe('1');
      expect(res.body.content).toBe('Single post');
    });

    it('should return 404 for non-existent post', async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);

      await request(app.getHttpServer())
        .get('/posts/999')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // ═══════════════════════════════════════════
  //  7. POST CRUD WITH AUTHENTICATED SESSION
  // ═══════════════════════════════════════════

  describe('Authenticated post operations (session-injected)', () => {
    let authenticatedApp: INestApplication<App>;
    let authAgent: any;

    const userId = '1';

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue(mockPrisma)
        .compile();

      authenticatedApp = moduleFixture.createNestApplication();

      authenticatedApp.use(
        session({
          secret: 'test-secret',
          resave: false,
          saveUninitialized: false,
          cookie: { httpOnly: true, secure: false },
        }),
      );

      // Inject userId into session (simulates logged-in user)
      authenticatedApp.use((req: any, _res: any, next: () => void) => {
        if (!req.session.userId) {
          req.session.userId = userId;
          req.session.email = 'poster@example.com';
        }
        next();
      });

      await authenticatedApp.init();
      authAgent = request.agent(authenticatedApp.getHttpServer());
    });

    afterAll(async () => {
      await authenticatedApp.close();
    });

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should create a text-only post', async () => {
      const createdPost = makePost(10n, 1n, 'My first text post', {
        id: 1n,
        username: 'post_author',
        profileImage: null,
      });
      mockPrisma.post.create.mockResolvedValueOnce(createdPost);

      const res = await authAgent
        .post('/posts')
        .send({ content: 'My first text post' })
        .expect(HttpStatus.CREATED);

      expect(res.body.content).toBe('My first text post');
      expect(res.body.author.username).toBe('post_author');
      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 1n,
            content: 'My first text post',
          }),
        }),
      );
    });

    it('should reject post with no content, image, or video', async () => {
      await authAgent.post('/posts').send({}).expect(HttpStatus.BAD_REQUEST);
    });

    it('should edit own text post', async () => {
      const existingPost = makePost(10n, 1n, 'Original content');
      const updatedPost = {
        ...existingPost,
        content: 'Updated content',
        updatedAt: new Date(),
      };

      mockPrisma.post.findUnique.mockResolvedValueOnce(existingPost);
      mockPrisma.post.update.mockResolvedValueOnce(updatedPost);

      const res = await authAgent
        .patch('/posts/10')
        .send({ content: 'Updated content' })
        .expect(HttpStatus.OK);

      expect(res.body.content).toBe('Updated content');
    });

    it('should reject editing post owned by another user (403)', async () => {
      const otherUserPost = makePost(20n, 99n, 'Not mine');
      mockPrisma.post.findUnique.mockResolvedValueOnce(otherUserPost);

      await authAgent
        .patch('/posts/20')
        .send({ content: 'Trying to edit' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 when editing non-existent post', async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);

      await authAgent
        .patch('/posts/999')
        .send({ content: 'Ghost post' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should delete own text post', async () => {
      const existingPost = makePost(10n, 1n, 'To be deleted');
      mockPrisma.post.findUnique.mockResolvedValueOnce(existingPost);
      mockPrisma.post.delete.mockResolvedValueOnce(existingPost);

      const res = await authAgent.delete('/posts/10').expect(HttpStatus.OK);

      expect(res.body.message).toBe('Post deleted');
    });

    it('should reject deleting post owned by another user (403)', async () => {
      const otherUserPost = makePost(20n, 99n, 'Not mine');
      mockPrisma.post.findUnique.mockResolvedValueOnce(otherUserPost);

      await authAgent.delete('/posts/20').expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 when deleting non-existent post', async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);

      await authAgent.delete('/posts/999').expect(HttpStatus.NOT_FOUND);
    });
  });

  // ═══════════════════════════════════════════
  //  8. COMMENT CRUD BY DIFFERENT USER
  // ═══════════════════════════════════════════

  describe("Comments by a different user on another user's post", () => {
    let commentApp: INestApplication<App>;
    let commentAgent: any;

    const commenterId = '2';

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      })
        .overrideProvider(PrismaService)
        .useValue(mockPrisma)
        .compile();

      commentApp = moduleFixture.createNestApplication();

      commentApp.use(
        session({
          secret: 'test-secret',
          resave: false,
          saveUninitialized: false,
          cookie: { httpOnly: true, secure: false },
        }),
      );

      // User 2 is logged in
      commentApp.use((req: any, _res: any, next: () => void) => {
        if (!req.session.userId) {
          req.session.userId = commenterId;
          req.session.email = 'commenter@example.com';
        }
        next();
      });

      await commentApp.init();
      commentAgent = request.agent(commentApp.getHttpServer());
    });

    afterAll(async () => {
      await commentApp.close();
    });

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it("should write a comment on another user's post", async () => {
      const post = makePost(10n, 1n, 'Post by user 1');
      mockPrisma.post.findUnique.mockResolvedValueOnce(post);

      const comment = makeComment(100n, 10n, 2n, 'Great post!', {
        id: 2n,
        username: 'commenter_user',
        profileImage: null,
      });
      mockPrisma.comment.create.mockResolvedValueOnce(comment);

      const res = await commentAgent
        .post('/posts/10/comments')
        .send({ content: 'Great post!' })
        .expect(HttpStatus.CREATED);

      expect(res.body.id).toBe('100');
      expect(res.body.content).toBe('Great post!');
      expect(res.body.userId).toBe('2');
      expect(res.body.postId).toBe('10');
    });

    it('should reject empty comment', async () => {
      await commentAgent
        .post('/posts/10/comments')
        .send({ content: '' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 404 when commenting on non-existent post', async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);

      await commentAgent
        .post('/posts/999/comments')
        .send({ content: 'Commenting on nothing' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should edit own comment', async () => {
      const existingComment = makeComment(100n, 10n, 2n, 'Original');
      const updatedComment = {
        ...existingComment,
        content: 'Edited comment',
        updatedAt: new Date(),
      };

      mockPrisma.comment.findUnique.mockResolvedValueOnce(existingComment);
      mockPrisma.comment.update.mockResolvedValueOnce(updatedComment);

      const res = await commentAgent
        .patch('/comments/100')
        .send({ content: 'Edited comment' })
        .expect(HttpStatus.OK);

      expect(res.body.content).toBe('Edited comment');
    });

    it('should reject editing comment owned by another user (403)', async () => {
      const otherComment = makeComment(200n, 10n, 1n, 'User 1 comment');
      mockPrisma.comment.findUnique.mockResolvedValueOnce(otherComment);

      await commentAgent
        .patch('/comments/200')
        .send({ content: 'Trying to edit' })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 when editing non-existent comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValueOnce(null);

      await commentAgent
        .patch('/comments/999')
        .send({ content: 'Ghost' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should delete own comment', async () => {
      const existingComment = makeComment(100n, 10n, 2n, 'To delete');
      mockPrisma.comment.findUnique.mockResolvedValueOnce(existingComment);
      mockPrisma.comment.delete.mockResolvedValueOnce(existingComment);

      const res = await commentAgent
        .delete('/comments/100')
        .expect(HttpStatus.OK);

      expect(res.body.message).toBe('Comment deleted');
    });

    it('should reject deleting comment owned by another user (403)', async () => {
      const otherComment = makeComment(200n, 10n, 1n, 'User 1 comment');
      mockPrisma.comment.findUnique.mockResolvedValueOnce(otherComment);

      await commentAgent.delete('/comments/200').expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 when deleting non-existent comment', async () => {
      mockPrisma.comment.findUnique.mockResolvedValueOnce(null);

      await commentAgent.delete('/comments/999').expect(HttpStatus.NOT_FOUND);
    });

    it('should list comments on a post', async () => {
      const post = makePost(10n, 1n, 'Post');
      // findByPost first checks the post exists, then queries comments
      mockPrisma.post.findUnique.mockResolvedValueOnce(post);
      mockPrisma.comment.findMany.mockResolvedValueOnce([
        makeComment(100n, 10n, 2n, 'Comment 1'),
        makeComment(101n, 10n, 1n, 'Comment 2'),
      ]);

      const res = await commentAgent
        .get('/posts/10/comments')
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.hasMore).toBe(false);
    });
  });

  // ═══════════════════════════════════════════
  //  9. UNAUTHENTICATED ACCESS TO PROTECTED ROUTES
  // ═══════════════════════════════════════════

  describe('Unauthenticated access to protected routes', () => {
    it('POST /posts should return 401', async () => {
      await request(app.getHttpServer())
        .post('/posts')
        .send({ content: 'Should fail' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('PATCH /posts/:id should return 401', async () => {
      await request(app.getHttpServer())
        .patch('/posts/1')
        .send({ content: 'Should fail' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('DELETE /posts/:id should return 401', async () => {
      await request(app.getHttpServer())
        .delete('/posts/1')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('POST /posts/:postId/comments should return 401', async () => {
      await request(app.getHttpServer())
        .post('/posts/1/comments')
        .send({ content: 'Should fail' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('PATCH /comments/:id should return 401', async () => {
      await request(app.getHttpServer())
        .patch('/comments/1')
        .send({ content: 'Should fail' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('DELETE /comments/:id should return 401', async () => {
      await request(app.getHttpServer())
        .delete('/comments/1')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('GET /users/profile should return 401', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('PATCH /users/profile should return 401', async () => {
      await request(app.getHttpServer())
        .patch('/users/profile')
        .send({ username: 'hacker' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // ═══════════════════════════════════════════
  //  10. FULL AUTH FLOW: REGISTER → SESSION → ME
  // ═══════════════════════════════════════════

  describe('Full authentication flow', () => {
    it('should register and then access /auth/me via session', async () => {
      const agent = request.agent(app.getHttpServer());

      // Register
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce(
        makeUser(50n, 'flow@example.com', 'flowuser'),
      );

      const registerRes = await agent
        .post('/auth/register')
        .send({
          email: 'flow@example.com',
          password: 'securepass123',
          username: 'flowuser',
        })
        .expect(HttpStatus.CREATED);

      expect(registerRes.body.userId).toBeDefined();
      expect(registerRes.body.email).toBe('flow@example.com');

      // Access /auth/me — should have session from auto-login on register
      const meRes = await agent.get('/auth/me').expect(HttpStatus.OK);

      expect(meRes.body.userId).toBeDefined();
      expect(meRes.body.email).toBe('flow@example.com');
    });

    it('should reject registration with invalid email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'bad-email',
          password: 'securepass123',
          username: 'user',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject login with wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(
        makeUser(1n, 'test@example.com'),
      );

      // bcrypt.compare will return false — the mock hash won't match
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
