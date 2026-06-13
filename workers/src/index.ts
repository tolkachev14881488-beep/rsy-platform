import { Worker } from "bullmq";
import { prisma, ArticleStatus, asStringArray } from "@rsy/db";
import { generateArticleFromCluster } from "@rsy/seo";
import { siteConfig } from "@rsy/config";
import { YandexWebmasterClient } from "@rsy/yandex";
import { runAutomationPipeline } from "@rsy/automation";
import {
  QUEUE_NAMES,
  getConnectionOptions,
  getContentQueue,
  getIndexQueue,
  getAutomationQueue,
} from "@rsy/queue";
import { startAutomationScheduler } from "./scheduler";

const connection = getConnectionOptions();

const contentWorker = new Worker(
  QUEUE_NAMES.content,
  async (job) => {
    const { projectId, clusterId } = job.data as { projectId: string; clusterId: string };

    const cluster = await prisma.keywordCluster.findUnique({
      where: { id: clusterId },
      include: { articles: true },
    });

    if (!cluster || cluster.projectId !== projectId || cluster.articles.length > 0) {
      return { skipped: true };
    }

    const article = generateArticleFromCluster({
      seedKeyword: cluster.seedKeyword,
      keywords: asStringArray(cluster.keywords),
      volume: cluster.volume ?? undefined,
      category: cluster.category ?? undefined,
    });

    await prisma.article.create({
      data: {
        projectId,
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

    return { slug: article.slug };
  },
  { connection }
);

const indexWorker = new Worker(
  QUEUE_NAMES.indexing,
  async (job) => {
    const { projectId } = job.data as { projectId: string };
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { error: "project not found" };

    const token = siteConfig.yandex.webmasterToken;
    const hostId = project.webmasterHostId ?? siteConfig.yandex.webmasterHostId;

    if (!token || !hostId) {
      return { skipped: true, reason: "webmaster not configured" };
    }

    const client = new YandexWebmasterClient(token);
    const { user_id } = await client.getUserId();
    await client.submitSitemap(user_id, hostId, `${project.siteUrl}/sitemap.xml`);
    return client.getIndexingStats(user_id, hostId);
  },
  { connection }
);

const automationWorker = new Worker(
  QUEUE_NAMES.automation,
  async (job) => {
    const { projectId, force } = job.data as { projectId: string; force?: boolean };
    return runAutomationPipeline(projectId, { force });
  },
  { connection }
);

contentWorker.on("completed", (job, result) => {
  console.log(`[content] job ${job.id} done`, result);
});

indexWorker.on("completed", (job, result) => {
  console.log(`[index] job ${job.id} done`, result);
});

automationWorker.on("completed", (job, result) => {
  console.log(`[automation] job ${job.id} done`, result);
});

contentWorker.on("failed", (_, err) => console.error("[content] failed", err));
indexWorker.on("failed", (_, err) => console.error("[index] failed", err));
automationWorker.on("failed", (_, err) => console.error("[automation] failed", err));

async function bootstrap() {
  const project = await prisma.project.findFirst({
    where: { domain: siteConfig.domain },
  });
  if (!project) {
    console.log("No project — run db:seed first");
    startAutomationScheduler();
    return;
  }

  try {
    const contentQueue = getContentQueue();
    const indexQueue = getIndexQueue();
    const automationQueue = getAutomationQueue();

    const clusters = await prisma.keywordCluster.findMany({
      where: { projectId: project.id },
      include: { articles: true },
    });

    for (const cluster of clusters) {
      if (cluster.articles.length === 0) {
        await contentQueue.add("generate", { projectId: project.id, clusterId: cluster.id });
      }
    }

    await indexQueue.add("submit-sitemap", { projectId: project.id });

    await automationQueue.add(
      "scan-and-fill",
      { projectId: project.id },
      { repeat: { every: 6 * 60 * 60 * 1000 } }
    );

    console.log("Workers running, BullMQ jobs scheduled");
  } catch (e) {
    console.warn("Redis unavailable, using cron scheduler only:", e);
  }

  startAutomationScheduler();
}

console.log("RSY workers started");
bootstrap().catch(console.error);
