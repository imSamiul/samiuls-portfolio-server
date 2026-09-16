import { Types } from 'mongoose';
import { ProjectType } from '../../types/ProjectType';

export type StoredProject = ProjectType & { _id: Types.ObjectId };

// The client consumes `image` as a plain URL string, so the Cloudinary publicId
// — needed only for deletes — never leaves the API.
export type ProjectDto = Omit<ProjectType, 'image'> & {
  _id: string;
  image: string;
};

export function serializeProject(project: StoredProject): ProjectDto {
  const { _id, image, ...rest } = project;

  return {
    ...rest,
    _id: _id.toString(),
    image: image?.url ?? '',
  };
}
