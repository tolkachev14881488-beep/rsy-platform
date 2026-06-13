export const siteConfig = {
  /** Production domain — replace before launch */
  domain: process.env.SITE_DOMAIN ?? "localhost:3000",
  url: process.env.SITE_URL ?? "http://localhost:3000",
  name: process.env.SITE_NAME ?? "СоветыДома",
  tagline: "Практичные советы для дома и быта",
  /** Starter niche: long-tail domestic tips — moderate CPC, low competition entry */
  niche: {
    id: "domestic-tips",
    label: "Бытовые советы",
    description: "Уборка, ремонт, экономия, здоровье дома",
    categories: ["Уборка", "Ремонт", "Кухня", "Экономия", "Здоровье"],
    targetAudience: "Домохозяйки и владельцы квартир 25–55 лет",
    cpcTier: "medium" as const,
  },
  rsy: {
    partnerId: process.env.RSY_PARTNER_ID ?? "",
    blocks: {
      header: process.env.RSY_BLOCK_HEADER ?? "",
      inContent: process.env.RSY_BLOCK_IN_CONTENT ?? "",
      sidebar: process.env.RSY_BLOCK_SIDEBAR ?? "",
      footer: process.env.RSY_BLOCK_FOOTER ?? "",
    },
  },
  yandex: {
    metrikaId: process.env.YANDEX_METRIKA_ID ?? "",
    webmasterToken: process.env.YANDEX_WEBMASTER_TOKEN ?? "",
    webmasterHostId: process.env.YANDEX_WEBMASTER_HOST_ID ?? "",
  },
  seo: {
    defaultLocale: "ru-RU",
    articlesPerCluster: 1,
    minWordCount: 800,
  },
} as const;

export type SiteConfig = typeof siteConfig;
