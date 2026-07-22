import type { User } from "@prisma/client";
import { getPrisma } from "../../prisma/client.js";

/**
 * User persistence helpers. Thin on purpose — business rules (password rules,
 * session issuance) live in the auth service.
 */

export async function findUserByEmail(email: string): Promise<User | null> {
  return getPrisma().user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function findUserById(id: string): Promise<User | null> {
  return getPrisma().user.findUnique({ where: { id } });
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  name?: string;
}): Promise<User> {
  return getPrisma().user.create({
    data: {
      email: input.email.toLowerCase(),
      password_hash: input.passwordHash,
      name: input.name ?? null,
    },
  });
}
