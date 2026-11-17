import { AsyncLocalStorage } from "node:async_hooks";
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

/**
 * Cloudflare Workers forbids reusing I/O objects (like a Neon WebSocket pool)
 * across requests. The Workers entry runs each request with its own client in
 * this store; Node keeps using the module-level singleton.
 */
const requestScope = new AsyncLocalStorage<PrismaClient>();

export function runWithPrisma<T>(client: PrismaClient, fn: () => T): T {
  return requestScope.run(client, fn);
}

export function getPrisma(): PrismaClient {
  const scoped = requestScope.getStore();
  if (scoped) return scoped;
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
