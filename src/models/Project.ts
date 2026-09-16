import type { HydratedDocument, Types } from 'mongoose';
import { model, Schema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions.js';

export interface ProjectImage {
  url: string;
  publicId: string;
}

export interface ProjectAttributes {
  title: string;
  summary: string;
  frontEndTech: string[];
  backEndTech: string[];
  liveLink: string;
  frontEndRepo: string;
  backEndRepo: string;
  projectDetails: string;
  showOnHomepage: boolean;
  image: ProjectImage;
}

/** Shape of a `.lean()` result, which is what every read path returns. */
export interface ProjectRecord extends ProjectAttributes {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectImageSchema = new Schema<ProjectImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);

const projectSchema = new Schema<ProjectAttributes>(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    frontEndTech: { type: [String], required: true },
    backEndTech: { type: [String], required: true },
    liveLink: { type: String, required: true, trim: true },
    frontEndRepo: { type: String, required: true, trim: true },
    backEndRepo: { type: String, required: true, trim: true },
    projectDetails: { type: String, required: true },
    showOnHomepage: { type: Boolean, required: true, default: false },
    image: { type: projectImageSchema, required: true },
  },
  baseSchemaOptions,
);

// Both list endpoints sort newest-first, and one of them filters on the flag.
projectSchema.index({ showOnHomepage: 1, createdAt: -1 });

export const Project = model<ProjectAttributes>('Project', projectSchema);

export type ProjectDocument = HydratedDocument<ProjectAttributes>;
