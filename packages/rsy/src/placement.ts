export type RsySlot = "header" | "in-content" | "sidebar" | "footer";

export interface LayoutConfig {
  inContentBlocks: number;
  stickySidebar: boolean;
  mobileFirstScreenAds: boolean;
}

export const DEFAULT_LAYOUT: LayoutConfig = {
  inContentBlocks: 2,
  stickySidebar: true,
  mobileFirstScreenAds: false,
};

export const PLACEMENT_RULES = {
  header: {
    desktop: true,
    mobile: false,
    lazyLoad: true,
    minScrollDepth: 0,
  },
  "in-content": {
    desktop: true,
    mobile: true,
    lazyLoad: true,
    /** Insert after N-th paragraph */
    afterParagraph: 2,
    minScrollDepth: 0.15,
  },
  sidebar: {
    desktop: true,
    mobile: false,
    lazyLoad: true,
    sticky: true,
    minScrollDepth: 0.1,
  },
  footer: {
    desktop: true,
    mobile: true,
    lazyLoad: true,
    minScrollDepth: 0.5,
  },
} as const;

export function getLayoutVariantFromCookie(cookieValue?: string): "A" | "B" {
  if (cookieValue === "B") return "B";
  if (cookieValue === "A") return "A";
  return Math.random() < 0.5 ? "A" : "B";
}

export function layoutConfigForVariant(variant: "A" | "B"): LayoutConfig {
  if (variant === "B") {
    return { inContentBlocks: 3, stickySidebar: false, mobileFirstScreenAds: false };
  }
  return DEFAULT_LAYOUT;
}

export function buildRsyScriptUrl(partnerId: string): string {
  return `https://yandex.ru/ads/system/context.js`;
}

export function buildRsyBlockHtml(blockId: string, partnerId: string): string {
  return `<div id="yandex_rtb_${blockId}"></div>
<script>
window.yaContextCb=window.yaContextCb||[];
window.yaContextCb.push(function(){
  Ya.Context.AdvManager.render({
    blockId: "${blockId}",
    renderTo: "yandex_rtb_${blockId}",
    async: true
  });
});
</script>`;
}

export function injectInContentAds(
  htmlContent: string,
  blockIds: string[],
  config: LayoutConfig
): string {
  const paragraphs = htmlContent.split(/(<\/p>)/i);
  let pCount = 0;
  let blockIndex = 0;
  const maxBlocks = Math.min(config.inContentBlocks, blockIds.length);
  const result: string[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    result.push(paragraphs[i]);
    if (/^<\/p>$/i.test(paragraphs[i])) {
      pCount++;
      if (blockIndex < maxBlocks && pCount === (blockIndex + 1) * 2) {
        const id = blockIds[blockIndex];
        result.push(
          `<div class="rsy-in-content" data-rsy-slot="in-content" data-block-id="${id}"></div>`
        );
        blockIndex++;
      }
    }
  }

  return result.join("");
}
