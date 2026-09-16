import type { CreateProjectInput, UpdateProjectInput } from '#shared';
import type { RequestHandler } from 'express';

import { ApiError } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/response.js';
import { toProjectDto } from './project.serializer.js';
import * as projectService from './project.service.js';

export const list: RequestHandler = async (_req, res) => {
  const projects = await projectService.listProjects();

  sendSuccess(res, `${projects.length} projects`, projects.map(toProjectDto));
};

export const listForHomepage: RequestHandler = async (_req, res) => {
  const projects = await projectService.listHomepageProjects();

  sendSuccess(res, `${projects.length} projects`, projects.map(toProjectDto));
};

export const detail: RequestHandler<{ id: string }> = async (req, res) => {
  const project = await projectService.getProject(req.params.id);

  sendSuccess(res, project.title, toProjectDto(project));
};

export const create: RequestHandler<
  unknown,
  unknown,
  CreateProjectInput
> = async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('A project image is required', 'IMAGE_REQUIRED');
  }

  const project = await projectService.createProject(req.body, req.file.buffer);

  sendSuccess(res, 'Project published', toProjectDto(project), 201);
};

export const update: RequestHandler<
  { id: string },
  unknown,
  UpdateProjectInput
> = async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body);

  sendSuccess(res, 'Project updated', toProjectDto(project));
};

export const toggleHomepage: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const project = await projectService.toggleHomepage(req.params.id);

  sendSuccess(
    res,
    project.showOnHomepage
      ? 'Project shown on the homepage'
      : 'Project hidden from the homepage',
    toProjectDto(project),
  );
};

export const remove: RequestHandler<{ id: string }> = async (req, res) => {
  await projectService.deleteProject(req.params.id);

  sendSuccess(res, 'Project deleted', null);
};
