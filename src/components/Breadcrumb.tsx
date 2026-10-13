import Link from "next/link";
import { Fragment } from "react";
import { breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "./JsonLd";

export type Crumb = { name: string; path: string };

/** Visible breadcrumb plus matching BreadcrumbList structured data. The last crumb is the current page. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const all = [{ name: "Beranda", path: "/" }, ...items];
  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        {all.map((item, i) => (
          <Fragment key={item.path}>
            {i > 0 && " / "}
            {i < all.length - 1 ? (
              <Link href={item.path}>{item.name}</Link>
            ) : (
              <span aria-current="page">{item.name}</span>
            )}
          </Fragment>
        ))}
      </nav>
      <JsonLd data={breadcrumbJsonLd(all)} />
    </>
  );
}
