import type { ContactMessageInput } from '#shared';
import { Resend } from 'resend';

import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

let client: Resend | undefined;

/**
 * Built on first use so the API boots without mail credentials, the same way
 * Cloudinary is treated. Returns the sender too, which narrows the optional env.
 */
function mailer() {
  const { RESEND_API_KEY, CONTACT_FROM_EMAIL } = env;

  if (!RESEND_API_KEY || !CONTACT_FROM_EMAIL) {
    throw new ApiError(
      503,
      'The contact form is not available right now',
      'MAIL_NOT_CONFIGURED',
    );
  }

  client ??= new Resend(RESEND_API_KEY);

  return { client, from: CONTACT_FROM_EMAIL };
}

export async function sendContactMessage({
  name,
  email,
  message,
}: ContactMessageInput) {
  const { client, from } = mailer();

  // replyTo is what makes this useful: replying from the inbox reaches the
  // visitor directly, so no address has to be copied out of the body.
  const { error } = await client.emails.send({
    from,
    to: env.ADMIN_EMAIL,
    replyTo: email,
    subject: `Portfolio contact from ${name}`,
    text: `${message}\n\n--\n${name} <${email}>`,
  });

  if (error) {
    throw new ApiError(
      502,
      'Could not send your message. Please try again.',
      'MAIL_SEND_FAILED',
      error.message,
    );
  }
}
