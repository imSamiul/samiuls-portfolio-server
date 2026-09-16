import { describe, expect, it } from 'vitest';

import { api, url } from '../../test/helpers.js';

describe('resume download', () => {
  // RESUME_PUBLIC_ID is deliberately unset in the test environment.
  it('says so when the PDF has not been uploaded', async () => {
    const response = await api.get(url('/resume/download')).expect(503);

    expect(response.body.code).toBe('RESUME_NOT_CONFIGURED');
  });
});
