"use client";

import { useEffect, useRef, useState } from "react";
import type { RsySlot } from "../placement";
import { PLACEMENT_RULES } from "../placement";

declare global {
  interface Window {
    yaContextCb?: Array<() => void>;
    Ya?: {
      Context?: {
        AdvManager?: {
          render: (opts: {
            blockId: string;
            renderTo: string;
            async?: boolean;
          }) => void;
        };
      };
    };
  }
}

export interface RsyBlockProps {
  blockId: string;
  slot: RsySlot;
  partnerId?: string;
  className?: string;
  isMobile?: boolean;
}

export function RsyBlock({
  blockId,
  slot,
  partnerId,
  className = "",
  isMobile = false,
}: RsyBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const rules = PLACEMENT_RULES[slot];

  useEffect(() => {
    if (isMobile && !rules.mobile) return;
    if (!isMobile && slot === "sidebar" && !rules.desktop) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "100px",
        threshold: rules.minScrollDepth ?? 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile, rules, slot]);

  useEffect(() => {
    if (!visible || !blockId) return;

    const renderTo = `yandex_rtb_${blockId}`;
    const container = containerRef.current;
    if (!container) return;

    container.id = renderTo;

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
      window.Ya?.Context?.AdvManager?.render({
        blockId,
        renderTo,
        async: true,
      });
    });
  }, [visible, blockId]);

  if (isMobile && !rules.mobile) return null;
  if (slot === "header" && isMobile) return null;

  return (
    <div
      ref={containerRef}
      className={`rsy-block rsy-block--${slot} ${className}`}
      data-rsy-slot={slot}
      data-block-id={blockId}
      data-partner-id={partnerId}
      aria-label="Реклама"
    />
  );
}

export function RsyScriptLoader({ partnerId }: { partnerId?: string }) {
  useEffect(() => {
    if (!partnerId) return;
    if (document.querySelector('script[data-rsy-context]')) return;

    const script = document.createElement("script");
    script.src = "https://yandex.ru/ads/system/context.js";
    script.async = true;
    script.dataset.rsyContext = "true";
    document.head.appendChild(script);
  }, [partnerId]);

  return null;
}
