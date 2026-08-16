import { TestApi } from './api.client';
import { createTestApp } from './test-app';

describe('AppController (e2e)', () => {
  let api: TestApi;

  beforeEach(async () => {
    const { httpServer } = await createTestApp({
      globalPrefix: false,
      validationPipe: false,
    });

    api = new TestApi(httpServer);
  });

  it('/ (GET)', async () => {
    const body = await api.get<string>('/', { expect: 200 });
    expect(body).toBe('Hello World!');
  });
});
