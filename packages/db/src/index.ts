import path from "path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: path.resolve(__dirname, "../../../.env") });
config({ path: path.resolve(__dirname, "../.env") });

function findMonorepoRoot() {
  const cwd = process.cwd();
  if (cwd.includes(`${path.sep}apps${path.sep}`)) {
    return path.resolve(cwd, "../..");
  }
  if (cwd.endsWith(`${path.sep}apps`) || cwd.includes(`${path.sep}apps${path.sep}web`) || cwd.includes(`${path.sep}apps${path.sep}admin`)) {
    return path.resolve(cwd, "../..");
  }
  return cwd;
}

function ensureDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) return;

  const filePath = url.slice("file:".length);
  if (path.isAbsolute(filePath)) {
    process.env.DATABASE_URL = `file:${filePath}`;
    return;
  }

  const dbFile = path.join(findMonorepoRoot(), "packages", "db", "prisma", "dev.db");
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
