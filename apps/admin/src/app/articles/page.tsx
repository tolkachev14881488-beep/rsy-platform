import { prisma } from "@rsy/db";
import { siteConfig } from "@rsy/config";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  let articles: Array<{
    id: string;
    title: string;
    status: string;
    wordCount: number;
    slug: string;
    cluster: { category: string | null } | null;
  }> = [];

  try {
    const project = await prisma.project.findFirst({
      where: { domain: siteConfig.domain },
    });
    if (project) {
      articles = await prisma.article.findMany({
        where: { projectId: project.id },
        orderBy: { updatedAt: "desc" },
        include: { cluster: true },
      });
    }
  } catch {
    /* db unavailable */
  }

  return (
    <div>
      <h1 className="page-title">Статьи</h1>

      <div className="card">
        <Link href="/clusters" className="btn">
          + Сгенерировать из кластеров
        </Link>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Заголовок</th>
              <th>Категория</th>
              <th>Статус</th>
              <th>Слов</th>
              <th>Slug</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.cluster?.category ?? "—"}</td>
                <td>
                  <span className={`badge badge-${a.status.toLowerCase()}`}>
                    {a.status}
                  </span>
                </td>
                <td>{a.wordCount}</td>
                <td>
                  <a
                    href={`${siteConfig.url}/article/${a.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {a.slug}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
