import type { RequestHandler } from 'express';

import type { ContactMessageInput } from '../../shared/index.js';
import { sendSuccess } from '../../utils/response.js';
import * as contactService from './contact.service.js';

const ACCEPTED = 'Thanks — your message is on its way.';

export const send: RequestHandler<unknown, unknown, ContactMessageInput> =
  async (req, res) => {
    const { website, ...message } = req.body;

    // A filled honeypot means a bot. Answer exactly as if it worked, so it has
    // nothing to learn and nothing to retry.
    if (website) {
      sendSuccess(res, ACCEPTED, null);
      return;
    }

    await contactService.sendContactMessage(message);

    sendSuccess(res, ACCEPTED, null);
  };
