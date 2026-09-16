import { RESUME_DOWNLOAD_NAME } from '#shared';
import { describe, expect, it } from 'vitest';

import { SiteAsset } from '../../models/index.js';
import { api, bearer, createAdmin, url } from '../../test/helpers.js';

function seedResume(version = 1700000000) {
  return SiteAsset.create({
    key: 'resume',
    publicId: 'portfolio/resume/resume.pdf',
    version,
  });
}

describe('resume download', () => {
  it('says so when no resume has been uploaded yet', async () => {
    const response = await api.get(url('/resume/download')).expect(503);

    expect(response.body.code).toBe('RESUME_NOT_CONFIGURED');
  });

  it('redirects instead of streaming the bytes through the API', async () => {
    await seedResume();

    const response = await api.get(url('/resume/download')).expect(302);

    expect(response.headers.location).toContain('res.cloudinary.com');
    expect(response.headers.location).toContain('/raw/upload/');
  });

  it('names the downloaded file and busts the cache with the version', async () => {
    await seedResume(1712345678);

    const response = await api.get(url('/resume/download')).expect(302);

    expect(response.headers.location).toContain(
      `fl_attachment:${RESUME_DOWNLOAD_NAME}`,
    );
    // The version is what makes a replaced PDF reach visitors immediately.
    expect(response.headers.location).toContain('v1712345678');
  });

  it('follows the new version after the pointer is replaced', async () => {
    await seedResume(1000000001);
    await SiteAsset.updateOne({ key: 'resume' }, { version: 1000000002 });

    const response = await api.get(url('/resume/download')).expect(302);

    expect(response.headers.location).toContain('v1000000002');
    expect(response.headers.location).not.toContain('v1000000001');
  });
});

describe('resume upload', () => {
  it('refuses an upload without a token', async () => {
    await api.post(url('/resume')).expect(401);
  });

  it('rejects anything that is not a PDF', async () => {
    const { token } = await createAdmin();

    const response = await api
      .post(url('/resume'))
      .set('Authorization', bearer(token))
      .attach('resume', Buffer.from('not a pdf'), {
        filename: 'resume.png',
        contentType: 'image/png',
      })
      .expect(400);

    expect(response.body.code).toBe('UNSUPPORTED_RESUME_TYPE');
  });

  it('asks for a file when none is attached', async () => {
    const { token } = await createAdmin();

    const response = await api
      .post(url('/resume'))
      .set('Authorization', bearer(token))
      .expect(400);

    expect(response.body.code).toBe('RESUME_REQUIRED');
  });
});
