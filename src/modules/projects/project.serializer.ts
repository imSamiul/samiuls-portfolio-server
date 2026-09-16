import type {
  ProjectRecord,
  ProjectSummaryRecord,
} from '../../models/index.js';

/**
 * List payloads end up inside the website's RSC payload, so they carry only the
 * fields a card renders — `projectDetails` is fetched with the single project.
 */
export interface ProjectSummaryDto
  extends Omit<ProjectSummaryRecord, '_id' | 'image'> {
  id: string;
  image: string;
}

export interface ProjectDto extends ProjectSummaryDto {
  projectDetails: string;
}

/** The web app only ever needs the image URL, not the Cloudinary public id. */
export function toProjectSummary({
  _id,
  image,
  liveLink,
  frontEndRepo,
  backEndRepo,
  ...rest
}: ProjectSummaryRecord): ProjectSummaryDto {
  return {
    ...rest,
    id: String(_id),
    image: image?.url ?? '',
    // Blank links are omitted so the client tests for presence, not for ''.
    ...(liveLink ? { liveLink } : {}),
    ...(frontEndRepo ? { frontEndRepo } : {}),
    ...(backEndRepo ? { backEndRepo } : {}),
  };
}

export function toProjectDetail(project: ProjectRecord): ProjectDto {
  const { projectDetails, ...summary } = project;

  return { ...toProjectSummary(summary), projectDetails };
}
