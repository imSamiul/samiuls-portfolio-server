import sharp from 'sharp';

import {
  assertCloudinaryConfigured,
  cloudinary,
  PROJECT_IMAGE_FOLDER,
  uploadBuffer,
} from '../../config/cloudinary.js';
import type {
  ProjectImage,
  ProjectRecord,
  ProjectSummaryRecord,
} from '../../models/index.js';
import { Project } from '../../models/index.js';
import {
  PROJECT_IMAGE_HEIGHT,
  PROJECT_IMAGE_WIDTH,
} from '../../shared/index.js';
import type {
  CreateProjectInput,
  PaginationQuery,
  UpdateProjectInput,
} from '../../shared/index.js';
import { ApiError } from '../../utils/ApiError.js';

const WEBP_QUALITY = 80;

/**
 * No list view renders the long write-up, and list payloads are inlined into the
 * website's HTML, so it never leaves the database on this path.
 */
const LIST_PROJECTION = '-projectDetails';

/**
 * `order` ascending first, so an older, better project can stay on top. `_id`
 * breaks ties: two projects can share an `order` and a `createdAt`, and without
 * a unique final key the paginated list could repeat or skip one at a page
 * boundary.
 */
const LIST_SORT = { order: 1, createdAt: -1, _id: 1 } as const;

/** `showOnHomepage` is a display flag; this is the actual publish gate. */
const PUBLISHED = { status: 'published' } as const;

/**
 * Re-encoding matters: uploading the raw buffer keeps the original format, so a
 * 2 MB PNG would stay a 2 MB PNG. Also used by the one-off data migration.
 */
export async function uploadImage(buffer: Buffer): Promise<ProjectImage> {
  // Ahead of the re-encoding, so an unconfigured environment fails before
  // spending the CPU on it.
  assertCloudinaryConfigured();

  const optimised = await sharp(buffer)
    .resize(PROJECT_IMAGE_WIDTH, PROJECT_IMAGE_HEIGHT)
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  // Streamed rather than sent as a base64 data URI, which would inflate the
  // payload by a third and hold the whole image in memory twice.
  const result = await uploadBuffer(optimised, {
    folder: PROJECT_IMAGE_FOLDER,
    resource_type: 'image',
  });

  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Paginated because this is the one list that grows without a ceiling. The sort
 * ends in `createdAt`, which is effectively unique, so a document cannot drift
 * across page boundaries between two requests.
 */
export async function listProjects({ page, limit }: PaginationQuery) {
  const [items, total] = await Promise.all([
    Project.find(PUBLISHED)
      .select(LIST_PROJECTION)
      .sort(LIST_SORT)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<ProjectSummaryRecord[]>(),
    Project.countDocuments(PUBLISHED),
  ]);

  return { items, total };
}

export function listHomepageProjects() {
  return Project.find({ ...PUBLISHED, showOnHomepage: true })
    .select(LIST_PROJECTION)
    .sort(LIST_SORT)
    .lean<ProjectSummaryRecord[]>();
}

/** The dashboard needs drafts too, so this one is authenticated. */
export function listAllProjects() {
  return Project.find()
    .select(LIST_PROJECTION)
    .sort(LIST_SORT)
    .lean<ProjectSummaryRecord[]>();
}

export async function getProject(id: string) {
  const project = await Project.findById(id).lean<ProjectRecord>();

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  return project;
}

export async function getProjectBySlug(slug: string) {
  const project = await Project.findOne({ slug }).lean<ProjectRecord>();

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  return project;
}

/**
 * Derived once, at create time: a URL that is already indexed and shared must
 * not move just because the title was reworded.
 */
export async function deriveSlug(title: string) {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'project';

  if (!(await Project.exists({ slug: base }))) {
    return base;
  }

  // Only two projects sharing a title reach this; the unique index is still the
  // final arbiter if even the suffixed slug collides.
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

export async function createProject(
  input: CreateProjectInput,
  imageBuffer: Buffer,
) {
  const slug = input.slug ?? (await deriveSlug(input.title));
  const image = await uploadImage(imageBuffer);

  try {
    const project = await Project.create({ ...input, slug, image });
    return project.toObject<ProjectRecord>();
  } catch (error) {
    // Don't leave an orphaned asset behind when the insert fails.
    await cloudinary.uploader.destroy(image.publicId);
    throw error;
  }
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  const project = await Project.findByIdAndUpdate(id, input, {
    returnDocument: 'after',
    runValidators: true,
  }).lean<ProjectRecord>();

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  return project;
}

export async function toggleHomepage(id: string) {
  // Flipped inside an aggregation pipeline update, so reading the current value
  // and writing the new one is a single round trip.
  const project = await Project.findByIdAndUpdate(
    id,
    [{ $set: { showOnHomepage: { $not: ['$showOnHomepage'] } } }],
    { returnDocument: 'after', updatePipeline: true },
  ).lean<ProjectRecord>();

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  return project;
}

export async function toggleStatus(id: string) {
  // Same single-round-trip pipeline trick as toggleHomepage.
  const project = await Project.findByIdAndUpdate(
    id,
    [
      {
        $set: {
          status: {
            $cond: [{ $eq: ['$status', 'published'] }, 'draft', 'published'],
          },
        },
      },
    ],
    { returnDocument: 'after', updatePipeline: true },
  ).lean<ProjectRecord>();

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  return project;
}

export async function deleteProject(id: string) {
  const project = await Project.findByIdAndDelete(id).lean<ProjectRecord>();

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  if (project.image?.publicId) {
    await cloudinary.uploader.destroy(project.image.publicId);
  }

  return project;
}
