import { PrismaClient, ArticleStatus, RsyPlacement, LayoutVariant } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.upsert({
    where: { domain: "localhost:3000" },
    update: {},
    create: {
      name: "СоветыДома",
      domain: "localhost:3000",
      siteUrl: "http://localhost:3000",
      niche: "domestic-tips",
      metrikaId: process.env.YANDEX_METRIKA_ID || null,
      rsyPartnerId: process.env.RSY_PARTNER_ID || null,
    },
  });

  const placements: { blockId: string; placement: RsyPlacement; label: string }[] = [
    { blockId: "demo-header", placement: "HEADER", label: "Header banner" },
    { blockId: "demo-in-content", placement: "IN_CONTENT", label: "In-content" },
    { blockId: "demo-sidebar", placement: "SIDEBAR", label: "Sidebar sticky" },
    { blockId: "demo-footer", placement: "FOOTER", label: "Footer" },
  ];

  for (const block of placements) {
    await prisma.rsyBlock.upsert({
      where: { projectId_blockId: { projectId: project.id, blockId: block.blockId } },
      update: {},
      create: { projectId: project.id, ...block },
    });
  }

  const clusters = [
    {
      seedKeyword: "как убрать пятна с дивана",
      keywords: ["как убрать пятна с дивана", "чем отстирать диван", "средство для чистки дивана"],
      volume: 4200,
      category: "Уборка",
      intent: "informational",
    },
    {
      seedKeyword: "как сэкономить на коммунальных платежах",
      keywords: ["экономия на коммуналке", "как снизить счета за свет", "советы по экономии воды"],
      volume: 8100,
      category: "Экономия",
      intent: "informational",
    },
    {
      seedKeyword: "как выбрать пылесос для квартиры",
      keywords: ["лучший пылесос для квартиры", "какой пылесос купить", "пылесос для аллергиков"],
      volume: 12000,
      category: "Уборка",
      intent: "commercial",
    },
  ];

  for (const cluster of clusters) {
    const slug = cluster.seedKeyword
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s-]/gi, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);

    const existing = await prisma.article.findUnique({
      where: { projectId_slug: { projectId: project.id, slug } },
    });
    if (existing) continue;

    const created = await prisma.keywordCluster.create({
      data: { projectId: project.id, ...cluster },
    });

    await prisma.article.create({
      data: {
        projectId: project.id,
        clusterId: created.id,
        slug,
        title: cluster.seedKeyword.charAt(0).toUpperCase() + cluster.seedKeyword.slice(1),
        description: `Подробное руководство: ${cluster.seedKeyword}. Практичные советы для дома.`,
        content: buildSampleArticle(cluster.seedKeyword, cluster.category),
        faq: buildFaq(cluster.seedKeyword),
        status: ArticleStatus.PUBLISHED,
        wordCount: 900,
        publishedAt: new Date(),
      },
    });
  }

  await prisma.layoutTest.createMany({
    data: [
      {
        projectId: project.id,
        name: "In-content blocks count",
        variant: LayoutVariant.A,
        config: { inContentBlocks: 2, stickySidebar: true },
        active: true,
      },
      {
        projectId: project.id,
        name: "In-content blocks count",
        variant: LayoutVariant.B,
        config: { inContentBlocks: 3, stickySidebar: false },
        active: true,
      },
    ],
  });

  console.log("Seed complete:", project.name);

  await prisma.automationSettings.upsert({
    where: { projectId: project.id },
    update: {},
    create: {
      projectId: project.id,
      enabled: true,
      autoPublish: true,
      maxArticlesPerRun: 5,
      maxArticlesPerDay: 20,
      scanIntervalHours: 6,
      seedKeywords: [
        "как убрать пятна",
        "как почистить",
        "как сэкономить дома",
        "лучший способ уборки",
        "как выбрать бытовую технику",
      ],
    },
  });
}

function buildSampleArticle(keyword: string, category: string): string {
  return `
<p>${keyword} — частый вопрос среди хозяев. В этой статье собрали проверенные методы, которые работают в домашних условиях без лишних затрат.</p>

<h2>Почему это важно</h2>
<p>Категория «${category}» требует системного подхода. Неправильные действия могут усугубить проблему или привести к лишним расходам.</p>

<h2>Пошаговая инструкция</h2>
<ol>
<li>Оцените масштаб задачи и подготовьте необходимые материалы.</li>
<li>Начните с самого безопасного метода — протестируйте на небольшом участке.</li>
<li>Действуйте последовательно, не пропуская промежуточные этапы.</li>
<li>Зафиксируйте результат и при необходимости повторите процедуру.</li>
</ol>

<h2>Частые ошибки</h2>
<ul>
<li>Использование агрессивных средств без проверки совместимости.</li>
<li>Спешка — недостаточное время на воздействие.</li>
<li>Игнорирование профилактики после решения проблемы.</li>
</ul>

<h2>Когда обратиться к специалисту</h2>
<p>Если домашние методы не дают результата за 2–3 попытки, лучше проконсультироваться со специалистом. Это сэкономит время и деньги в долгосрочной перспективе.</p>
`.trim();
}

function buildFaq(keyword: string) {
  return [
    { question: `Сколько времени занимает: ${keyword}?`, answer: "Обычно от 30 минут до 2 часов в зависимости от сложности." },
    { question: "Можно ли сделать это самостоятельно?", answer: "Да, в большинстве случаев достаточно базовых инструментов и средств." },
    { question: "Какие средства понадобятся?", answer: "Мягкие чистящие средства, перчатки, чистые ткани и при необходимости пылесос." },
  ];
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
