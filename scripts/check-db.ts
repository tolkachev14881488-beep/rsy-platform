import { prisma } from "@rsy/db";

async function main() {
  const p = await prisma.project.findFirst();
  const a = await prisma.article.count();
  console.log("project:", p?.name, "articles:", a);
}

main()
  .finally(() => prisma.$disconnect());
