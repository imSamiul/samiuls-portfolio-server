import { waitUntil } from '@vercel/functions';

import { env, isServerless } from '../config/env.js';

/**
 * The website caches project data indefinitely and relies on this webhook to
 * drop it, so the tag names below are a contract with the frontend. There is no
 * shared package, so the two copies are kept in step by hand.
 */
const PROJECTS_TAG = 'projects';
const RESUME_TAG = 'resume';

/**
 * Fire and forget on purpose: a write must never fail because the website is
 * unreachable, so the result is swallowed. Call it **after** the response has
 * been sent.
 *
 * Nothing reports a rejected or failed call, so if the site stops picking up
 * changes, check `WEB_REVALIDATE_URL` and `REVALIDATE_SECRET` on both sides.
 */
function revalidateWeb(tags: string[]) {
  const { WEB_REVALIDATE_URL, REVALIDATE_SECRET } = env;

  // Unset outside production, where the site is usually not even running.
  if (!WEB_REVALIDATE_URL || !REVALIDATE_SECRET) {
    return;
  }

  const delivered = fetch(WEB_REVALIDATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-revalidate-secret': REVALIDATE_SECRET,
    },
    body: JSON.stringify({ tags }),
  }).catch(() => {
    // Swallowed: see above.
  });

  // Callers fire this after the response, and a serverless instance can be
  // frozen the moment the response is sent — so the platform has to be told to
  // stay alive until the webhook settles.
  if (isServerless) {
    waitUntil(delivered);
  }
}

/** Drops every list plus the one project's own page. */
export function revalidateProject(slug: string) {
  revalidateWeb([PROJECTS_TAG, `project:${slug}`]);
}

/** The homepage reads the resume metadata to decide whether to link to it. */
export function revalidateResume() {
  revalidateWeb([RESUME_TAG]);
}
