import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api, url } from '../../test/helpers.js';

// Hoisted so the mock factory below can close over it without hitting the TDZ.
const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

const MESSAGE = {
  name: 'Recruiter',
  email: '  Hiring@Example.com ',
  message: 'We have a role that matches your background, can we talk?',
};

describe('contact', () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue({ data: { id: 'mail-1' }, error: null });
  });

  it('mails the admin and replies to the visitor', async () => {
    const response = await api.post(url('/contact')).send(MESSAGE).expect(200);

    expect(response.body.success).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);

    const payload = send.mock.calls[0]?.[0] as Record<string, string>;
    expect(payload.to).toBe('admin@example.com');
    // Trimmed and lowercased, so replying from the inbox actually works.
    expect(payload.replyTo).toBe('hiring@example.com');
    expect(payload.text).toContain(MESSAGE.message);
  });

  it('accepts a filled honeypot but sends nothing', async () => {
    const response = await api
      .post(url('/contact'))
      .send({ ...MESSAGE, website: 'http://spam.example' })
      .expect(200);

    // Indistinguishable from success, so a bot learns nothing.
    expect(response.body.success).toBe(true);
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects a message that is too short', async () => {
    const response = await api
      .post(url('/contact'))
      .send({ ...MESSAGE, message: 'too short' })
      .expect(422);

    expect(response.body.code).toBe('VALIDATION_ERROR');
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects a malformed email', async () => {
    await api
      .post(url('/contact'))
      .send({ ...MESSAGE, email: 'not-an-email' })
      .expect(422);

    expect(send).not.toHaveBeenCalled();
  });

  it('surfaces a provider failure instead of pretending it worked', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'domain blocked' } });

    const response = await api.post(url('/contact')).send(MESSAGE).expect(502);

    expect(response.body.code).toBe('MAIL_SEND_FAILED');
  });
});
