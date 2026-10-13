"use client";

import { useRef, useState, useTransition } from "react";
import { previewMarkdown } from "@/app/admin/actions";
import { TextArea } from "./fields";

/** Markdown textarea with a server-rendered preview (same sanitizer as the public site). */
export function MarkdownField(props: { name: string; label: string; defaultValue?: string | null; rows?: number; hint?: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div ref={wrapper} className="field--wide" style={{ display: "grid", gap: 10 }}>
      <TextArea {...props} code />
      <div className="admin-actions">
        <button
          type="button"
          className="button button--light button--small"
          disabled={pending}
          onClick={() => {
            const value = wrapper.current?.querySelector("textarea")?.value ?? "";
            start(async () => setHtml(await previewMarkdown(value)));
          }}
        >
          {pending ? "Memuat…" : "Pratinjau"}
        </button>
        {html !== null && (
          <button type="button" className="button button--plain button--small" onClick={() => setHtml(null)}>
            Tutup pratinjau
          </button>
        )}
      </div>
      {html !== null && (
        // Server-sanitized by renderMarkdown.
        <div className="preview-panel prose" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}
