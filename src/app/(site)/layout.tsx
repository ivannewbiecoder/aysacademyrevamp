import { Analytics } from "@/components/site/analytics";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="konten" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
      <Analytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
    </>
  );
}
