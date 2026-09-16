export type ProjectImageType = {
  url: string;
  publicId: string;
};

export type ProjectType = {
  title: string;
  summary: string;
  frontEndTech: string[];
  backEndTech: string[];
  liveLink: string;
  frontEndRepo: string;
  backEndRepo: string;
  projectDetails: string;
  showOnHomepage: boolean;
  image: ProjectImageType;
  createdAt?: Date;
  updatedAt?: Date;
};
