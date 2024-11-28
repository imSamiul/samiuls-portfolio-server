import { Document } from 'mongoose';

export type ProjectType = Document & {
  title: string;
  summary: string;
  frontEndTech: string[];
  backEndTech: string[];
  liveLink: string;
  frontEndRepo: string;
  backEndRepo: string;
  projectDetails: string;
  showOnHomepage?: boolean;
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
};
