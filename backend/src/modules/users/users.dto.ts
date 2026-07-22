import type { User } from "@prisma/client";
import type { UserDTO } from "@notion-clone/shared";

/**
 * Map a Prisma User row to the public UserDTO. Strips `password_hash` and any
 * other internal fields — this is the only place that translation happens.
 */
export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar_url: user.avatar_url,
  };
}
