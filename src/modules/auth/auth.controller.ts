import type { CredentialsInput } from '#shared';
import type { RequestHandler } from 'express';

import { toAuthUserDto } from './auth.serializer.js';
import * as authService from './auth.service.js';

export const signUp: RequestHandler<
  unknown,
  unknown,
  CredentialsInput
> = async (req, res) => {
  const { user, token } = await authService.register(req.body);

  res.status(201).json({ user: toAuthUserDto(user), token });
};

export const login: RequestHandler<unknown, unknown, CredentialsInput> = async (
  req,
  res,
) => {
  const { user, token } = await authService.login(req.body);

  res.json({ user: toAuthUserDto(user), token });
};
