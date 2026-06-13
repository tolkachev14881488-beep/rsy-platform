import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  const { prisma } = await import("@rsy/db");
  const { siteConfig } = await import("@rsy/config");
  const { runAutomationPipeline } = await import("@rsy/automation");

  const project = await prisma.project.findFirst({
    where: { domain: siteConfig.domain },
  });

  if (!project) {
    console.error("Project not found. Run: npm run db:seed");
    process.exit(1);
  }

  console.log(`Running automation for ${project.name}...`);
  const result = await runAutomationPipeline(project.id, { force: true });

  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
