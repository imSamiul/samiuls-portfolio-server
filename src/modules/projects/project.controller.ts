import type { CreateProjectInput, UpdateProjectInput } from '#shared';
import type { RequestHandler } from 'express';

import { ApiError } from '../../utils/ApiError.js';
import { toProjectDto } from './project.serializer.js';
import * as projectService from './project.service.js';

export const list: RequestHandler = async (_req, res) => {
  const projects = await projectService.listProjects();

  res.json(projects.map(toProjectDto));
};

export const listForHomepage: RequestHandler = async (_req, res) => {
  const projects = await projectService.listHomepageProjects();

  res.json(projects.map(toProjectDto));
};

export const detail: RequestHandler<{ id: string }> = async (req, res) => {
  const project = await projectService.getProject(req.params.id);

  res.json(toProjectDto(project));
};

export const create: RequestHandler<
  unknown,
  unknown,
  CreateProjectInput
> = async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('A project image is required', 'IMAGE_REQUIRED');
  }

  const project = await projectService.createProject(
    req.body,
    req.file.buffer,
  );

  res.status(201).json(toProjectDto(project));
};

export const update: RequestHandler<
  { id: string },
  unknown,
  UpdateProjectInput
> = async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body);

  res.json(toProjectDto(project));
};

export const toggleHomepage: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const project = await projectService.toggleHomepage(req.params.id);

  res.json(toProjectDto(project));
};

export const remove: RequestHandler<{ id: string }> = async (req, res) => {
  await projectService.deleteProject(req.params.id);

  res.json({ message: 'Project deleted' });
};
