import type { HydratedDocument, Types } from 'mongoose';
import { model, Schema } from 'mongoose';

import { baseSchemaOptions } from './schemaOptions.js';

export interface ProjectImage {
  url: string;
  publicId: string;
}

export type ProjectStatus = 'draft' | 'published';

export interface ProjectAttributes {
  title: string;
  /** Public URL segment. Derived from the title once, then never moves. */
  slug: string;
  /**
   * The publish gate. `showOnHomepage` is only a display flag, so without this
   * there is no way to stage a half-written project.
   */
  status: ProjectStatus;
  /** Manual sort key, ascending. Lets an older, better project stay on top. */
  order: number;
  summary: string;
  frontEndTech: string[];
  backEndTech: string[];
  liveLink?: string;
  frontEndRepo?: string;
  backEndRepo?: string;
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

/**
 * What the list endpoints read: `projectDetails` is the one large field and no
 * list view renders it, so it is projected away rather than shipped.
 */
export type ProjectSummaryRecord = Omit<ProjectRecord, 'projectDetails'>;

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
    // `unique` already builds the index this needs.
    slug: { type: String, required: true, unique: true, trim: true },
    // Drafts by default: saving a project must not publish it.
    status: {
      type: String,
      required: true,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    order: { type: Number, required: true, default: 0 },
    summary: { type: String, required: true, trim: true },
    frontEndTech: { type: [String], required: true },
    // A project can be frontend-only, so there may be no backend at all.
    backEndTech: { type: [String], default: [] },
    // Not every project is deployed, and client work often has no public repo.
    liveLink: { type: String, trim: true },
    frontEndRepo: { type: String, trim: true },
    backEndRepo: { type: String, trim: true },
    projectDetails: { type: String, required: true },
    showOnHomepage: { type: Boolean, required: true, default: false },
    image: { type: projectImageSchema, required: true },
  },
  baseSchemaOptions,
);

// Both public lists filter on status and sort by `order`, `createdAt` then
// `_id`, so the indexes have to carry every field in that order — the trailing
// `_id` is what keeps the paginated list's sort unique, and leaving it out of
// the index would turn the sort into an in-memory one.
projectSchema.index({
  status: 1,
  showOnHomepage: 1,
  order: 1,
  createdAt: -1,
  _id: 1,
});
projectSchema.index({ status: 1, order: 1, createdAt: -1, _id: 1 });

// The dashboard list is unfiltered and admin-only, so it is left to scan: at
// this collection's size an extra index would cost more than it saves.

export const Project = model<ProjectAttributes>('Project', projectSchema);

export type ProjectDocument = HydratedDocument<ProjectAttributes>;
