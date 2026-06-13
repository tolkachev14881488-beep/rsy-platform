import { NextResponse } from "next/server";
import { prisma, ArticleStatus } from "@rsy/db";
import { parseKeywordsCsv, generateArticleFromCluster } from "@rsy/seo";
import { requireProject } from "@/lib/project";

export async function POST(request: Request) {
  try {
    const project = await requireProject();
    const { csv } = await request.json();

    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "CSV required" }, { status: 400 });
    }

    const clusters = parseKeywordsCsv(csv);
    let articlesCreated = 0;

    for (const cluster of clusters) {
      const created = await prisma.keywordCluster.create({
        data: {
          projectId: project.id,
          seedKeyword: cluster.seedKeyword,
          keywords: cluster.keywords,
          volume: cluster.volume,
          category: cluster.category,
          intent: cluster.intent,
        },
      });

      const generated = generateArticleFromCluster(cluster);
      await prisma.article.create({
        data: {
          projectId: project.id,
          clusterId: created.id,
          slug: generated.slug,
          title: generated.title,
          description: generated.description,
          content: generated.content,
          faq: generated.faq,
          wordCount: generated.wordCount,
          status: ArticleStatus.PUBLISHED,
          publishedAt: new Date(),
        },
      });
      articlesCreated++;
    }

    return NextResponse.json({
      clusters: clusters.length,
      articles: articlesCreated,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 }
    );
  }
}
