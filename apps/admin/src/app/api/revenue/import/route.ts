import { NextResponse } from "next/server";
import { prisma } from "@rsy/db";
import { parseRsyCsv, summarizeRevenue, mergeRevenueWithArticles } from "@rsy/seo";
import { siteConfig } from "@rsy/config";
import { requireProject } from "@/lib/project";

export async function POST(request: Request) {
  try {
    const project = await requireProject();
    const { csv } = await request.json();

    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "CSV required" }, { status: 400 });
    }

    const rows = parseRsyCsv(csv);
    if (!rows.length) {
      return NextResponse.json({ error: "No rows parsed from CSV" }, { status: 400 });
    }

    for (const row of rows) {
      await prisma.revenueSnapshot.create({
        data: {
          projectId: project.id,
          date: new Date(row.date),
          url: row.url,
          impressions: row.impressions,
          clicks: row.clicks,
          revenue: row.revenue,
          ctr: row.ctr,
          rpm: row.rpm,
          source: "rsy_csv",
        },
      });
    }

    const summary = summarizeRevenue(rows);

    const articles = await prisma.article.findMany({
      where: { projectId: project.id },
      select: { slug: true, title: true },
    });

    const merged = mergeRevenueWithArticles(
      summary.byUrl,
      articles.map((a) => ({
        slug: a.slug,
        title: a.title,
        url: `${siteConfig.url}/article/${a.slug}`,
      }))
    );

    return NextResponse.json({
      imported: rows.length,
      summary,
      articles: merged.filter((a) => a.revenue > 0),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const project = await requireProject();
    const snapshots = await prisma.revenueSnapshot.findMany({
      where: { projectId: project.id },
      orderBy: { date: "desc" },
      take: 1000,
    });

    const summary = summarizeRevenue(
      snapshots.map((s) => ({
        date: s.date.toISOString().slice(0, 10),
        url: s.url ?? undefined,
        impressions: s.impressions,
        clicks: s.clicks,
        revenue: s.revenue,
        ctr: s.ctr ?? undefined,
        rpm: s.rpm ?? undefined,
      }))
    );

    return NextResponse.json({ summary, count: snapshots.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 500 }
    );
  }
}
