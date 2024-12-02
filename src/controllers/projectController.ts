import { Request, Response } from 'express';
import Project from '../models/project.model';
import multer from 'multer';
import sharp from 'sharp';

// GET: get all projects
export async function getProjects(req: Request, res: Response) {
  console.log(req.body.tokenData);

  try {
    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (error) {
    let errorMessage = 'Failed to fetch projects';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json({ message: errorMessage });
    console.log(error);
  }
}

// POST: Configure multer to use memory storage

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2000000,
  },
  fileFilter(req: Request, file, cb) {
    // cb ==> callback
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image file (jpg, jpeg, or png)'));
    }
    cb(null, true);
  },
});
// Middleware to handle single image upload
export const uploadProjectImage = upload.single('image');

// POST: Create a new project
export async function createProject(req: Request, res: Response) {
  try {
    const {
      title,
      summary,
      frontEndTech,
      backEndTech,
      liveLink,
      frontEndRepo,
      backEndRepo,
      projectDetails,
      showOnHomepage,
    } = req.body;

    // Ensure file is present and store as buffer
    if (!req.file) {
      res.status(400).json({ message: 'Image is required' });
      return;
    }
    // Resize image using sharp
    const resizedImageBuffer = await sharp(req.file.buffer)
      .resize(1920, 1080) // Resize to 800x600 (width x height)
      .toBuffer(); // Convert to buffer for storage

    const newProject = new Project({
      title,
      summary,
      frontEndTech: JSON.parse(frontEndTech), // Parse if array is sent as a string
      backEndTech: JSON.parse(backEndTech), // Parse if array is sent as a string
      liveLink,
      frontEndRepo,
      backEndRepo,
      projectDetails,
      showOnHomepage: showOnHomepage === 'true', // Convert string to boolean
      image: resizedImageBuffer, // Save image as Buffer
    });
    await newProject.save();
    res
      .status(201)
      .json({ message: 'Project created successfully', project: newProject });
  } catch (error) {
    let errorMessage = 'Failed to create project';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json({ message: errorMessage });
    console.log(error);
  }
}

// PATCH:

// DELETE: