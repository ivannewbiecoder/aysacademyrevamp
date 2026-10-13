import { serializeJsonLd } from "@/lib/seo";

type Data = Record<string, unknown> | null | undefined;

/** Renders one or more schema.org objects as a JSON-LD script. */
export function JsonLd({ data }: { data: Data | Data[] }) {
  const items = (Array.isArray(data) ? data : [data]).filter((d): d is Record<string, unknown> => !!d);
  if (!items.length) return null;
  return (
    <script
      type="application/ld+json"
      // Safe: serializeJsonLd escapes "<" so the payload cannot close the script tag.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(items.length === 1 ? items[0] : items) }}
    />
  );
}
