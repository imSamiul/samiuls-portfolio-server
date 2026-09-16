import sharp from 'sharp';
import cloudinary, { PROJECT_IMAGE_FOLDER } from '../../config/cloudinary';
import Project from '../../models/project.model';
import {
  CreateProjectInput,
  UpdateProjectInput,
} from '../../shared/schemas/project.schema';
import { ProjectImageType } from '../../types/ProjectType';
import ApiError from '../../utils/ApiError';
import { StoredProject } from './project.serializer';

const IMAGE_WIDTH = 1920;
const IMAGE_HEIGHT = 1080;
const WEBP_QUALITY = 80;

// Re-encoding matters: uploading the raw buffer keeps the original format, so a
// 2MB PNG would stay a 2MB PNG. Also exported for the one-off data migration.
export async function uploadProjectImage(
  buffer: Buffer,
): Promise<ProjectImageType> {
  const optimised = await sharp(buffer)
    .resize(IMAGE_WIDTH, IMAGE_HEIGHT)
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const result = await cloudinary.uploader.upload(
    `data:image/webp;base64,${optimised.toString('base64')}`,
    { folder: PROJECT_IMAGE_FOLDER, resource_type: 'image' },
  );

  return { url: result.secure_url, publicId: result.public_id };
}

export function findProjects() {
  return Project.find().sort({ createdAt: -1 }).lean<StoredProject[]>();
}

export function findHomepageProjects() {
  return Project.find({ showOnHomepage: true })
    .sort({ createdAt: -1 })
    .lean<StoredProject[]>();
}

export async function findProjectById(id: string) {
  const project = await Project.findById(id).lean<StoredProject>();
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return project;
}

export async function createProject(
  input: CreateProjectInput,
  imageBuffer: Buffer,
) {
  const image = await uploadProjectImage(imageBuffer);

  try {
    const project = await Project.create({ ...input, image });
    return project.toObject<StoredProject>();
  } catch (error) {
    // Don't leave an orphaned asset behind when the insert fails.
    await cloudinary.uploader.destroy(image.publicId);
    throw error;
  }
}

export async function updateProject(id: string, input: UpdateProjectInput) {
  const project = await Project.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  }).lean<StoredProject>();

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  return project;
}

export async function toggleShowOnHomepage(id: string) {
  const project = await Project.findById(id);
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  project.showOnHomepage = !project.showOnHomepage;
  await project.save();

  return project.toObject<StoredProject>();
}

export async function deleteProject(id: string) {
  const project = await Project.findByIdAndDelete(id).lean<StoredProject>();
  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  if (project.image?.publicId) {
    await cloudinary.uploader.destroy(project.image.publicId);
  }

  return project;
}
