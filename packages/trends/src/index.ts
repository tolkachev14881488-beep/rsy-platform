export interface DiscoveredKeyword {
  keyword: string;
  category?: string;
  score: number;
  suggestRank: number;
  source: string;
}

const SUGGEST_URL = "https://suggest.yandex.ru/suggest-ya.cgi";

const QUERY_PREFIXES = [
  "как",
  "чем",
  "лучший",
  "какой",
  "сколько",
  "можно ли",
  "почему",
];

export async function fetchYandexSuggestions(
  query: string,
  limit = 10
): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      part: query,
      lang: "ru",
      n: String(limit),
      lr: "213",
      v: "4",
    });

    const res = await fetch(`${SUGGEST_URL}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];

    const text = await res.text();
    const data = JSON.parse(text) as unknown;

    if (!Array.isArray(data) || !Array.isArray(data[1])) return [];

    return (data[1] as unknown[])
      .filter((s): s is string => typeof s === "string" && s.length > 3)
      .slice(0, limit);
  } catch {
    return [];
  }
}

function scoreSuggestion(keyword: string, rank: number, category?: string): number {
  let score = Math.max(0, 100 - rank * 8);
  const words = keyword.split(/\s+/).length;
  if (words >= 3 && words <= 7) score += 15;
  if (keyword.includes("?")) score += 5;
  if (category) score += 5;
  if (/^\d/.test(keyword)) score -= 20;
  if (keyword.length > 80) score -= 30;
  return Math.min(100, Math.max(0, score));
}

export async function discoverKeywords(options: {
  seedKeywords: string[];
  categories: string[];
  maxPerSeed?: number;
}): Promise<DiscoveredKeyword[]> {
  const { seedKeywords, categories, maxPerSeed = 8 } = options;
  const seen = new Map<string, DiscoveredKeyword>();

  const queries: Array<{ q: string; category?: string }> = [];

  for (const seed of seedKeywords) {
    queries.push({ q: seed });
  }

  for (const category of categories) {
    for (const prefix of QUERY_PREFIXES.slice(0, 4)) {
      queries.push({ q: `${prefix} ${category.toLowerCase()}`, category });
    }
  }

  for (const { q, category } of queries) {
    const suggestions = await fetchYandexSuggestions(q, maxPerSeed);
    await delay(150);

    suggestions.forEach((keyword, index) => {
      const normalized = keyword.toLowerCase().trim();
      if (normalized.length < 8) return;

      const score = scoreSuggestion(normalized, index, category);
      const existing = seen.get(normalized);

      if (!existing || existing.score < score) {
        seen.set(normalized, {
          keyword: normalized,
          category,
          score,
          suggestRank: index,
          source: "yandex_suggest",
        });
      }
    });
  }

  return [...seen.values()].sort((a, b) => b.score - a.score);
}

export function computeDirection(
  currentScore: number,
  previousScore: number | null | undefined
): "NEW" | "RISING" | "STABLE" | "FALLING" {
  if (previousScore == null) return "NEW";
  const delta = currentScore - previousScore;
  if (delta > 5) return "RISING";
  if (delta < -5) return "FALLING";
  return "STABLE";
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const defaultSeedKeywords = [
  "как убрать пятна",
  "как почистить",
  "как сэкономить дома",
  "лучший способ уборки",
  "как выбрать бытовую технику",
  "как избавиться от запаха",
  "как ухаживать за мебелью",
  "как снизить коммунальные платежи",
];
