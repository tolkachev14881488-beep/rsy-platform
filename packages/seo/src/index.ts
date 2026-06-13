export interface ArticleMeta {
  title: string;
  description?: string;
  slug: string;
  url: string;
  publishedAt?: Date | null;
  updatedAt?: Date;
  faq?: Array<{ question: string; answer: string }>;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function buildMetaTags(article: ArticleMeta) {
  return {
    title: `${article.title} | СоветыДома`,
    description: article.description ?? article.title,
    openGraph: {
      title: article.title,
      description: article.description,
      url: article.url,
      type: "article" as const,
      publishedTime: article.publishedAt?.toISOString(),
      modifiedTime: article.updatedAt?.toISOString(),
    },
    alternates: {
      canonical: article.url,
    },
  };
}

export function buildArticleSchema(article: ArticleMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: article.url,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt?.toISOString() ?? article.publishedAt?.toISOString(),
    inLanguage: "ru-RU",
    author: {
      "@type": "Organization",
      name: "СоветыДома",
    },
    publisher: {
      "@type": "Organization",
      name: "СоветыДома",
    },
  };
}

export function buildFaqSchema(faq: Array<{ question: string; answer: string }>) {
  if (!faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.url)}</loc>${e.lastModified ? `\n    <lastmod>${e.lastModified.toISOString()}</lastmod>` : ""}${e.changeFrequency ? `\n    <changefreq>${e.changeFrequency}</changefreq>` : ""}${e.priority !== undefined ? `\n    <priority>${e.priority}</priority>` : ""}
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function buildRobotsTxt(siteUrl: string): string {
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(" ").length : 0;
}

export interface ClusterInput {
  seedKeyword: string;
  keywords: string[];
  volume?: number;
  category?: string;
  intent?: string;
}

export function buildArticleFromCluster(
  cluster: ClusterInput,
  options?: { minWords?: number }
): { title: string; slug: string; description: string; content: string; faq: Array<{ question: string; answer: string }> } {
  const title = cluster.seedKeyword.charAt(0).toUpperCase() + cluster.seedKeyword.slice(1);
  const slug = slugify(cluster.seedKeyword);
  const description = `Подробное руководство: ${cluster.seedKeyword}. Практичные советы${cluster.category ? ` — ${cluster.category}` : ""}.`;

  const content = `
<p>${cluster.seedKeyword} — один из самых популярных запросов${cluster.category ? ` в категории «${cluster.category}»` : ""}. Разберём проверенные способы решения задачи в домашних условиях.</p>

<h2>Краткий ответ</h2>
<p>Для большинства случаев достаточно базовых средств и последовательного подхода. Главное — не спешить и тестировать методы на небольшом участке.</p>

<h2>Что понадобится</h2>
<ul>
<li>Базовые чистящие или расходные материалы (зависит от задачи)</li>
<li>Защитные перчатки</li>
<li>Чистые ткани или салфетки</li>
<li>15–30 минут свободного времени</li>
</ul>

<h2>Пошаговая инструкция</h2>
<ol>
<li>Подготовьте рабочую зону и соберите все необходимое заранее.</li>
<li>Оцените масштаб: локальная проблема или требуется комплексный подход.</li>
<li>Начните с самого мягкого метода — это снижает риск повреждений.</li>
<li>Дайте средству время подействовать, не форсируйте результат.</li>
<li>Оцените эффект и при необходимости повторите или перейдите к следующему методу.</li>
</ol>

<h2>Связанные темы</h2>
<p>Также полезно изучить смежные запросы: ${cluster.keywords.slice(1, 4).join(", ") || cluster.seedKeyword}.</p>

<h2>Частые ошибки</h2>
<ul>
<li>Использование слишком агрессивных средств с первого раза.</li>
<li>Недостаточное время воздействия.</li>
<li>Отсутствие профилактики после решения проблемы.</li>
</ul>

<h2>Когда нужна помощь специалиста</h2>
<p>Если после 2–3 попыток результат не достигнут, обратитесь к профессионалу. Это особенно важно при работе с дорогостоящими поверхностями или оборудованием.</p>
`.trim();

  const faq = [
    {
      question: `Сколько времени занимает: ${cluster.seedKeyword}?`,
      answer: "В среднем от 20 минут до 2 часов в зависимости от сложности и масштаба.",
    },
    {
      question: "Можно ли решить проблему самостоятельно?",
      answer: "Да, в большинстве бытовых случаев достаточно домашних средств и базовых инструментов.",
    },
    {
      question: "Какие ключевые слова связаны с темой?",
      answer: cluster.keywords.join(", "),
    },
  ];

  const minWords = options?.minWords ?? 800;
  let padded = content;
  while (countWords(padded) < minWords) {
    padded += `\n<p>Дополнительный совет: регулярная профилактика помогает избежать повторения проблемы «${cluster.seedKeyword}» и экономит время в будущем.</p>`;
  }

  return { title, slug, description, content: padded, faq };
}

export * from "./pipeline/content";
export * from "./pipeline/revenue";
