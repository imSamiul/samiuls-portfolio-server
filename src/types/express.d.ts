declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth once the bearer token is verified. */
      auth?: { id: string };
    }
  }
}

export {};
