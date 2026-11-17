import type { User } from "@prisma/client";
import type { FileBucket } from "../modules/files/files.service.js";

export interface AppBindings {
  CLIENT_ORIGIN?: string;
  BUCKET: FileBucket;
}

export interface AppEnv {
  Bindings: AppBindings;
  Variables: {
    user: User;
  };
}
