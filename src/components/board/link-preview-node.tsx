"use client";

import { useEffect, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { ExternalLink } from "lucide-react";
import { getLinkPreview, type LinkPreviewData } from "@/lib/actions/link-preview";

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function LinkPreviewView({ node }: ReactNodeViewProps) {
  const url = node.attrs.url as string;
  const hostname = getHostname(url);
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [prevUrl, setPrevUrl] = useState(url);

  if (url !== prevUrl) {
    setPrevUrl(url);
    setStatus("loading");
    setData(null);
  }

  useEffect(() => {
    let cancelled = false;
    getLinkPreview(url).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setData(result.data);
        setStatus("ok");
      } else {
        setStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <NodeViewWrapper contentEditable={false} className="my-1">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-md border border-border-default bg-bg-surface p-3 no-underline transition-colors hover:bg-bg-muted"
      >
        {status === "loading" && (
          <div className="h-10 flex-1 animate-pulse rounded bg-bg-muted" />
        )}
        {status === "error" && (
          <>
            <ExternalLink className="size-4 shrink-0 text-text-tertiary" />
            <span className="min-w-0 flex-1 truncate text-small text-text-primary">
              {hostname}
            </span>
          </>
        )}
        {status === "ok" && data && (
          <>
            {data.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.image} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-small font-medium text-text-primary">
                {data.title ?? hostname}
              </p>
              {data.description && (
                <p className="truncate text-mini text-text-tertiary">{data.description}</p>
              )}
              <div className="mt-0.5 flex items-center gap-1.5 text-mini text-text-tertiary">
                {data.favicon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.favicon} alt="" className="size-3.5" />
                )}
                <span className="min-w-0 truncate">{hostname}</span>
              </div>
            </div>
          </>
        )}
      </a>
    </NodeViewWrapper>
  );
}

export const LinkPreview = Node.create({
  name: "linkPreview",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="link-preview"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "link-preview" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkPreviewView);
  },
});
