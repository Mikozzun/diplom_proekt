import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const mockPrisma = {
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      otpChallenge: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      user: { findFirst: jest.fn(), create: jest.fn() },
      credential: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      session: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
