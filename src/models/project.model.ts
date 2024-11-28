import { Schema } from 'mongoose';

const projectSchema = new Schema(
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
      type: String,
      required: true,
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Task',
      },
    ],
  },
  {
    timestamps: true,
  },
);
projectSchema.methods.toJSON = function toJSON() {
  const project = this;
  const projectObject = project.toObject();
  delete projectObject.__v;
  return projectObject;
};
const Project = model('Project', projectSchema);
module.exports = Project;
