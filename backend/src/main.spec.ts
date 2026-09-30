import { getCorsConfig } from './main';

describe('Backend Main Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return reflection or specific allowed origins when CORS_ORIGIN is set', () => {
    process.env.CORS_ORIGIN = 'https://game.example.com,http://localhost:3000';
    const config = getCorsConfig();

    expect(config.credentials).toBe(true);
    expect(typeof config.origin).toBe('function');

    const callback = jest.fn();
    (config.origin as Function)('https://game.example.com', callback);
    expect(callback).toHaveBeenCalledWith(null, true);

    const failCallback = jest.fn();
    (config.origin as Function)('https://evil.com', failCallback);
    expect(failCallback).toHaveBeenCalledWith(expect.any(Error), false);
  });

  it('should allow all valid origins in development when CORS_ORIGIN is unset', () => {
    delete process.env.CORS_ORIGIN;
    const config = getCorsConfig();
    expect(config.credentials).toBe(true);
    expect(config.origin).toBe(true);
  });
});
