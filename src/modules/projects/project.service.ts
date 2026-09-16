import { PROJECT_IMAGE_HEIGHT, PROJECT_IMAGE_WIDTH } from '#shared';
import type { CreateProjectInput, UpdateProjectInput } from '#shared';
import sharp from 'sharp';

import {
  assertCloudinaryConfigured,
  cloudinary,
  PROJECT_IMAGE_FOLDER,
} from '../../config/cloudinary.js';
import type { ProjectImage, ProjectRecord } from '../../models/index.js';
import { Project } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';

const WEBP_QUALITY = 80;

/**
 * Re-encoding matters: uploading the raw buffer keeps the original format, so a
 * 2 MB PNG would stay a 2 MB PNG. Also used by the one-off data migration.
 */
export async function uploadImage(buffer: Buffer): Promise<ProjectImage> {
  assertCloudinaryConfigured();

  const optimised = await sharp(buffer)
    .resize(PROJECT_IMAGE_WIDTH, PROJECT_IMAGE_HEIGHT)
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const result = await cloudinary.uploader.upload(
    `data:image/webp;base64,${optimised.toString('base64')}`,
    { folder: PROJECT_IMAGE_FOLDER, resource_type: 'image' },
  );

  return { url: result.secure_url, publicId: result.public_id };
}

export function listProjects() {
  return Project.find().sort({ createdAt: -1 }).lean<ProjectRecord[]>();
}

export function listHomepageProjects() {
  return Project.find({ showOnHomepage: true })
    .sort({ createdAt: -1 })
    .lean<ProjectRecord[]>();
}

export async function getProject(id: string) {
  const project = await Project.findById(id).lean<ProjectRecord>();

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  return project;
}

export async function createProject(
  input: CreateProjectInput,
  imageBuffer: Buffer,
) {
  const image = await uploadImage(imageBuffer);

  try {
    const project = await Project.create({ ...input, image });
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
  const project = await Project.findById(id);

  if (!project) {
    throw ApiError.notFound('Project not found');
  }

  project.showOnHomepage = !project.showOnHomepage;
  await project.save();

  return project.toObject<ProjectRecord>();
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
