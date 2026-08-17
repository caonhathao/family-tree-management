import request, { Test } from 'supertest';
import { Server } from 'http';

export interface RequestOptions {
  token?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  expect?: number;
}

export interface UploadFile {
  fieldName: string;
  buffer: Buffer;
  filename: string;
}

export class TestApi {
  constructor(
    private readonly server: Server,
    private readonly prefix = '',
  ) {}

  private prepare(req: Test, options: RequestOptions = {}): Test {
    if (options.token) {
      req = req.set('Authorization', `Bearer ${options.token}`);
    }
    if (options.query) {
      req = req.query(options.query);
    }
    if (options.headers) {
      req = req.set(options.headers);
    }
    if (options.expect !== undefined) {
      req = req.expect(options.expect);
    }
    return req;
  }

  async post<T>(
    path: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<T> {
    const req = this.prepare(
      request(this.server).post(`${this.prefix}${path}`).send(body),
      options,
    );
    return (await req).body as T;
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const req = this.prepare(
      request(this.server).get(`${this.prefix}${path}`),
      options,
    );
    return (await req).body as T;
  }

  async patch<T>(
    path: string,
    body?: object | string,
    options?: RequestOptions,
  ): Promise<T> {
    const req = this.prepare(
      request(this.server).patch(`${this.prefix}${path}`).send(body),
      options,
    );
    return (await req).body as T;
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    const req = this.prepare(
      request(this.server).delete(`${this.prefix}${path}`),
      options,
    );
    return (await req).body as T;
  }

  async upload<T>(
    method: 'post' | 'patch',
    path: string,
    fields: Record<string, string> = {},
    files: UploadFile[] = [],
    options?: RequestOptions,
  ): Promise<T> {
    let req = this.prepare(
      request(this.server)[method](`${this.prefix}${path}`),
      options,
    );
    for (const [key, value] of Object.entries(fields)) {
      req = req.field(key, value);
    }
    for (const file of files) {
      req = req.attach(file.fieldName, file.buffer, file.filename);
    }
    return (await req).body as T;
  }
}
