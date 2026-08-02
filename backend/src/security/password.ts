import argon2 from "argon2";

/**
 * Password hashing with argon2id (OWASP-recommended baseline).
 * Params are the OWASP suggested minimums for argon2id.
 *
 * In test mode (NODE_ENV=test) the params are dropped to the minimum so the
 * hundreds of register/login calls in the e2e suite don't each pay a 50–150ms
 * hash. The hash format is still valid argon2id, so production code paths are
 * unchanged. Set NODE_ENV back to "development"/"production" in real envs.
 */
const OPTIONS: argon2.Options =
  process.env.NODE_ENV === "test"
    ? { type: argon2.argon2id, memoryCost: 1024, timeCost: 2, parallelism: 1 }
    : { type: argon2.argon2id, memoryCost: 19_456, timeCost: 2, parallelism: 1 };

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, OPTIONS);
}

export function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}
