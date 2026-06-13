import { prisma, ArticleStatus } from "@rsy/db";
import { siteConfig } from "@rsy/config";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getArticles() {
  try {
    const project = await prisma.project.findFirst({
      where: { domain: siteConfig.domain },
    });
    if (!project) return [];

    return prisma.article.findMany({
      where: { projectId: project.id, status: ArticleStatus.PUBLISHED },
      orderBy: { publishedAt: "desc" },
      include: { cluster: true },
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const articles = await getArticles();

  return (
    <div className="container">
      <section className="hero">
        <h1>{siteConfig.name}</h1>
        <p>{siteConfig.tagline}. Ниша: {siteConfig.niche.label}.</p>
      </section>

      <section className="article-grid">
        {articles.length === 0 ? (
          <p>Статьи скоро появятся. Запустите БД: docker compose up -d && npm run db:push && npm run db:seed</p>
        ) : (
          articles.map((article) => (
            <article key={article.id} className="article-card">
              <Link href={`/article/${article.slug}`}>
                {article.cluster?.category && (
                  <span className="category-badge">{article.cluster.category}</span>
                )}
                <h2>{article.title}</h2>
                <p>{article.description}</p>
              </Link>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
