import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import type { ProjectAttributes } from '../../models/index.js';
import { Project } from '../../models/index.js';
import { api, bearer, createAdmin, url } from '../../test/helpers.js';
import { deriveSlug } from './project.service.js';

const IMAGE_URL = 'https://res.cloudinary.com/demo/image/upload/sample.webp';

function titlesOf(response: { body: { data: { title: string }[] } }) {
  return response.body.data.map((project) => project.title);
}

function seedProject(overrides: Partial<ProjectAttributes> = {}) {
  const title = overrides.title ?? 'Portfolio';

  return Project.create({
    title,
    // `slug` is unique, so it has to follow whatever title a test picks.
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    // Published by default; the draft behaviour is opted into per test.
    status: 'published',
    summary: 'A short summary',
    frontEndTech: ['Next.js'],
    backEndTech: ['Express'],
    liveLink: 'https://example.com',
    frontEndRepo: 'https://example.com/frontend',
    backEndRepo: 'https://example.com/backend',
    projectDetails: 'The long form write-up',
    showOnHomepage: false,
    image: { url: IMAGE_URL, publicId: 'portfolio/projects/sample' },
    ...overrides,
  });
}

describe('project reads', () => {
  it('serialises the image down to its URL and _id to id', async () => {
    const project = await seedProject();

    const response = await api.get(url('/project/getAllProjects')).expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(String(project._id));
    expect(response.body.data[0]._id).toBeUndefined();
    expect(response.body.data[0].image).toBe(IMAGE_URL);
    expect(response.body.data[0].publicId).toBeUndefined();
  });

  it('keeps the long write-up out of both list payloads', async () => {
    await seedProject({ showOnHomepage: true });

    const all = await api.get(url('/project/getAllProjects')).expect(200);
    const homepage = await api
      .get(url('/project/getProjectsForHomepage'))
      .expect(200);

    expect(all.body.data[0].projectDetails).toBeUndefined();
    expect(homepage.body.data[0].projectDetails).toBeUndefined();
    // The card still renders from what is left.
    expect(all.body.data[0].summary).toBe('A short summary');
  });

  it('returns the long write-up for a single project', async () => {
    const project = await seedProject();

    const response = await api
      .get(url(`/project/getProjectById/${String(project._id)}`))
      .expect(200);

    expect(response.body.data.projectDetails).toBe('The long form write-up');
  });

  it('omits the links a frontend-only project does not have', async () => {
    const project = await seedProject({
      backEndTech: [],
      liveLink: undefined,
      frontEndRepo: undefined,
      backEndRepo: undefined,
    });

    const response = await api
      .get(url(`/project/getProjectById/${String(project._id)}`))
      .expect(200);

    expect(response.body.data.liveLink).toBeUndefined();
    expect(response.body.data.frontEndRepo).toBeUndefined();
    expect(response.body.data.backEndRepo).toBeUndefined();
    expect(response.body.data.backEndTech).toEqual([]);
    expect(response.body.data.frontEndTech).toEqual(['Next.js']);
  });

  it('hides drafts from both public lists', async () => {
    await seedProject({ title: 'Live', showOnHomepage: true });
    await seedProject({
      title: 'Half written',
      status: 'draft',
      showOnHomepage: true,
    });

    const all = await api.get(url('/project/getAllProjects')).expect(200);
    const homepage = await api
      .get(url('/project/getProjectsForHomepage'))
      .expect(200);

    // showOnHomepage is only a display flag, so it must not leak a draft.
    expect(titlesOf(all)).toEqual(['Live']);
    expect(titlesOf(homepage)).toEqual(['Live']);
  });

  it('sorts by order before falling back to newest first', async () => {
    await seedProject({ title: 'Newest' });
    await seedProject({ title: 'Older but better', order: -1 });

    const response = await api.get(url('/project/getAllProjects')).expect(200);

    expect(titlesOf(response)).toEqual(['Older but better', 'Newest']);
  });

  it('only returns flagged projects for the homepage', async () => {
    await seedProject({ title: 'Hidden' });
    await seedProject({ title: 'Featured', showOnHomepage: true });

    const response = await api
      .get(url('/project/getProjectsForHomepage'))
      .expect(200);

    expect(titlesOf(response)).toEqual(['Featured']);
  });

  it('shows drafts to the dashboard, but only with a token', async () => {
    await seedProject({ title: 'Live' });
    await seedProject({ title: 'Half written', status: 'draft', order: -1 });

    await api.get(url('/project/getAllProjectsForDashboard')).expect(401);

    const { token } = await createAdmin();
    const response = await api
      .get(url('/project/getAllProjectsForDashboard'))
      .set('Authorization', bearer(token))
      .expect(200);

    expect(titlesOf(response)).toEqual(['Half written', 'Live']);
  });

  it('keeps the slug in list payloads', async () => {
    // The website's sitemap and JSON-LD build project URLs from list data.
    await seedProject({ title: 'Bari Vara' });

    const response = await api.get(url('/project/getAllProjects')).expect(200);

    expect(response.body.data[0].slug).toBe('bari-vara');
  });

  it('finds a project by its slug', async () => {
    await seedProject({ title: 'Bari Vara' });

    const response = await api
      .get(url('/project/getProjectBySlug/bari-vara'))
      .expect(200);

    expect(response.body.data.title).toBe('Bari Vara');
    expect(response.body.data.projectDetails).toBe('The long form write-up');
  });

  it('answers 404 for a slug that does not exist', async () => {
    const response = await api
      .get(url('/project/getProjectBySlug/nothing-here'))
      .expect(404);

    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('rejects a malformed slug before touching the database', async () => {
    const response = await api
      .get(url('/project/getProjectBySlug/Not_A_Slug'))
      .expect(422);

    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a malformed id before touching the database', async () => {
    const response = await api
      .get(url('/project/getProjectById/nope'))
      .expect(422);

    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('answers 404 for an id that does not exist', async () => {
    const response = await api
      .get(url(`/project/getProjectById/${new Types.ObjectId().toString()}`))
      .expect(404);

    expect(response.body.code).toBe('NOT_FOUND');
  });
});

describe('project writes', () => {
  it('refuses every mutation without a token', async () => {
    const project = await seedProject();
    const id = String(project._id);

    await api.post(url('/project/create')).expect(401);
    await api.patch(url(`/project/updateProject/${id}`)).send({}).expect(401);
    await api.patch(url(`/project/updateShowOnHomePage/${id}`)).expect(401);
    await api.patch(url(`/project/updateStatus/${id}`)).expect(401);
    await api.delete(url(`/project/deleteProject/${id}`)).expect(401);
  });

  it('flips the publish gate both ways', async () => {
    const { token } = await createAdmin();
    const project = await seedProject({ status: 'draft' });
    const path = url(`/project/updateStatus/${String(project._id)}`);

    const published = await api
      .patch(path)
      .set('Authorization', bearer(token))
      .expect(200);

    expect(published.body.data.status).toBe('published');
    expect(published.body.message).toBe('Project published');

    const unpublished = await api
      .patch(path)
      .set('Authorization', bearer(token))
      .expect(200);

    expect(unpublished.body.data.status).toBe('draft');
    expect(unpublished.body.message).toBe('Project unpublished');
  });

  it('rejects a status it does not know', async () => {
    const { token } = await createAdmin();
    const project = await seedProject();

    await api
      .patch(url(`/project/updateProject/${String(project._id)}`))
      .set('Authorization', bearer(token))
      .send({ status: 'archived' })
      .expect(422);
  });

  it('updates only the fields that were sent', async () => {
    const { token } = await createAdmin();
    const project = await seedProject();

    const response = await api
      .patch(url(`/project/updateProject/${String(project._id)}`))
      .set('Authorization', bearer(token))
      .send({ title: 'Renamed' })
      .expect(200);

    expect(response.body.data.title).toBe('Renamed');
    expect(response.body.data.summary).toBe('A short summary');
  });

  it('flips the homepage flag', async () => {
    const { token } = await createAdmin();
    const project = await seedProject();

    const response = await api
      .patch(url(`/project/updateShowOnHomePage/${String(project._id)}`))
      .set('Authorization', bearer(token))
      .expect(200);

    expect(response.body.data.showOnHomepage).toBe(true);
    expect(response.body.message).toBe('Project shown on the homepage');
  });

  it('rejects an empty frontend tech list', async () => {
    const { token } = await createAdmin();
    const project = await seedProject();

    await api
      .patch(url(`/project/updateProject/${String(project._id)}`))
      .set('Authorization', bearer(token))
      .send({ frontEndTech: [] })
      .expect(422);
  });

  it('accepts an empty backend tech list', async () => {
    const { token } = await createAdmin();
    const project = await seedProject();

    const response = await api
      .patch(url(`/project/updateProject/${String(project._id)}`))
      .set('Authorization', bearer(token))
      .send({ backEndTech: [] })
      .expect(200);

    expect(response.body.data.backEndTech).toEqual([]);
  });

  it('rejects a slug that is not URL safe', async () => {
    const { token } = await createAdmin();
    const project = await seedProject();

    await api
      .patch(url(`/project/updateProject/${String(project._id)}`))
      .set('Authorization', bearer(token))
      .send({ slug: 'Not A Slug' })
      .expect(422);
  });

  it('refuses to reuse another project\u2019s slug', async () => {
    const { token } = await createAdmin();
    await seedProject({ title: 'Taken' });
    const project = await seedProject({ title: 'Other' });

    const response = await api
      .patch(url(`/project/updateProject/${String(project._id)}`))
      .set('Authorization', bearer(token))
      .send({ slug: 'taken' })
      .expect(409);

    expect(response.body.code).toBe('DUPLICATE_KEY');
  });

  it('leaves the slug alone when the title is renamed', async () => {
    const { token } = await createAdmin();
    const project = await seedProject({ title: 'Bari Vara' });

    const response = await api
      .patch(url(`/project/updateProject/${String(project._id)}`))
      .set('Authorization', bearer(token))
      .send({ title: 'Bari Vara v2' })
      .expect(200);

    // The old URL is indexed and shared, so it must not move on its own.
    expect(response.body.data.slug).toBe('bari-vara');
  });

  it('clears a link when it is sent blank', async () => {
    const { token } = await createAdmin();
    const project = await seedProject();

    const response = await api
      .patch(url(`/project/updateProject/${String(project._id)}`))
      .set('Authorization', bearer(token))
      .send({ liveLink: '' })
      .expect(200);

    expect(response.body.data.liveLink).toBeUndefined();
  });
});

describe('slug derivation', () => {
  it('turns a title into a URL safe segment', async () => {
    expect(await deriveSlug('Bari Vara — Rent Manager!')).toBe(
      'bari-vara-rent-manager',
    );
  });

  it('suffixes the slug when the title is already taken', async () => {
    await seedProject({ title: 'Portfolio' });

    const slug = await deriveSlug('Portfolio');

    expect(slug).not.toBe('portfolio');
    expect(slug).toMatch(/^portfolio-[a-z0-9]+$/);
  });

  it('falls back rather than producing an empty slug', async () => {
    expect(await deriveSlug('!!!')).toBe('project');
  });
});
