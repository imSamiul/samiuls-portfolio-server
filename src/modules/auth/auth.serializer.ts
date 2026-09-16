import type { UserDocument } from '../../models/index.js';

/** Only ever the fields the dashboard shows — never the password hash. */
export interface AuthUserDto {
  id: string;
  email: string;
}

export function toAuthUserDto(user: UserDocument): AuthUserDto {
  return { id: String(user._id), email: user.email };
}
