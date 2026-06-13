"use client";

import { RsyBlock, RsyScriptLoader } from "@rsy/rsy/components";
import type { LayoutConfig } from "@rsy/rsy";

interface FaqItem {
  question: string;
  answer: string;
}

interface ArticleViewProps {
  title: string;
  contentHtml: string;
  faq: FaqItem[];
  inContentBlockIds: string[];
  sidebarBlockId?: string;
  footerBlockId?: string;
  partnerId?: string;
  layoutConfig: LayoutConfig;
  layoutVariant: "A" | "B";
}

function splitContentByParagraphs(html: string): string[] {
  const parts = html.split(/(<\/p>)/i);
  const chunks: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const p = parts[i] + (parts[i + 1] ?? "");
    if (p.trim()) chunks.push(p);
  }
  return chunks.length ? chunks : [html];
}

export function ArticleView({
  title,
  contentHtml,
  faq,
  inContentBlockIds,
  sidebarBlockId,
  footerBlockId,
  partnerId,
  layoutConfig,
  layoutVariant,
}: ArticleViewProps) {
  const paragraphs = splitContentByParagraphs(contentHtml);
  const maxAds = Math.min(layoutConfig.inContentBlocks, inContentBlockIds.length);

  return (
    <div className="container">
      <div className="article-layout">
        <article className="article-content">
          <h1>{title}</h1>

          {paragraphs.map((chunk, index) => {
            const pCount = index + 1;
            const adIndex = Math.floor(pCount / 2) - 1;
            const showAd = adIndex >= 0 && adIndex < maxAds && pCount % 2 === 0;

            return (
              <div key={index}>
                <div dangerouslySetInnerHTML={{ __html: chunk }} />
                {showAd && (
                  <RsyBlock
                    blockId={inContentBlockIds[adIndex]}
                    slot="in-content"
                    partnerId={partnerId}
                  />
                )}
              </div>
            );
          })}

          {faq.length > 0 && (
            <section className="faq">
              <h2>Часто задаваемые вопросы</h2>
              {faq.map((item, i) => (
                <div key={i} className="faq-item">
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </div>
              ))}
            </section>
          )}

          {footerBlockId && (
            <RsyBlock blockId={footerBlockId} slot="footer" partnerId={partnerId} />
          )}
        </article>

        <aside className={`sidebar ${layoutConfig.stickySidebar ? "sidebar-sticky" : ""}`}>
          {sidebarBlockId && (
            <RsyBlock blockId={sidebarBlockId} slot="sidebar" partnerId={partnerId} />
          )}
          <p style={{ fontSize: "0.75rem", color: "#999", marginTop: "1rem" }}>
            A/B layout: {layoutVariant}
          </p>
        </aside>
      </div>
      <RsyScriptLoader partnerId={partnerId} />
    </div>
  );
}
