import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
  // Connection pool settings are configured via DATABASE_URL query parameters:
  // - connection_limit: max number of connections (default: 5, increased to 50)
  // - pool_timeout: timeout in seconds (default: 10, increased to 30)
  // See: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
