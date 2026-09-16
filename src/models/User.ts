import type { HydratedDocument } from 'mongoose';
import { model, Schema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions.js';

export interface UserAttributes {
  email: string;
  password: string;
}

/**
 * Hashing and comparison live in modules/auth/password.ts rather than in a
 * schema hook, so the model stays a plain document definition.
 */
const userSchema = new Schema<UserAttributes>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true },
  },
  baseSchemaOptions,
);

export const User = model<UserAttributes>('User', userSchema);

export type UserDocument = HydratedDocument<UserAttributes>;
