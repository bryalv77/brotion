import { PrismaClient } from "@prisma/client";

/**
 * Lazy, singleton Prisma client.
 *
 * The client is NOT instantiated at module load — this lets the server boot
 * even when no database is reachable (e.g. the /health endpoint and frontend
 * must work without a DB per spec 001). Code that needs the DB calls
 * `getPrisma()`, which connects on first use.
 */
let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (prisma) return prisma;
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
  return prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
