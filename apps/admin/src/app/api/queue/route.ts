import { NextResponse } from "next/server";
import { getContentQueue, getIndexQueue } from "@rsy/queue";
import { requireProject } from "@/lib/project";
import { prisma } from "@rsy/db";

export async function POST(request: Request) {
  try {
    const project = await requireProject();
    const body = await request.json();
    const type = body.type as string;

    if (type === "content-all") {
      const clusters = await prisma.keywordCluster.findMany({
        where: { projectId: project.id },
        include: { articles: true },
      });
      const contentQueue = getContentQueue();
      let queued = 0;
      for (const cluster of clusters) {
        if (cluster.articles.length === 0) {
          await contentQueue.add("generate", {
            projectId: project.id,
            clusterId: cluster.id,
          });
          queued++;
        }
      }
      return NextResponse.json({ queued });
    }

    if (type === "index") {
      const indexQueue = getIndexQueue();
      const job = await indexQueue.add("submit-sitemap", { projectId: project.id });
      return NextResponse.json({ jobId: job.id });
    }

    return NextResponse.json({ error: "Invalid type. Use content-all or index" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Queue error" },
      { status: 500 }
    );
  }
}
