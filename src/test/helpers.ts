import supertest from 'supertest';

import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { hashPassword } from '../modules/auth/password.js';
import { signAuthToken } from '../modules/auth/tokens.js';

export const api = supertest(createApp());

/** Every request in the suite goes through the configured prefix. */
export const url = (path: string) => `${env.API_PREFIX}${path}`;

export const ADMIN_PASSWORD = 'super-secret';

export async function createAdmin() {
  const user = await User.create({
    email: env.ADMIN_EMAIL.trim().toLowerCase(),
    password: await hashPassword(ADMIN_PASSWORD),
  });

  return { user, token: signAuthToken(String(user._id)) };
}

export function bearer(token: string) {
  return `Bearer ${token}`;
}
