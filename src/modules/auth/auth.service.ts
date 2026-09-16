import { env } from '../../config/env.js';
import { User } from '../../models/index.js';
import type { CredentialsInput } from '../../shared/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, verifyPassword } from './password.js';
import { signAuthToken } from './tokens.js';

/**
 * One person owns this dashboard, so any other address is turned away before a
 * database round trip. The address used to be hardcoded in the controller.
 */
function assertAdmin(email: string) {
  if (email !== env.ADMIN_EMAIL.trim().toLowerCase()) {
    throw ApiError.unauthorized(
      'This account cannot access the dashboard',
      'NOT_ADMIN',
    );
  }
}

export async function register({ email, password }: CredentialsInput) {
  assertAdmin(email);

  const user = await User.create({
    email,
    password: await hashPassword(password),
  });

  return { user, token: signAuthToken(String(user._id)) };
}

export async function login({ email, password }: CredentialsInput) {
  assertAdmin(email);

  const user = await User.findOne({ email });

  if (!user || !(await verifyPassword(password, user.password))) {
    throw ApiError.unauthorized(
      'Incorrect email or password',
      'INVALID_CREDENTIALS',
    );
  }

  return { user, token: signAuthToken(String(user._id)) };
}
