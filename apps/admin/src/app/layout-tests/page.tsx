import { prisma } from "@rsy/db";
import { siteConfig } from "@rsy/config";
import { LayoutFeedbackForm } from "@/components/LayoutFeedbackForm";

export const dynamic = "force-dynamic";

export default async function LayoutTestsPage() {
  let tests: Awaited<ReturnType<typeof prisma.layoutTest.findMany>> = [];

  try {
    const project = await prisma.project.findFirst({
      where: { domain: siteConfig.domain },
    });
    if (project) {
      tests = await prisma.layoutTest.findMany({
        where: { projectId: project.id },
        orderBy: { startedAt: "desc" },
      });
    }
  } catch {
    /* db unavailable */
  }

  const variantA = tests.filter((t) => t.variant === "A");
  const variantB = tests.filter((t) => t.variant === "B");

  const totalRevenueA = variantA.reduce((s, t) => s + t.revenue, 0);
  const totalRevenueB = variantB.reduce((s, t) => s + t.revenue, 0);
  const winner = totalRevenueA >= totalRevenueB ? "A" : "B";

  return (
    <div>
      <h1 className="page-title">A/B тесты рекламного layout</h1>

      <div className="alert alert-info">
        Посетители сайта автоматически получают cookie <code>rsy_layout</code> (A или B).
        Вариант A: 2 in-content блока + sticky sidebar. Вариант B: 3 in-content блока без sticky.
      </div>

      <div className="stats-grid">
        <div className="stat-card variant-a">
          <div className="label">Вариант A — доход</div>
          <div className="value">{totalRevenueA.toFixed(2)} ₽</div>
        </div>
        <div className="stat-card variant-b">
          <div className="label">Вариант B — доход</div>
          <div className="value">{totalRevenueB.toFixed(2)} ₽</div>
        </div>
        <div className="stat-card">
          <div className="label">Лидер</div>
          <div className="value">{winner}</div>
        </div>
      </div>

      <div className="card">
        <h2>Тесты</h2>
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Вариант</th>
              <th>Конфиг</th>
              <th>Показы</th>
              <th>Доход</th>
              <th>Bounce</th>
              <th>Активен</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.variant}</td>
                <td><code>{JSON.stringify(t.config)}</code></td>
                <td>{t.impressions}</td>
                <td>{t.revenue.toFixed(2)} ₽</td>
                <td>{t.bounceRate != null ? `${t.bounceRate.toFixed(1)}%` : "—"}</td>
                <td>{t.active ? "Да" : "Нет"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LayoutFeedbackForm />
    </div>
  );
}
