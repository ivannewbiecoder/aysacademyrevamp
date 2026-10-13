"use client";

import Script from "next/script";
import { useEffect } from "react";

type Gtag = (...args: unknown[]) => void;

/** Send a GA4 event when analytics is configured; a no-op otherwise. */
export function trackEvent(name: string, params: Record<string, string | number> = {}) {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag === "function") gtag("event", name, params);
}

/** Classify outbound clicks into the conversions the SEO team reports on. */
function eventForLink(a: HTMLAnchorElement): string | null {
  if (a.dataset.track) return a.dataset.track;
  const href = a.href;
  if (href.includes("diagnostik.aysacademy.id")) return "diagnostik_click";
  if (href.includes("tryout.aysacademy.id")) return "tryout_click";
  if (href.startsWith("https://wa.me/")) return "whatsapp_click";
  return null;
}

export function Analytics({ gaId }: { gaId?: string }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!(a instanceof HTMLAnchorElement)) return;
      const name = eventForLink(a);
      if (name) trackEvent(name, { link_url: a.href, page_path: window.location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  if (!gaId || !/^G-[A-Z0-9]{4,12}$/.test(gaId)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
