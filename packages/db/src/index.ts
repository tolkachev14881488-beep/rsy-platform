import path from "path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: path.resolve(__dirname, "../../../.env") });
config({ path: path.resolve(__dirname, "../.env") });

function ensureDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) return;

  const filePath = url.slice("file:".length);
  if (path.isAbsolute(filePath)) {
    process.env.DATABASE_URL = `file:${filePath}`;
    return;
  }

  const dbFile = path.resolve(__dirname, "..", "prisma", "dev.db");
  process.env.DATABASE_URL = `file:${dbFile}`;
}

ensureDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "@prisma/client";
export { asStringArray } from "./helpers";
