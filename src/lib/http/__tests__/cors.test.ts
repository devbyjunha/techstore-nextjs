import { getAllowedCorsOrigins } from '../cors-origins';

describe('getAllowedCorsOrigins', () => {
  const original = process.env.TECHSTORE_CORS_ORIGINS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.TECHSTORE_CORS_ORIGINS;
    } else {
      process.env.TECHSTORE_CORS_ORIGINS = original;
    }
  });

  it('defaults to local Flutter web-server origins', () => {
    delete process.env.TECHSTORE_CORS_ORIGINS;
    expect(getAllowedCorsOrigins()).toEqual([
      'http://localhost:8080',
      'http://127.0.0.1:8080',
    ]);
  });

  it('parses comma-separated env origins', () => {
    process.env.TECHSTORE_CORS_ORIGINS = 'http://localhost:8080, http://localhost:9090';
    expect(getAllowedCorsOrigins()).toEqual([
      'http://localhost:8080',
      'http://localhost:9090',
    ]);
  });
});
