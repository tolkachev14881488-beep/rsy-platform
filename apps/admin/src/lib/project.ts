import { prisma } from "@rsy/db";
import { siteConfig } from "@rsy/config";

export async function getProject() {
  return prisma.project.findFirst({
    where: { domain: siteConfig.domain },
  });
}

export async function requireProject() {
  const project = await getProject();
  if (!project) {
    throw new Error("Project not found. Run db:seed first.");
  }
  return project;
}
