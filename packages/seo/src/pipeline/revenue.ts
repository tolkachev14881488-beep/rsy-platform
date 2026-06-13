export interface RsyCsvRow {
  date: string;
  url?: string;
  impressions: number;
  clicks: number;
  revenue: number;
  ctr?: number;
  rpm?: number;
}

export function parseRsyCsv(csv: string): RsyCsvRow[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(/[,;\t]/).map((h) => h.trim().replace(/^"|"$/g, ""));

  const col = (names: string[]) => {
    for (const n of names) {
      const idx = header.findIndex((h) => h.includes(n));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const dateIdx = col(["date", "дата"]);
  const urlIdx = col(["url", "page", "страница", "сайт"]);
  const impIdx = col(["impression", "показ"]);
  const clickIdx = col(["click", "клик"]);
  const revIdx = col(["revenue", "доход", "заработок", "выплата"]);
  const ctrIdx = col(["ctr"]);
  const rpmIdx = col(["rpm", "cpm"]);

  const rows: RsyCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ""));
    if (!parts.length) continue;

    const impressions = parseFloat(parts[impIdx >= 0 ? impIdx : 1]) || 0;
    const clicks = parseFloat(parts[clickIdx >= 0 ? clickIdx : 2]) || 0;
    const revenue = parseFloat(parts[revIdx >= 0 ? revIdx : 3]) || 0;

    rows.push({
      date: parts[dateIdx >= 0 ? dateIdx : 0] ?? new Date().toISOString().slice(0, 10),
      url: urlIdx >= 0 ? parts[urlIdx] : undefined,
      impressions,
      clicks,
      revenue,
      ctr: ctrIdx >= 0 ? parseFloat(parts[ctrIdx]) : clicks && impressions ? (clicks / impressions) * 100 : undefined,
      rpm: rpmIdx >= 0 ? parseFloat(parts[rpmIdx]) : impressions ? (revenue / impressions) * 1000 : undefined,
    });
  }

  return rows;
}

export interface RevenueSummary {
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  avgRpm: number;
  avgCtr: number;
  byUrl: Array<{ url: string; revenue: number; impressions: number; rpm: number }>;
}

export function summarizeRevenue(rows: RsyCsvRow[]): RevenueSummary {
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalImpressions = rows.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);

  const urlMap = new Map<string, { revenue: number; impressions: number }>();
  for (const row of rows) {
    if (!row.url) continue;
    const cur = urlMap.get(row.url) ?? { revenue: 0, impressions: 0 };
    cur.revenue += row.revenue;
    cur.impressions += row.impressions;
    urlMap.set(row.url, cur);
  }

  const byUrl = [...urlMap.entries()]
    .map(([url, data]) => ({
      url,
      revenue: data.revenue,
      impressions: data.impressions,
      rpm: data.impressions ? (data.revenue / data.impressions) * 1000 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    totalRevenue,
    totalImpressions,
    totalClicks,
    avgRpm: totalImpressions ? (totalRevenue / totalImpressions) * 1000 : 0,
    avgCtr: totalImpressions ? (totalClicks / totalImpressions) * 100 : 0,
    byUrl,
  };
}

export function mergeRevenueWithArticles(
  byUrl: RevenueSummary["byUrl"],
  articles: Array<{ slug: string; title: string; url: string }>
): Array<{ slug: string; title: string; url: string; revenue: number; impressions: number; rpm: number }> {
  return articles.map((article) => {
    const match = byUrl.find(
      (r) => r.url.includes(article.slug) || article.url.includes(r.url)
    );
    return {
      ...article,
      revenue: match?.revenue ?? 0,
      impressions: match?.impressions ?? 0,
      rpm: match?.rpm ?? 0,
    };
  });
}
