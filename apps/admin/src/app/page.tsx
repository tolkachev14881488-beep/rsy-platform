import { prisma } from "@rsy/db";
import { siteConfig } from "@rsy/config";
import { summarizeRevenue } from "@rsy/seo";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  try {
    const project = await prisma.project.findFirst({
      where: { domain: siteConfig.domain },
      include: {
        _count: { select: { articles: true, keywordClusters: true, rsyBlocks: true } },
      },
    });

    if (!project) {
      return null;
    }

    const [publishedCount, revenueRows, layoutTests] = await Promise.all([
      prisma.article.count({
        where: { projectId: project.id, status: "PUBLISHED" },
      }),
      prisma.revenueSnapshot.findMany({
        where: { projectId: project.id },
        orderBy: { date: "desc" },
        take: 500,
      }),
      prisma.layoutTest.findMany({
        where: { projectId: project.id, active: true },
      }),
    ]);

    const revenue = summarizeRevenue(
      revenueRows.map((r) => ({
        date: r.date.toISOString().slice(0, 10),
        url: r.url ?? undefined,
        impressions: r.impressions,
        clicks: r.clicks,
        revenue: r.revenue,
        ctr: r.ctr ?? undefined,
        rpm: r.rpm ?? undefined,
      }))
    );

    return { project, publishedCount, revenue, layoutTests };
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div>
        <h1 className="page-title">Дашборд</h1>
        <div className="alert alert-info">
          БД не подключена. Запустите: docker compose up -d && npm install && npm run db:push && npm run db:seed
        </div>
      </div>
    );
  }

  const { project, publishedCount, revenue, layoutTests } = data;

  return (
    <div>
      <h1 className="page-title">Дашборд — {project.name}</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Опубликовано статей</div>
          <div className="value">{publishedCount}</div>
        </div>
        <div className="stat-card">
          <div className="label">Кластеров</div>
          <div className="value">{project._count.keywordClusters}</div>
        </div>
        <div className="stat-card">
          <div className="label">Блоков РСЯ</div>
          <div className="value">{project._count.rsyBlocks}</div>
        </div>
        <div className="stat-card">
          <div className="label">Доход (всего)</div>
          <div className="value">{revenue.totalRevenue.toFixed(2)} ₽</div>
        </div>
        <div className="stat-card">
          <div className="label">Средний RPM</div>
          <div className="value">{revenue.avgRpm.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="label">CTR</div>
          <div className="value">{revenue.avgCtr.toFixed(2)}%</div>
        </div>
      </div>

      <div className="card">
        <h2>Ниша</h2>
        <p><strong>{siteConfig.niche.label}</strong> — {siteConfig.niche.description}</p>
        <p>Домен: {project.domain}</p>
      </div>

      <div className="card">
        <h2>Активные A/B тесты layout</h2>
        {layoutTests.length === 0 ? (
          <p>Нет активных тестов</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Тест</th>
                <th>Вариант</th>
                <th>Конфиг</th>
                <th>Доход</th>
              </tr>
            </thead>
            <tbody>
              {layoutTests.map((t) => (
                <tr key={t.id} className={t.variant === "A" ? "variant-a" : "variant-b"}>
                  <td>{t.name}</td>
                  <td>{t.variant}</td>
                  <td><code>{JSON.stringify(t.config)}</code></td>
                  <td>{t.revenue.toFixed(2)} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {revenue.byUrl.length > 0 && (
        <div className="card">
          <h2>Топ страниц по доходу</h2>
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Доход</th>
                <th>Показы</th>
                <th>RPM</th>
              </tr>
            </thead>
            <tbody>
              {revenue.byUrl.slice(0, 10).map((row) => (
                <tr key={row.url}>
                  <td>{row.url}</td>
                  <td>{row.revenue.toFixed(2)} ₽</td>
                  <td>{row.impressions}</td>
                  <td>{row.rpm.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
