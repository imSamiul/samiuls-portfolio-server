import ApiError from '../../utils/ApiError';
import asyncHandler from '../../utils/asyncHandler';
import { serializeProject } from './project.serializer';
import * as projectService from './project.service';

export const getProjects = asyncHandler(async (_req, res) => {
  const projects = await projectService.findProjects();
  res.status(200).json(projects.map(serializeProject));
});

export const getHomepageProjects = asyncHandler(async (_req, res) => {
  const projects = await projectService.findHomepageProjects();
  res.status(200).json(projects.map(serializeProject));
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.findProjectById(req.params.id);
  res.status(200).json(serializeProject(project));
});

export const createProject = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Image is required');
  }

  const project = await projectService.createProject(
    req.body,
    req.file.buffer,
  );

  res.status(201).json({
    message: 'Project created successfully',
    project: serializeProject(project),
  });
});

export const toggleShowOnHomepage = asyncHandler(async (req, res) => {
  await projectService.toggleShowOnHomepage(req.params.id);
  res.status(200).json({ message: 'Project updated successfully' });
});

export const updateProject = asyncHandler(async (req, res) => {
  await projectService.updateProject(req.params.id, req.body);
  res.status(200).json({ message: 'Project updated successfully' });
});

export const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.params.id);
  res.status(200).json({ message: 'Project deleted successfully' });
});
