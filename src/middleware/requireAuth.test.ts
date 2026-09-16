import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import { api, bearer, createAdmin, url } from '../test/helpers.js';

const protectedUrl = url(
  `/project/updateShowOnHomePage/${new Types.ObjectId().toString()}`,
);

describe('requireAuth', () => {
  it('rejects a request with no Authorization header', async () => {
    const response = await api.patch(protectedUrl).expect(401);

    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forged = jwt.sign({ id: 'someone' }, 'the-wrong-secret');

    const response = await api
      .patch(protectedUrl)
      .set('Authorization', bearer(forged))
      .expect(401);

    expect(response.body.code).toBe('ACCESS_TOKEN_INVALID');
  });

  it('lets a valid token through to the handler', async () => {
    const { token } = await createAdmin();

    // 404 rather than 401: auth passed and the project simply does not exist.
    await api
      .patch(protectedUrl)
      .set('Authorization', bearer(token))
      .expect(404);
  });
});
