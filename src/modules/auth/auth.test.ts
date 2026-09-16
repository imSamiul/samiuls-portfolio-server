import { describe, expect, it } from 'vitest';

import { env } from '../../config/env.js';
import { ADMIN_PASSWORD, api, createAdmin, url } from '../../test/helpers.js';

const adminEmail = env.ADMIN_EMAIL;

describe('sign up', () => {
  it('creates the admin and never returns the password', async () => {
    const response = await api
      .post(url('/auth/signUp'))
      .send({ email: adminEmail, password: ADMIN_PASSWORD })
      .expect(201);

    expect(response.body.data.token).toBeTypeOf('string');
    expect(response.body.data.user.email).toBe(adminEmail);
    expect(response.body.data.user.password).toBeUndefined();
  });

  it('turns away any other address', async () => {
    const response = await api
      .post(url('/auth/signUp'))
      .send({ email: 'someone@else.com', password: ADMIN_PASSWORD })
      .expect(401);

    expect(response.body.code).toBe('NOT_ADMIN');
  });

  it('reports a second sign up as a conflict', async () => {
    await createAdmin();

    const response = await api
      .post(url('/auth/signUp'))
      .send({ email: adminEmail, password: ADMIN_PASSWORD })
      .expect(409);

    expect(response.body.code).toBe('DUPLICATE_KEY');
  });
});

describe('login', () => {
  it('returns a token for the right password', async () => {
    await createAdmin();

    const response = await api
      .post(url('/auth/login'))
      .send({ email: adminEmail, password: ADMIN_PASSWORD })
      .expect(200);

    expect(response.body.data.token).toBeTypeOf('string');
  });

  it('rejects the wrong password', async () => {
    await createAdmin();

    const response = await api
      .post(url('/auth/login'))
      .send({ email: adminEmail, password: 'not-the-password' })
      .expect(401);

    expect(response.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects a password that is too short before hitting the database', async () => {
    const response = await api
      .post(url('/auth/login'))
      .send({ email: adminEmail, password: 'abc' })
      .expect(422);

    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
