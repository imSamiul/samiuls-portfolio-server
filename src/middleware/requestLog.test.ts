import { describe, expect, it } from 'vitest';

import { api } from '../test/helpers.js';

describe('request id', () => {
  it('stamps every response so a log line can be traced back', async () => {
    const response = await api.get('/health').expect(200);

    expect(response.headers['x-request-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('keeps the id the proxy already assigned', async () => {
    const response = await api
      .get('/health')
      .set('x-request-id', 'koyeb-abc123')
      .expect(200);

    expect(response.headers['x-request-id']).toBe('koyeb-abc123');
  });
});
