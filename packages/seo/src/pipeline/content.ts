import { buildArticleFromCluster, countWords, type ClusterInput } from "../index";

export interface GeneratedArticle {
  title: string;
  slug: string;
  description: string;
  content: string;
  faq: Array<{ question: string; answer: string }>;
  wordCount: number;
}

export function generateArticleFromCluster(cluster: ClusterInput): GeneratedArticle {
  const article = buildArticleFromCluster(cluster);
  return {
    ...article,
    wordCount: countWords(article.content),
  };
}

export function parseKeywordsCsv(csv: string): ClusterInput[] {
  const lines = csv.trim().split("\n");
  const clusters: ClusterInput[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (i === 0 && line.toLowerCase().includes("keyword"))) continue;

    const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
    const seedKeyword = parts[0];
    if (!seedKeyword) continue;

    clusters.push({
      seedKeyword,
      keywords: parts.slice(1).filter(Boolean).length ? parts.slice(1) : [seedKeyword],
      volume: parts[parts.length - 1] && /^\d+$/.test(parts[parts.length - 1])
        ? parseInt(parts[parts.length - 1], 10)
        : undefined,
      category: parts[2] || undefined,
    });
  }

  return clusters;
}
