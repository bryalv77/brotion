import type { User } from "@prisma/client";

/**
 * Augment Express's Request with the authenticated user populated by
 * `requireAuth`. Present only on authenticated routes.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
