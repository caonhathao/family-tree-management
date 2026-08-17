import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'http';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';

export interface ValidationPipeOptions {
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  transform?: boolean;
}

export interface CreateTestAppOptions {
  globalPrefix?: string | false;
  validationPipe?: ValidationPipeOptions | false;
  allExceptionsFilter?: boolean;
}

export interface TestAppContext {
  app: INestApplication;
  prisma: PrismaService;
  httpServer: Server;
}

export const createTestApp = async ({
  globalPrefix = 'api',
  validationPipe = {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  },
  allExceptionsFilter = false,
}: CreateTestAppOptions = {}): Promise<TestAppContext> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const prisma = moduleFixture.get<PrismaService>(PrismaService);

  if (globalPrefix !== false) {
    app.setGlobalPrefix(globalPrefix);
  }
  if (validationPipe !== false) {
    app.useGlobalPipes(new ValidationPipe(validationPipe));
  }
  if (allExceptionsFilter) {
    app.useGlobalFilters(new AllExceptionsFilter());
  }

  await app.init();

  return {
    app,
    prisma,
    httpServer: app.getHttpServer() as unknown as Server,
  };
};
