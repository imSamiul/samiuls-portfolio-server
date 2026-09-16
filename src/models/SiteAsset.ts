import type { HydratedDocument, Types } from 'mongoose';
import { model, Schema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions.js';

/**
 * A one-row-per-key registry for files the owner replaces from the dashboard.
 * Only the resume needs it today; a collection per asset would be worse.
 */
export type SiteAssetKey = 'resume';

export interface SiteAssetAttributes {
  key: SiteAssetKey;
  publicId: string;
  /**
   * Cloudinary's version. It goes into the delivery URL, so replacing the file
   * changes the URL and every CDN and browser cache is bypassed for free.
   */
  version: number;
}

export interface SiteAssetRecord extends SiteAssetAttributes {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const siteAssetSchema = new Schema<SiteAssetAttributes>(
  {
    key: { type: String, required: true, unique: true },
    publicId: { type: String, required: true },
    version: { type: Number, required: true },
  },
  baseSchemaOptions,
);

export const SiteAsset = model<SiteAssetAttributes>(
  'SiteAsset',
  siteAssetSchema,
);

export type SiteAssetDocument = HydratedDocument<SiteAssetAttributes>;
