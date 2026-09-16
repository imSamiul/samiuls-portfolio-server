import type { RequestHandler } from 'express';

import { validatedQuery } from '../../middleware/validate.js';
import type {
  CreateProjectInput,
  PaginationQuery,
  UpdateProjectInput,
} from '../../shared/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { sendSuccess } from '../../utils/response.js';
import { revalidateProject } from '../../utils/revalidateWeb.js';
import { toProjectDetail, toProjectSummary } from './project.serializer.js';
import * as projectService from './project.service.js';

/**
 * The only paginated list: the website renders one page per `?page=` URL, so
 * the meta is what tells it how many of those URLs exist.
 */
export const list: RequestHandler = async (req, res) => {
  const { page, limit } = validatedQuery<PaginationQuery>(req);
  const { items, total } = await projectService.listProjects({ page, limit });

  sendSuccess(res, `${items.length} projects`, {
    items: items.map(toProjectSummary),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasMore: page * limit < total,
    },
  });
};

/** Admin only: the dashboard has to see drafts, which the public lists hide. */
export const listForDashboard: RequestHandler = async (_req, res) => {
  const projects = await projectService.listAllProjects();

  sendSuccess(
    res,
    `${projects.length} projects`,
    projects.map(toProjectSummary),
  );
};

export const listForHomepage: RequestHandler = async (_req, res) => {
  const projects = await projectService.listHomepageProjects();

  sendSuccess(
    res,
    `${projects.length} projects`,
    projects.map(toProjectSummary),
  );
};

export const detail: RequestHandler<{ id: string }> = async (req, res) => {
  const project = await projectService.getProject(req.params.id);

  sendSuccess(res, project.title, toProjectDetail(project));
};

/** What the public site uses; `detail` stays for the dashboard's edit page. */
export const detailBySlug: RequestHandler<{ slug: string }> = async (
  req,
  res,
) => {
  const project = await projectService.getProjectBySlug(req.params.slug);

  sendSuccess(res, project.title, toProjectDetail(project));
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

  sendSuccess(res, 'Project published', toProjectDetail(project), 201);
  // After the response: telling the website is an outbound integration, not part
  // of the write, and it must never be able to fail one.
  revalidateProject(project.slug);
};

export const update: RequestHandler<
  { id: string },
  unknown,
  UpdateProjectInput
> = async (req, res) => {
  const project = await projectService.updateProject(req.params.id, req.body);

  sendSuccess(res, 'Project updated', toProjectDetail(project));
  revalidateProject(project.slug);
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
    toProjectDetail(project),
  );
  revalidateProject(project.slug);
};

export const toggleStatus: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const project = await projectService.toggleStatus(req.params.id);

  sendSuccess(
    res,
    project.status === 'published'
      ? 'Project published'
      : 'Project unpublished',
    toProjectDetail(project),
  );
  revalidateProject(project.slug);
};

export const remove: RequestHandler<{ id: string }> = async (req, res) => {
  const project = await projectService.deleteProject(req.params.id);

  sendSuccess(res, 'Project deleted', null);
  revalidateProject(project.slug);
};
