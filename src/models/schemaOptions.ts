import type { SchemaOptions } from 'mongoose';

/**
 * Shared document settings: timestamps on every model, no version key, and a
 * toJSON that can never leak a password hash.
 */
export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform(_doc, ret: Record<string, unknown>) {
      delete ret.password;
      return ret;
    },
  },
};
