import type { CredentialsInput } from '#shared';
import type { RequestHandler } from 'express';

import { sendSuccess } from '../../utils/response.js';
import { toAuthUserDto } from './auth.serializer.js';
import * as authService from './auth.service.js';

export const signUp: RequestHandler<
  unknown,
  unknown,
  CredentialsInput
> = async (req, res) => {
  const { user, token } = await authService.register(req.body);

  sendSuccess(res, 'Account created', { user: toAuthUserDto(user), token }, 201);
};

export const login: RequestHandler<unknown, unknown, CredentialsInput> = async (
  req,
  res,
) => {
  const { user, token } = await authService.login(req.body);

  sendSuccess(res, 'Signed in', { user: toAuthUserDto(user), token });
};
