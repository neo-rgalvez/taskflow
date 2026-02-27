import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is set for local development
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL =
    "postgresql://taskflow:taskflow@localhost:5432/taskflow";
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
