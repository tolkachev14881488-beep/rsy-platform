import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { prisma, ArticleStatus, RsyPlacement } from "@rsy/db";
import { siteConfig } from "@rsy/config";
import { buildMetaTags, buildArticleSchema, buildFaqSchema } from "@rsy/seo";
import { layoutConfigForVariant, getLayoutVariantFromCookie } from "@rsy/rsy";
import { ArticleView } from "@/components/ArticleView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  const project = await prisma.project.findFirst({
    where: { domain: siteConfig.domain },
  });
  if (!project) return null;

  return prisma.article.findFirst({
    where: { projectId: project.id, slug, status: ArticleStatus.PUBLISHED },
    include: {
      cluster: true,
      project: { include: { rsyBlocks: { where: { active: true } } } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Не найдено" };

  const url = `${siteConfig.url}/article/${slug}`;
  const meta = buildMetaTags({
    title: article.title,
    description: article.description ?? undefined,
    slug,
    url,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
  });

  return {
    title: meta.title,
    description: meta.description,
    openGraph: meta.openGraph,
    alternates: meta.alternates,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const cookieStore = await cookies();
  const layoutVariant = getLayoutVariantFromCookie(cookieStore.get("rsy_layout")?.value);
  const layoutConfig = layoutConfigForVariant(layoutVariant);

  const inContentBlockIds = article.project.rsyBlocks
    .filter((b) => b.placement === RsyPlacement.IN_CONTENT)
    .map((b) => b.blockId);

  const sidebarBlock = article.project.rsyBlocks.find(
    (b) => b.placement === RsyPlacement.SIDEBAR
  );
  const footerBlock = article.project.rsyBlocks.find(
    (b) => b.placement === RsyPlacement.FOOTER
  );

  const faq = (article.faq as Array<{ question: string; answer: string }>) ?? [];
  const url = `${siteConfig.url}/article/${slug}`;

  const articleSchema = buildArticleSchema({
    title: article.title,
    description: article.description ?? undefined,
    slug,
    url,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
  });

  const faqSchema = buildFaqSchema(faq);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <ArticleView
        title={article.title}
        contentHtml={article.content}
        faq={faq}
        inContentBlockIds={
          inContentBlockIds.length ? inContentBlockIds : ["demo-in-content"]
        }
        sidebarBlockId={sidebarBlock?.blockId}
        footerBlockId={footerBlock?.blockId}
        partnerId={article.project.rsyPartnerId ?? siteConfig.rsy.partnerId}
        layoutConfig={layoutConfig}
        layoutVariant={layoutVariant}
      />
    </>
  );
}
