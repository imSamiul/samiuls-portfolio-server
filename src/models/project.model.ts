import { model, Schema } from 'mongoose';
import { ProjectType } from '../types/ProjectType';

const projectSchema = new Schema<ProjectType>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
    },
    frontEndTech: {
      type: [String],
      required: true,
    },
    backEndTech: {
      type: [String],
      required: true,
    },
    liveLink: {
      type: String,
      required: true,
    },
    frontEndRepo: {
      type: String,
      required: true,
    },
    backEndRepo: {
      type: String,
      required: true,
    },
    projectDetails: {
      type: String,
      required: true,
    },
    showOnHomepage: {
      type: Boolean,
      default: false,
    },
    image: {
      data: Buffer,
      contentType: String,
    },
  },
  {
    timestamps: true,
  },
);

const Project = model<ProjectType>('Project', projectSchema);
export default Project;
