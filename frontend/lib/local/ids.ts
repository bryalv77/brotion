import { createId } from "@paralleldrive/cuid2";

/**
 * Client-generated entity ids (cuid2). Guest data is created with these and
 * the ids are preserved verbatim when the data is adopted server-side, so
 * merging never needs id remapping (server cuids and cuid2s coexist safely —
 * both are collision-resistant).
 */
export const newId = createId;
