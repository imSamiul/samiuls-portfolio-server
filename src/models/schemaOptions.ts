import type { SchemaOptions } from 'mongoose';

/**
 * Shared document settings: timestamps on every model, no version key, and a
 * toJSON that backstops the serializers — `id` instead of `_id`, and never a
 * password hash — for the day someone returns a document directly.
 */
export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform(_doc, ret: Record<string, unknown>) {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.password;
      return ret;
    },
  },
};
