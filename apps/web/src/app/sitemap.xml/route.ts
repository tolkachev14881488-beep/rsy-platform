import { prisma, ArticleStatus } from "@rsy/db";
import { siteConfig } from "@rsy/config";
import { buildSitemapXml, type SitemapEntry } from "@rsy/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  const project = await prisma.project.findFirst({
    where: { domain: siteConfig.domain },
  });

  const baseUrl = project?.siteUrl ?? siteConfig.url;
  const entries: SitemapEntry[] = [{ url: baseUrl, priority: 1, changeFrequency: "daily" }];

  if (project) {
    const articles = await prisma.article.findMany({
      where: { projectId: project.id, status: ArticleStatus.PUBLISHED },
      select: { slug: true, updatedAt: true },
    });

    for (const a of articles) {
      entries.push({
        url: `${baseUrl}/article/${a.slug}`,
        lastModified: a.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  const xml = buildSitemapXml(entries);

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
