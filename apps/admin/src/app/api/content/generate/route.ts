import { NextResponse } from "next/server";
import { prisma, ArticleStatus, asStringArray } from "@rsy/db";
import { generateArticleFromCluster } from "@rsy/seo";
import { requireProject } from "@/lib/project";

export async function POST() {
  try {
    const project = await requireProject();

    const clusters = await prisma.keywordCluster.findMany({
      where: { projectId: project.id },
      include: { articles: true },
    });

    let generated = 0;

    for (const cluster of clusters) {
      if (cluster.articles.length > 0) continue;

      const article = generateArticleFromCluster({
        seedKeyword: cluster.seedKeyword,
        keywords: asStringArray(cluster.keywords),
        volume: cluster.volume ?? undefined,
        category: cluster.category ?? undefined,
        intent: cluster.intent ?? undefined,
      });

      await prisma.article.create({
        data: {
          projectId: project.id,
          clusterId: cluster.id,
          slug: article.slug,
          title: article.title,
          description: article.description,
          content: article.content,
          faq: article.faq,
          wordCount: article.wordCount,
          status: ArticleStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });
      generated++;
    }

    return NextResponse.json({ generated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}
