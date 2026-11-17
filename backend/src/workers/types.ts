import type { User } from "@prisma/client";
import type { Env } from "./env.js";

export interface AppEnv {
  Bindings: Env;
  Variables: {
    user: User;
  };
}
