import { Types } from 'mongoose';
import { describe, expect, it } from 'vitest';

import type { ProjectAttributes } from '../../models/index.js';
import { Project } from '../../models/index.js';
import { api, bearer, createAdmin, url } from '../../test/helpers.js';

const IMAGE_URL = 'https://res.cloudinary.com/demo/image/upload/sample.webp';

function seedProject(overrides: Partial<ProjectAttributes> = {}) {
  return Project.create({
    title: 'Portfolio',
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
  it('serialises the image down to its URL', async () => {
    await seedProject();

    const response = await api.get(url('/project/getAllProjects')).expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].image).toBe(IMAGE_URL);
    expect(response.body[0].publicId).toBeUndefined();
  });

  it('only returns flagged projects for the homepage', async () => {
    await seedProject({ title: 'Hidden' });
    await seedProject({ title: 'Featured', showOnHomepage: true });

    const response = await api
      .get(url('/project/getProjectsForHomepage'))
      .expect(200);

    expect(response.body.map((project: { title: string }) => project.title)).toEqual(
      ['Featured'],
    );
  });

  it('rejects a malformed id before touching the database', async () => {
    const response = await api.get(url('/project/getProjectById/nope')).expect(422);

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
    await api.delete(url(`/project/deleteProject/${id}`)).expect(401);
  });

  it('updates only the fields that were sent', async () => {
    const { token } = await createAdmin();
    const project = await seedProject();

    const response = await api
      .patch(url(`/project/updateProject/${String(project._id)}`))
      .set('Authorization', bearer(token))
      .send({ title: 'Renamed' })
      .expect(200);

    expect(response.body.title).toBe('Renamed');
    expect(response.body.summary).toBe('A short summary');
  });

  it('flips the homepage flag', async () => {
    const { token } = await createAdmin();
    const project = await seedProject();

    const response = await api
      .patch(url(`/project/updateShowOnHomePage/${String(project._id)}`))
      .set('Authorization', bearer(token))
      .expect(200);

    expect(response.body.showOnHomepage).toBe(true);
  });

  it('rejects an empty tech list', async () => {
    const { token } = await createAdmin();
    const project = await seedProject();

    await api
      .patch(url(`/project/updateProject/${String(project._id)}`))
      .set('Authorization', bearer(token))
      .send({ frontEndTech: [] })
      .expect(422);
  });
});
