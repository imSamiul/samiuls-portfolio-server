import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * The website caches project data indefinitely and relies on this webhook to
 * drop it, so the tag names below are a contract with the frontend. There is no
 * shared package, so the two copies are kept in step by hand.
 */
const PROJECTS_TAG = 'projects';

/**
 * Fire and forget on purpose: a write must never fail because the website is
 * unreachable, so the result is logged and swallowed. Call it **after** the
 * response has been sent.
 */
function revalidateWeb(tags: string[]) {
  const { WEB_REVALIDATE_URL, REVALIDATE_SECRET } = env;

  // Unset outside production, where the site is usually not even running.
  if (!WEB_REVALIDATE_URL || !REVALIDATE_SECRET) {
    return;
  }

  void fetch(WEB_REVALIDATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': REVALIDATE_SECRET,
    },
    body: JSON.stringify({ tags }),
  })
    .then((response) => {
      if (!response.ok) {
        logger.warn({ status: response.status, tags }, 'Revalidation rejected');
      }
    })
    .catch((error: unknown) => {
      logger.warn({ err: error, tags }, 'Revalidation failed');
    });
}

/** Drops every list plus the one project's own page. */
export function revalidateProject(slug: string) {
  revalidateWeb([PROJECTS_TAG, `project:${slug}`]);
}
