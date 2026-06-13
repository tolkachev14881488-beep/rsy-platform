import {
  prisma,
  ArticleStatus,
  TrendDirection,
  asStringArray,
} from "@rsy/db";
import { generateArticleFromCluster, slugify } from "@rsy/seo";
import { siteConfig } from "@rsy/config";
import {
  discoverKeywords,
  computeDirection,
  defaultSeedKeywords,
} from "@rsy/trends";
import { YandexWebmasterClient } from "@rsy/yandex";

export interface AutomationRunResult {
  trendsScanned: number;
  newTrends: number;
  risingTrends: number;
  clustersCreated: number;
  articlesPublished: number;
  skippedDailyLimit: boolean;
  errors: string[];
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function runAutomationPipeline(
  projectId: string,
  options?: { force?: boolean }
): Promise<AutomationRunResult> {
  const result: AutomationRunResult = {
    trendsScanned: 0,
    newTrends: 0,
    risingTrends: 0,
    clustersCreated: 0,
    articlesPublished: 0,
    skippedDailyLimit: false,
    errors: [],
  };

  let settings = await prisma.automationSettings.findUnique({
    where: { projectId },
  });

  if (!settings) {
    settings = await prisma.automationSettings.create({
      data: {
        projectId,
        seedKeywords: defaultSeedKeywords,
        enabled: true,
        autoPublish: true,
      },
    });
  }

  if (!settings.enabled && !options?.force) {
    result.errors.push("Automation disabled");
    return result;
  }

  const today = todayKey();
  let articlesToday = settings.articlesToday;
  if (settings.articlesTodayDate !== today) {
    articlesToday = 0;
  }

  const remainingDaily = Math.max(0, settings.maxArticlesPerDay - articlesToday);
  const articlesToCreate = Math.min(settings.maxArticlesPerRun, remainingDaily);

  if (articlesToCreate === 0) {
    result.skippedDailyLimit = true;
    result.errors.push("Daily article limit reached");
    await saveRunResult(projectId, settings.id, result, articlesToday, today);
    return result;
  }

  const seedKeywords = asStringArray(settings.seedKeywords);
  const categories = siteConfig.niche.categories;

  let discovered;
  try {
    discovered = await discoverKeywords({
      seedKeywords: seedKeywords.length ? seedKeywords : defaultSeedKeywords,
      categories: [...categories],
    });
  } catch (e) {
    result.errors.push(`Trend discovery failed: ${e}`);
    await saveRunResult(projectId, settings.id, result, articlesToday, today);
    return result;
  }

  result.trendsScanned = discovered.length;

  const existingClusters = await prisma.keywordCluster.findMany({
    where: { projectId },
    select: { seedKeyword: true },
  });
  const existingSlugs = new Set(
    (await prisma.article.findMany({ where: { projectId }, select: { slug: true } })).map(
      (a) => a.slug
    )
  );
  const existingKeywords = new Set(
    existingClusters.map((c) => c.seedKeyword.toLowerCase())
  );

  const previousSnapshots = await prisma.trendSnapshot.findMany({
    where: {
      projectId,
      capturedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { capturedAt: "desc" },
  });

  const prevScoreMap = new Map<string, number>();
  for (const snap of previousSnapshots) {
    if (!prevScoreMap.has(snap.keyword)) {
      prevScoreMap.set(snap.keyword, snap.score);
    }
  }

  const candidates: Array<{
    keyword: string;
    category?: string;
    score: number;
    direction: TrendDirection;
    suggestRank: number;
  }> = [];

  for (const item of discovered) {
    const prev = prevScoreMap.get(item.keyword);
    const direction = computeDirection(item.score, prev) as TrendDirection;

    await prisma.trendSnapshot.create({
      data: {
        projectId,
        keyword: item.keyword,
        category: item.category,
        score: item.score,
        previousScore: prev ?? null,
        direction,
        source: item.source,
        suggestRank: item.suggestRank,
      },
    });

    if (direction === TrendDirection.NEW) result.newTrends++;
    if (direction === TrendDirection.RISING) result.risingTrends++;

    const slug = slugify(item.keyword);
    if (existingKeywords.has(item.keyword) || existingSlugs.has(slug)) continue;
    if (item.score < 40) continue;

    candidates.push({
      keyword: item.keyword,
      category: item.category,
      score: item.score,
      direction,
      suggestRank: item.suggestRank,
    });
  }

  candidates.sort((a, b) => {
    const dirWeight = (d: TrendDirection) =>
      d === TrendDirection.RISING ? 3 : d === TrendDirection.NEW ? 2 : 1;
    return dirWeight(b.direction) - dirWeight(a.direction) || b.score - a.score;
  });

  let published = 0;

  for (const candidate of candidates) {
    if (published >= articlesToCreate) break;

    try {
      const cluster = await prisma.keywordCluster.create({
        data: {
          projectId,
          seedKeyword: candidate.keyword,
          keywords: [candidate.keyword],
          category: candidate.category,
          intent: "informational",
          volume: Math.round(candidate.score * 100),
        },
      });

      result.clustersCreated++;
      existingKeywords.add(candidate.keyword);

      if (!settings.autoPublish) continue;

      const article = generateArticleFromCluster({
        seedKeyword: candidate.keyword,
        keywords: [candidate.keyword],
        category: candidate.category,
      });

      if (existingSlugs.has(article.slug)) continue;

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

      existingSlugs.add(article.slug);
      published++;
      result.articlesPublished++;
    } catch (e) {
      result.errors.push(`Article failed for "${candidate.keyword}": ${e}`);
    }
  }

  articlesToday += published;

  try {
    await submitSitemapIfConfigured(projectId);
  } catch (e) {
    result.errors.push(`Sitemap: ${e}`);
  }

  await saveRunResult(projectId, settings.id, result, articlesToday, today);
  return result;
}

async function saveRunResult(
  projectId: string,
  settingsId: string,
  result: AutomationRunResult,
  articlesToday: number,
  today: string
) {
  await prisma.automationSettings.update({
    where: { id: settingsId },
    data: {
      lastRunAt: new Date(),
      lastRunResult: JSON.parse(JSON.stringify(result)),
      articlesToday,
      articlesTodayDate: today,
    },
  });
}

async function submitSitemapIfConfigured(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  const token = siteConfig.yandex.webmasterToken;
  const hostId = project.webmasterHostId ?? siteConfig.yandex.webmasterHostId;
  if (!token || !hostId) return;

  const client = new YandexWebmasterClient(token);
  const { user_id } = await client.getUserId();
  await client.submitSitemap(user_id, hostId, `${project.siteUrl}/sitemap.xml`);
}

export async function getTrendSummary(projectId: string) {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const [rising, newTrends, recent, settings] = await Promise.all([
    prisma.trendSnapshot.count({
      where: { projectId, direction: TrendDirection.RISING, capturedAt: { gte: since } },
    }),
    prisma.trendSnapshot.count({
      where: { projectId, direction: TrendDirection.NEW, capturedAt: { gte: since } },
    }),
    prisma.trendSnapshot.findMany({
      where: { projectId, capturedAt: { gte: since } },
      orderBy: [{ score: "desc" }, { capturedAt: "desc" }],
      take: 50,
    }),
    prisma.automationSettings.findUnique({ where: { projectId } }),
  ]);

  const unique = new Map<string, (typeof recent)[0]>();
  for (const t of recent) {
    if (!unique.has(t.keyword)) unique.set(t.keyword, t);
  }

  return {
    rising,
    newTrends,
    topTrends: [...unique.values()].slice(0, 20),
    settings,
  };
}
