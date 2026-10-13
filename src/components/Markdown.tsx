import { renderMarkdown } from "@/lib/markdown";

/**
 * Server-rendered markdown. renderMarkdown drops raw HTML and sanitizes the
 * output (see lib/markdown.ts), so injecting the result is safe.
 */
export function Markdown({ source, className = "prose" }: { source: string; className?: string }) {
  if (!source?.trim()) return null;
  return <div className={className} dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }} />;
}
