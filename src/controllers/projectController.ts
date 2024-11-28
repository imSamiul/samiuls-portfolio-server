import { Request } from "express";
// GET:


// POST:
export function createProject(req:Request, res:Response) {
  // code here
  const { title, summary, frontEndTech, backEndTech, liveLink, frontEndRepo, backEndRepo, projectDetails, showOnHomepage, image } = req.body;
  const newProject = new Project({
    title,
    summary,
    frontEndTech,
    backEndTech,
    liveLink,
    frontEndRepo,
    backEndRepo,
    projectDetails,
    showOnHomepage,
    image,
  });

}


// PATCH:

// DELETE: