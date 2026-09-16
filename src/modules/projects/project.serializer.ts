import type { ProjectRecord } from '../../models/index.js';

/** The web app only ever needs the image URL, not the Cloudinary public id. */
export interface ProjectDto extends Omit<ProjectRecord, '_id' | 'image'> {
  _id: string;
  image: string;
}

export function toProjectDto({
  _id,
  image,
  ...rest
}: ProjectRecord): ProjectDto {
  return { ...rest, _id: String(_id), image: image?.url ?? '' };
}
